import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Conversation, Message } from '../types'
import { loadAll, saveAll, type IndexRecord } from '../utils/storage'

// ใช้ฟังก์ชัน uuid มาตรฐานของเบราว์เซอร์
const uuid = () => crypto.randomUUID()

function newConversation(): Conversation {
  const id = uuid()
  const now = Date.now()
  return { id, title: 'สนทนาใหม่', createdAt: now, updatedAt: now, messages: [], model: 'gpt-5' }
}

type ChatCtxType = {
  conversations: Record<string, Conversation>
  currentId: string | null
  setCurrentId: (id: string) => void
  index: IndexRecord
  addMessage: (msg: Omit<Message, 'id'>) => void
  startAssistant: () => string // returns assistant message id
  appendAssistantDelta: (id: string, delta: string) => void
  endAssistant: () => void
  newChat: () => void
  deleteChat: (id: string) => void
  deleteAll: () => void
  renameChat: (id: string, title: string) => void
  replaceConversations: (next: Record<string, Conversation>) => void
}

const ChatCtx = createContext<ChatCtxType | null>(null)

export function useChat() {
  const ctx = useContext(ChatCtx)
  if (!ctx) throw new Error('ChatCtx missing')
  return ctx
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Record<string, Conversation>>({})
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [index, setIndex] = useState<IndexRecord>({
    useDB: false,
    settings: undefined as any,
    sessionIds: [],
  })

  // โหลดข้อมูลเก่า
  useEffect(() => {
    ;(async () => {
      const { index: idx, conversations: convs } = await loadAll()
      let index0 = idx
      let conversations0 = convs
      if (!index0) {
        const conv = newConversation()
        index0 = { useDB: false, settings: ({} as any), sessionIds: [conv.id] }
        conversations0 = { [conv.id]: conv }
      }
      setIndex(index0)
      setConversations(conversations0)
      setCurrentId(index0.sessionIds[0] ?? Object.keys(conversations0)[0] ?? null)
    })()
  }, [])

  // ฟังก์ชันบันทึก
  const save = async (nextConv: Record<string, Conversation>, nextIdx?: IndexRecord) => {
    const idx = nextIdx ?? index
    await saveAll(idx, nextConv)
    setConversations(nextConv)
    if (nextIdx) setIndex(nextIdx)
  }

  const newChat = () => {
    const conv = newConversation()
    const next = { ...conversations, [conv.id]: conv }
    const nextIdx = { ...index, sessionIds: [conv.id, ...index.sessionIds] }
    setCurrentId(conv.id)
    void save(next, nextIdx)
  }

  const deleteChat = (id: string) => {
    const next = { ...conversations }
    delete next[id]
    const nextIds = index.sessionIds.filter((x) => x !== id)
    const nextIdx = { ...index, sessionIds: nextIds }
    const nextCurrent = nextIds[0] ?? null
    setCurrentId(nextCurrent)
    void save(next, nextIdx)
  }

  const deleteAll = () => {
    const conv = newConversation()
    const next = { [conv.id]: conv }
    const nextIdx = { ...index, sessionIds: [conv.id] }
    setCurrentId(conv.id)
    void save(next, nextIdx)
  }

  const renameChat = (id: string, title: string) => {
    const conv = conversations[id]
    if (!conv) return
    const next = {
      ...conversations,
      [id]: { ...conv, title, updatedAt: Date.now() },
    }
    void save(next)
  }

  const addMessage = (msg: Omit<Message, 'id'>) => {
    if (!currentId) return
    const id = uuid()
    const conv = conversations[currentId]
    const nextConv = {
      ...conv,
      updatedAt: Date.now(),
      messages: [...conv.messages, { ...msg, id }],
    }
    const next = { ...conversations, [currentId]: nextConv }
    void save(next)
  }

  const startAssistant = () => {
    if (!currentId) return ''
    const id = uuid()
    const conv = conversations[currentId]
    const nextConv: Conversation = {
      ...conv,
      updatedAt: Date.now(),
      messages: [...conv.messages, { id, role: 'assistant', content: '' }],
    }
    const next: Record<string, Conversation> = { ...conversations, [currentId]: nextConv }
    void save(next)
    return id
  }

  const appendAssistantDelta = (id: string, delta: string) => {
    if (!currentId) return
    const conv = conversations[currentId]
    const nextMsgs = conv.messages.map((m) =>
      m.id === id ? { ...m, content: m.content + delta } : m
    )
    const next = {
      ...conversations,
      [currentId]: { ...conv, messages: nextMsgs, updatedAt: Date.now() },
    }
    setConversations(next) // update UI ทันที
  }

  const endAssistant = () => {
    if (!currentId) return
    const conv = conversations[currentId]
    const next: Record<string, Conversation> = {
      ...conversations,
      [currentId]: { ...conv, updatedAt: Date.now() },
    }
    void save(next)
  }

  const replaceConversations = (nextConvs: Record<string, Conversation>) => {
    const nextIds = Object.keys(nextConvs).sort(
      (a, b) => nextConvs[b].updatedAt - nextConvs[a].updatedAt
    )
    const nextIdx = { ...index, sessionIds: nextIds }
    setCurrentId(nextIdx.sessionIds[0] ?? null)
    void save(nextConvs, nextIdx)
  }

  const value = useMemo(
    () => ({
      conversations,
      currentId,
      setCurrentId,
      index,
      addMessage,
      startAssistant,
      appendAssistantDelta,
      endAssistant,
      newChat,
      deleteChat,
      deleteAll,
      renameChat,
      replaceConversations,
    }),
    [conversations, currentId, index]
  )

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>
}
