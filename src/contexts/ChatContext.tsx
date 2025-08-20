import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { Conversation, Message, OpenAIUsage } from '../types'
import { loadAll, saveAll, type IndexRecord } from '../utils/storage'
import { logger } from '../utils/logger'
import { useSettings } from './SettingsContext'

// ใช้ฟังก์ชัน uuid มาตรฐานของเบราว์เซอร์
const uuid = (): string => crypto.randomUUID()

const newConversation = (): Conversation => {
  const id = uuid()
  const now = Date.now()
  return { id, title: 'สนทนาใหม่', createdAt: now, updatedAt: now, messages: [], model: 'gpt-5' }
}

// State types
interface ChatState {
  conversations: Record<string, Conversation>
  currentId: string | null
  index: IndexRecord
  isLoading: boolean
  error: string | null
}

// Action types
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_DATA'; payload: { conversations: Record<string, Conversation>; index: IndexRecord; currentId: string | null } }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: string | null }
  | { type: 'CREATE_CONVERSATION'; payload: Conversation }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'DELETE_ALL_CONVERSATIONS' }
  | { type: 'RENAME_CONVERSATION'; payload: { id: string; title: string } }
  | { type: 'ADD_USER_MESSAGE'; payload: { conversationId: string; content: string; tokens: number } }
  | { type: 'START_ASSISTANT_MESSAGE'; payload: { conversationId: string; messageId: string } }
  | { type: 'APPEND_ASSISTANT_DELTA'; payload: { conversationId: string; messageId: string; delta: string } }
  | { type: 'UPDATE_ASSISTANT_USAGE'; payload: { conversationId: string; messageId: string; usage: OpenAIUsage } }
  | { type: 'COMPLETE_ASSISTANT_MESSAGE'; payload: { conversationId: string } }
  | { type: 'REPLACE_CONVERSATIONS'; payload: Record<string, Conversation> }

// Initial state
const initialState: ChatState = {
  conversations: {},
  currentId: null,
  index: {
    useDB: false,
    settings: undefined as any,
    sessionIds: [],
  },
  isLoading: false,
  error: null
}

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'LOAD_DATA':
      return {
        ...state,
        conversations: action.payload.conversations,
        index: action.payload.index,
        currentId: action.payload.currentId
      }
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentId: action.payload }
    
    case 'CREATE_CONVERSATION': {
      const conversation = action.payload
      const newSessionIds = [conversation.id, ...state.index.sessionIds]
      return {
        ...state,
        conversations: { ...state.conversations, [conversation.id]: conversation },
        index: { ...state.index, sessionIds: newSessionIds },
        currentId: conversation.id
      }
    }
    
    case 'DELETE_CONVERSATION': {
      const { [action.payload]: deleted, ...remainingConversations } = state.conversations
      const newSessionIds = state.index.sessionIds.filter(id => id !== action.payload)
      const newCurrentId = state.currentId === action.payload ? (newSessionIds[0] || null) : state.currentId
      return {
        ...state,
        conversations: remainingConversations,
        index: { ...state.index, sessionIds: newSessionIds },
        currentId: newCurrentId
      }
    }
    
    case 'DELETE_ALL_CONVERSATIONS': {
      const conv = newConversation()
      return {
        ...state,
        conversations: { [conv.id]: conv },
        index: { ...state.index, sessionIds: [conv.id] },
        currentId: conv.id
      }
    }
    
    case 'RENAME_CONVERSATION': {
      const { id, title } = action.payload
      const conversation = state.conversations[id]
      if (!conversation) return state
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [id]: { ...conversation, title, updatedAt: Date.now() }
        }
      }
    }
    
    case 'ADD_USER_MESSAGE': {
      const { conversationId, content, tokens } = action.payload
      const conversation = state.conversations[conversationId]
      if (!conversation) return state
      
      const messageId = uuid()
      const message: Message = {
        id: messageId,
        role: 'user',
        content,
        tokens
      }
      
      const nextTitle = conversation.messages.length === 0 
        ? (content.split('\n')[0].slice(0, 60) || 'สนทนาใหม่')
        : conversation.title
      
      const updatedConversation: Conversation = {
        ...conversation,
        title: nextTitle,
        messages: [...conversation.messages, message],
        updatedAt: Date.now()
      }
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: updatedConversation
        }
      }
    }
    
    case 'START_ASSISTANT_MESSAGE': {
      const { conversationId, messageId } = action.payload
      const conversation = state.conversations[conversationId]
      if (!conversation) return state
      
      const message: Message = {
        id: messageId,
        role: 'assistant',
        content: '',
        tokens: 0
      }
      
      const updatedConversation: Conversation = {
        ...conversation,
        messages: [...conversation.messages, message],
        updatedAt: Date.now()
      }
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: updatedConversation
        }
      }
    }
    
    case 'APPEND_ASSISTANT_DELTA': {
      const { conversationId, messageId, delta } = action.payload
      const conversation = state.conversations[conversationId]
      if (!conversation) return state
      
      const updatedMessages = conversation.messages.map(msg =>
        msg.id === messageId 
          ? { ...msg, content: msg.content + delta }
          : msg
      )
      
      const updatedConversation: Conversation = {
        ...conversation,
        messages: updatedMessages,
        updatedAt: Date.now()
      }
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: updatedConversation
        }
      }
    }
    
    case 'UPDATE_ASSISTANT_USAGE': {
      const { conversationId, messageId, usage } = action.payload
      const conversation = state.conversations[conversationId]
      if (!conversation) return state
      
      const updatedMessages = conversation.messages.map(msg =>
        msg.id === messageId 
          ? { ...msg, usage, tokens: usage.completion_tokens }
          : msg
      )
      
      const updatedConversation: Conversation = {
        ...conversation,
        messages: updatedMessages,
        updatedAt: Date.now()
      }
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: updatedConversation
        }
      }
    }
    
    case 'COMPLETE_ASSISTANT_MESSAGE': {
      const { conversationId } = action.payload
      const conversation = state.conversations[conversationId]
      if (!conversation) return state
      
      const updatedConversation: Conversation = {
        ...conversation,
        updatedAt: Date.now()
      }
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: updatedConversation
        }
      }
    }
    
    case 'REPLACE_CONVERSATIONS': {
      const conversations = action.payload
      const sessionIds = Object.keys(conversations).sort(
        (a, b) => conversations[b].updatedAt - conversations[a].updatedAt
      )
      return {
        ...state,
        conversations,
        index: { ...state.index, sessionIds },
        currentId: sessionIds[0] || null
      }
    }
    
    default:
      return state
  }
}

