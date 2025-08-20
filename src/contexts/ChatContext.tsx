import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { Conversation, Message, ChatState } from '../types'
import { StorageService } from '../utils/storage'
import { logger } from '../utils/logger'

// Action types
type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: Record<string, Conversation> }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { conversationId: string; messageId: string; content: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CREATE_CONVERSATION'; payload: Conversation }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'LOAD_DATA'; payload: { conversations: Record<string, Conversation>; currentConversationId: string | null } }

// Initial state
const initialState: ChatState = {
  conversations: {},
  currentConversationId: null,
  isLoading: false,
  error: null
}

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'LOAD_DATA':
      return { 
        ...state, 
        conversations: action.payload.conversations,
        currentConversationId: action.payload.currentConversationId
      }
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload }
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversationId: action.payload }
    
    case 'ADD_MESSAGE': {
      const { conversationId, message } = action.payload
      const conversation = state.conversations[conversationId]
      if (!conversation) return state
      
      const updatedConversation = {
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
    
    case 'UPDATE_MESSAGE': {
      const { conversationId, messageId, content } = action.payload
      const conversation = state.conversations[conversationId]
      if (!conversation) return state
      
      const updatedMessages = conversation.messages.map(msg =>
        msg.id === messageId ? { ...msg, content } : msg
      )
      
      const updatedConversation = {
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
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'CREATE_CONVERSATION': {
      const conversation = action.payload
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversation.id]: conversation
        },
        currentConversationId: conversation.id
      }
    }
    
    case 'DELETE_CONVERSATION': {
      const { [action.payload]: deleted, ...remaining } = state.conversations
      return {
        ...state,
        conversations: remaining,
        currentConversationId: state.currentConversationId === action.payload ? null : state.currentConversationId
      }
    }
    
    default:
      return state
  }
}

// Context
const ChatContext = createContext<{
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  actions: {
    createConversation: () => string
    addMessage: (conversationId: string, role: 'user' | 'assistant', content: string) => string
    updateMessage: (conversationId: string, messageId: string, content: string) => void
    setCurrentConversation: (id: string | null) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    deleteConversation: (id: string) => void
  }
} | null>(null)

// Provider
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await StorageService.load()
        dispatch({ 
          type: 'LOAD_DATA', 
          payload: { 
            conversations: data.conversations, 
            currentConversationId: data.currentConversationId 
          } 
        })
        logger.info('chat', 'โหลดข้อมูลเริ่มต้นเสร็จสิ้น')
      } catch (error) {
        logger.error('chat', 'โหลดข้อมูลเริ่มต้นล้มเหลว', { error: String(error) })
      }
    }
    loadData()
  }, [])

  // บันทึกข้อมูลเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const saveData = async () => {
      try {
        await StorageService.saveConversations(state.conversations)
        await StorageService.saveCurrentConversationId(state.currentConversationId)
      } catch (error) {
        logger.error('chat', 'บันทึกข้อมูลล้มเหลว', { error: String(error) })
      }
    }
    saveData()
  }, [state.conversations, state.currentConversationId])

  const createConversation = useCallback(() => {
    const id = crypto.randomUUID()
    const conversation: Conversation = {
      id,
      title: 'สนทนาใหม่',
      messages: [],
      model: 'gpt-4o',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    dispatch({ type: 'CREATE_CONVERSATION', payload: conversation })
    logger.info('chat', 'สร้างห้องสนทนาใหม่', { id })
    return id
  }, [])

  const addMessage = useCallback((conversationId: string, role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      createdAt: Date.now()
    }
    
    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message } })
    logger.info('chat', 'เพิ่มข้อความ', { conversationId, role, content: content.slice(0, 50) })
    return message.id
  }, [])

  const updateMessage = useCallback((conversationId: string, messageId: string, content: string) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { conversationId, messageId, content } })
  }, [])

  const setCurrentConversation = useCallback((id: string | null) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: id })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id })
    logger.info('chat', 'ลบห้องสนทนา', { id })
  }, [])

  const actions = {
    createConversation,
    addMessage,
    updateMessage,
    setCurrentConversation,
    setLoading,
    setError,
    deleteConversation
  }

  return (
    <ChatContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </ChatContext.Provider>
  )
}

// Hook
export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
