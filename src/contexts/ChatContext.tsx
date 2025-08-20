import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Conversation, Message } from '../types'
import { loadAll, saveAll, type IndexRecord } from '../utils/storage'
import { logger } from '../utils/logger'
import { useSettings } from './SettingsContext'

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
  addUserAndStartAssistant: (msg: Omit<Message, 'id'>) => string
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
  const { settings, setSettings } = useSettings()

  // โหลดข้อมูลเก่า
  useEffect(() => {
    ;(async () => {
      const { index: idx, conversations: convs } = await loadAll()
      let index0: IndexRecord = idx ?? { useDB: false, settings: settings as any, sessionIds: [] }
      let conversations0 = convs
      // บูตสแตรป: หากไม่มี index หรือไม่มี sessionIds หรือไม่มีข้อมูลห้อง ให้สร้างห้องใหม่
      if ((index0.sessionIds?.length ?? 0) === 0 || Object.keys(conversations0 || {}).length === 0) {
        const conv = newConversation()
        index0 = { useDB: index0.useDB ?? false, settings: (index0.settings as any) ?? (settings as any), sessionIds: [conv.id] }
        conversations0 = { [conv.id]: conv }
      }
      // ทำความสะอาด sessionIds ที่ไม่ตรงกับห้องจริง
      const validIds = (index0.sessionIds || []).filter(id => !!conversations0[id])
      if (validIds.length !== index0.sessionIds.length) {
        index0 = { ...index0, sessionIds: (validIds.length ? validIds : Object.keys(conversations0)) }
      }
      // ซิงค์ settings จากเซิร์ฟเวอร์เข้ากับ SettingsContext ถ้ามี
      try {
        if (index0.settings) {
          setSettings(s => ({ ...s, ...index0.settings }))
        } else {
          // หาก index ไม่มี settings ให้ฝังค่าปัจจุบันลงไปเพื่อให้ถูกบันทึกขึ้นเซิร์ฟเวอร์ครั้งถัดไป
          index0 = { ...index0, settings: settings as any }
        }
      } catch {}
      setIndex(index0)
      setConversations(conversations0)
      setCurrentId(index0.sessionIds[0] ?? Object.keys(conversations0)[0] ?? null)
      logger.info('app', 'โหลดข้อมูลเริ่มต้นเสร็จสิ้น', { sessions: index0.sessionIds.length })
    })()
  }, [])

  // ฟังก์ชันบันทึก
  const save = async (nextConv: Record<string, Conversation>, nextIdx?: IndexRecord) => {
    // แนบ settings ปัจจุบันเข้า index ก่อนบันทึกเพื่อเซิร์ฟเวอร์เก็บค่าตั้งค่า
    const idx = { ...(nextIdx ?? index), settings: settings as any }
    // อัปเดต UI ทันที จากนั้นค่อยบันทึกแบบพื้นหลัง
    setConversations(nextConv)
    console.log('ChatContext: save - updating conversations state:', { 
      conversationsCount: Object.keys(nextConv).length,
      currentId,
      currentMessagesCount: nextConv[currentId!]?.messages?.length || 0
    })
    if (nextIdx) setIndex(nextIdx)
    try {
      await saveAll(idx, nextConv)
    } catch (e) {
      logger.error('storage', 'บันทึกข้อมูลล้มเหลว', { error: String(e) })
    }
  }

  // เมื่อผู้ใช้เปลี่ยน settings ให้ trigger บันทึกขึ้นเซิร์ฟเวอร์ด้วย (ถ้ามีข้อมูลห้องแล้ว)
  useEffect(() => {
    if (Object.keys(conversations).length === 0) return
    const nextIdx = { ...index, settings: settings as any }
    void save(conversations, nextIdx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  const newChat = () => {
    const conv = newConversation()
    const next = { ...conversations, [conv.id]: conv }
    const nextIdx = { ...index, sessionIds: [conv.id, ...index.sessionIds] }
    setCurrentId(conv.id)
    void save(next, nextIdx)
    logger.info('chat', 'สร้างห้องใหม่', { id: conv.id })
  }

  const deleteChat = (id: string) => {
    const next = { ...conversations }
    delete next[id]
    const nextIds = index.sessionIds.filter((x) => x !== id)
    const nextIdx = { ...index, sessionIds: nextIds }
    const nextCurrent = nextIds[0] ?? null
    setCurrentId(nextCurrent)
    void save(next, nextIdx)
    logger.warn('chat', 'ลบห้อง', { id })
  }

  const deleteAll = () => {
    const conv = newConversation()
    const next = { [conv.id]: conv }
    const nextIdx = { ...index, sessionIds: [conv.id] }
    setCurrentId(conv.id)
    void save(next, nextIdx)
    logger.warn('chat', 'ลบทั้งหมดและสร้างห้องใหม่', { keepId: conv.id })
  }

  const renameChat = (id: string, title: string) => {
    const conv = conversations[id]
    if (!conv) return
    const next = {
      ...conversations,
      [id]: { ...conv, title, updatedAt: Date.now() },
    }
    void save(next)
    logger.info('chat', 'เปลี่ยนชื่อห้อง', { id, title })
  }

  const addMessage = (msg: Omit<Message, 'id'>) => {
    if (!currentId) return
    const id = uuid()
    const conv = conversations[currentId]
    const nextTitle = conv.messages.length === 0 && msg.role === 'user'
      ? (msg.content.split('\n')[0].slice(0, 60) || 'สนทนาใหม่')
      : conv.title
    const nextConv = {
      ...conv,
      updatedAt: Date.now(),
      title: nextTitle,
      messages: [...conv.messages, { ...msg, id } satisfies Message],
    }
    const next = { ...conversations, [currentId]: nextConv }
    void save(next)
    logger.info('message', 'เพิ่มข้อความ', { conversationId: currentId, role: msg.role, tokens: (msg as any).tokens })
  }

  // ป้องกัน race condition ระหว่างการเพิ่มข้อความผู้ใช้และเริ่ม assistant
  const addUserAndStartAssistant = (msg: Omit<Message, 'id'>) => {
    if (!currentId) return ''
    const userId = uuid()
    const assistId = uuid()
    const conv = conversations[currentId]
    const nextTitle = conv.messages.length === 0 && msg.role === 'user'
      ? (msg.content.split('\n')[0].slice(0, 60) || 'สนทนาใหม่')
      : conv.title
    const nextConv: Conversation = {
      ...conv,
      updatedAt: Date.now(),
      title: nextTitle,
      messages: [
        ...conv.messages,
        { ...msg, id: userId } as Message,
        { id: assistId, role: 'assistant', content: '' } as Message,
      ],
    }
    const next = { ...conversations, [currentId]: nextConv }
    // อัปเดต UI ทันที แล้วค่อยบันทึกแบบพื้นหลัง
    setConversations(next)
    console.log('ChatContext: addUserAndStartAssistant - updating state:', { 
      currentId, 
      oldMessagesCount: conv.messages.length, 
      newMessagesCount: nextConv.messages.length,
      newMessages: nextConv.messages 
    })
    void save(next)
    logger.info('message', 'เพิ่มข้อความ', { conversationId: currentId, role: msg.role, tokens: (msg as any).tokens })
    logger.debug('assistant', 'เริ่ม assistant message', { id: assistId, conversationId: currentId })
    return assistId
  }

  const startAssistant = () => {
    if (!currentId) return ''
    const id = uuid()
    const conv = conversations[currentId]
    const nextConv = {
      ...conv,
      updatedAt: Date.now(),
      messages: [...conv.messages, { id, role: 'assistant', content: '' } satisfies Message],
    }
    const next = { ...conversations, [currentId]: nextConv }
    void save(next)
    logger.debug('assistant', 'เริ่ม assistant message', { id, conversationId: currentId })
    return id
  }

  const appendAssistantDelta = (id: string, delta: string) => {
    if (!currentId) return
    const conv = conversations[currentId]
    const nextMsgs: Message[] = conv.messages.map((m) =>
      m.id === id ? { ...m, content: m.content + delta } : m
    )
    const next = {
      ...conversations,
      [currentId]: { ...conv, messages: nextMsgs, updatedAt: Date.now() },
    }
    setConversations(next) // update UI ทันที
    logger.debug('assistant', 'สตรีม delta', { id, bytes: delta.length })
  }

  const endAssistant = () => {
    if (!currentId) return
    const conv = conversations[currentId]
    const next = {
      ...conversations,
      [currentId]: { ...conv, updatedAt: Date.now() },
    }
    void save(next)
    logger.info('assistant', 'จบ assistant message', { conversationId: currentId })
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
      addUserAndStartAssistant,
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