// Context type
type ChatCtxType = {
  state: ChatState
  actions: {
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setCurrentConversation: (id: string | null) => void
    createConversation: () => void
    deleteConversation: (id: string) => void
    deleteAllConversations: () => void
    renameConversation: (id: string, title: string) => void
    addUserMessage: (content: string, tokens: number) => string
    startAssistantMessage: () => string
    appendAssistantDelta: (messageId: string, delta: string) => void
    updateAssistantUsage: (messageId: string, usage: OpenAIUsage) => void
    completeAssistantMessage: () => void
    replaceConversations: (conversations: Record<string, Conversation>) => void
  }
}

const ChatCtx = createContext<ChatCtxType | null>(null)

export function useChat() {
  const ctx = useContext(ChatCtx)
  if (!ctx) throw new Error('ChatCtx missing')
  return ctx
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const { settings, setSettings } = useSettings()

  // โหลดข้อมูลเก่า
  useEffect(() => {
    const loadData = async () => {
      try {
        const { index: idx, conversations: convs } = await loadAll()
        let index0: IndexRecord = idx ?? { useDB: false, settings: settings as any, sessionIds: [] }
        let conversations0 = convs
        
        // บูตสแตรป: หากไม่มี index หรือไม่มี sessionIds หรือไม่มีข้อมูลห้อง ให้สร้างห้องใหม่
        if ((index0.sessionIds?.length ?? 0) === 0 || Object.keys(conversations0 || {}).length === 0) {
          const conv = newConversation()
          index0 = { 
            useDB: index0.useDB ?? false, 
            settings: (index0.settings as any) ?? (settings as any), 
            sessionIds: [conv.id] 
          }
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
        
        const currentId = index0.sessionIds[0] ?? Object.keys(conversations0)[0] ?? null
        
        dispatch({
          type: 'LOAD_DATA',
          payload: { conversations: conversations0, index: index0, currentId }
        })
        
        logger.info('app', 'โหลดข้อมูลเริ่มต้นเสร็จสิ้น', { sessions: index0.sessionIds.length })
      } catch (error) {
        logger.error('app', 'โหลดข้อมูลเริ่มต้นล้มเหลว', { error: String(error) })
        dispatch({ type: 'SET_ERROR', payload: 'โหลดข้อมูลล้มเหลว' })
      }
    }
    
    loadData()
  }, [])

  // บันทึกข้อมูลเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const saveData = async () => {
      if (Object.keys(state.conversations).length === 0) return
      
      try {
        const idx = { ...state.index, settings: settings as any }
        await saveAll(idx, state.conversations)
      } catch (error) {
        logger.error('storage', 'บันทึกข้อมูลล้มเหลว', { error: String(error) })
      }
    }
    
    saveData()
  }, [state.conversations, state.index, settings])

  // เมื่อผู้ใช้เปลี่ยน settings ให้ trigger บันทึกขึ้นเซิร์ฟเวอร์ด้วย
  useEffect(() => {
    if (Object.keys(state.conversations).length === 0) return
    const nextIdx = { ...state.index, settings: settings as any }
    void saveAll(nextIdx, state.conversations)
  }, [settings, state.conversations, state.index])

  // Actions
  const actions = {
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    }, []),
    
    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    }, []),
    
    setCurrentConversation: useCallback((id: string | null) => {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: id })
    }, []),
    
    createConversation: useCallback(() => {
      const conv = newConversation()
      dispatch({ type: 'CREATE_CONVERSATION', payload: conv })
      logger.info('chat', 'สร้างห้องใหม่', { id: conv.id })
    }, []),
    
    deleteConversation: useCallback((id: string) => {
      dispatch({ type: 'DELETE_CONVERSATION', payload: id })
      logger.warn('chat', 'ลบห้อง', { id })
    }, []),
    
    deleteAllConversations: useCallback(() => {
      dispatch({ type: 'DELETE_ALL_CONVERSATIONS' })
      logger.warn('chat', 'ลบทั้งหมดและสร้างห้องใหม่')
    }, []),
    
    renameConversation: useCallback((id: string, title: string) => {
      dispatch({ type: 'RENAME_CONVERSATION', payload: { id, title } })
      logger.info('chat', 'เปลี่ยนชื่อห้อง', { id, title })
    }, []),
    
    addUserMessage: useCallback((content: string, tokens: number) => {
      if (!state.currentId) {
        logger.warn('chat', 'พยายามเพิ่มข้อความขณะยังไม่มีห้อง')
        return ''
      }
      
      const messageId = uuid()
      dispatch({ 
        type: 'ADD_USER_MESSAGE', 
        payload: { conversationId: state.currentId, content, tokens } 
      })
      logger.info('message', 'เพิ่มข้อความผู้ใช้', { 
        conversationId: state.currentId, 
        content: content.slice(0, 50),
        tokens 
      })
      return messageId
    }, [state.currentId]),
    
    startAssistantMessage: useCallback(() => {
      if (!state.currentId) {
        logger.warn('chat', 'พยายามเริ่ม assistant message ขณะยังไม่มีห้อง')
        return ''
      }
      
      const messageId = uuid()
      dispatch({ 
        type: 'START_ASSISTANT_MESSAGE', 
        payload: { conversationId: state.currentId, messageId } 
      })
      logger.debug('assistant', 'เริ่ม assistant message', { 
        messageId, 
        conversationId: state.currentId 
      })
      return messageId
    }, [state.currentId]),
    
    appendAssistantDelta: useCallback((messageId: string, delta: string) => {
      if (!state.currentId) return
      
      dispatch({ 
        type: 'APPEND_ASSISTANT_DELTA', 
        payload: { conversationId: state.currentId, messageId, delta } 
      })
      logger.debug('assistant', 'สตรีม delta', { messageId, bytes: delta.length })
    }, [state.currentId]),
    
    updateAssistantUsage: useCallback((messageId: string, usage: OpenAIUsage) => {
      if (!state.currentId) return
      
      dispatch({ 
        type: 'UPDATE_ASSISTANT_USAGE', 
        payload: { conversationId: state.currentId, messageId, usage } 
      })
      logger.info('assistant', 'อัปเดต usage', { 
        messageId, 
        prompt_tokens: usage.prompt_tokens, 
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      })
    }, [state.currentId]),
    
    completeAssistantMessage: useCallback(() => {
      if (!state.currentId) return
      
      dispatch({ 
        type: 'COMPLETE_ASSISTANT_MESSAGE', 
        payload: { conversationId: state.currentId } 
      })
      logger.info('assistant', 'จบ assistant message', { conversationId: state.currentId })
    }, [state.currentId]),
    
    replaceConversations: useCallback((conversations: Record<string, Conversation>) => {
      dispatch({ type: 'REPLACE_CONVERSATIONS', payload: conversations })
      logger.info('chat', 'แทนที่ห้องสนทนาทั้งหมด', { count: Object.keys(conversations).length })
    }, [])
  }

  const value = {
    state,
    actions
  }

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>
}
