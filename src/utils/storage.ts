import type { Conversation, Settings } from '../types'
import { logger } from './logger'

const STORAGE_KEY = 'ai-chat-data'

export type StorageData = {
  conversations: Record<string, Conversation>
  settings: Settings
  currentConversationId: string | null
}

export class StorageService {
  static async load(): Promise<StorageData> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as StorageData
        logger.info('storage', 'โหลดข้อมูลสำเร็จ', { 
          conversationsCount: Object.keys(data.conversations || {}).length 
        })
        return data
      }
    } catch (error) {
      logger.error('storage', 'โหลดข้อมูลล้มเหลว', { error: String(error) })
    }

    // ค่าเริ่มต้น
    return {
      conversations: {},
      settings: {
        apiKey: '',
        systemPrompt: '',
        model: 'gpt-4o',
        inPricePerK: 0.005,
        outPricePerK: 0.015,
        theme: 'light'
      },
      currentConversationId: null
    }
  }

  static async save(data: StorageData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      logger.info('storage', 'บันทึกข้อมูลสำเร็จ', { 
        conversationsCount: Object.keys(data.conversations).length 
      })
    } catch (error) {
      logger.error('storage', 'บันทึกข้อมูลล้มเหลว', { error: String(error) })
      throw error
    }
  }

  static async saveConversations(conversations: Record<string, Conversation>): Promise<void> {
    const data = await this.load()
    data.conversations = conversations
    await this.save(data)
  }

  static async saveSettings(settings: Settings): Promise<void> {
    const data = await this.load()
    data.settings = settings
    await this.save(data)
  }

  static async saveCurrentConversationId(id: string | null): Promise<void> {
    const data = await this.load()
    data.currentConversationId = id
    await this.save(data)
  }

  static async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY)
      logger.info('storage', 'ล้างข้อมูลสำเร็จ')
    } catch (error) {
      logger.error('storage', 'ล้างข้อมูลล้มเหลว', { error: String(error) })
      throw error
    }
  }

  static exportAsJson(conversations: Record<string, Conversation>): void {
    try {
      const data = {
        conversations,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-chat-export-${new Date().toISOString().slice(0, 19)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      logger.info('storage', 'ส่งออกข้อมูลสำเร็จ')
    } catch (error) {
      logger.error('storage', 'ส่งออกข้อมูลล้มเหลว', { error: String(error) })
      throw error
    }
  }

  static async importFromJson(file: File): Promise<Record<string, Conversation>> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const conversations = data.conversations || {}
      
      // ตรวจสอบความถูกต้องของข้อมูล
      for (const [, conv] of Object.entries(conversations)) {
        if (!conv || typeof conv !== 'object') {
          throw new Error('ข้อมูลไม่ถูกต้อง')
        }
        const conversation = conv as Conversation
        if (!conversation.id || !conversation.title || !Array.isArray(conversation.messages)) {
          throw new Error('โครงสร้างข้อมูลไม่ถูกต้อง')
        }
      }
      
      logger.info('storage', 'นำเข้าข้อมูลสำเร็จ', { conversationsCount: Object.keys(conversations).length })
      return conversations as Record<string, Conversation>
    } catch (error) {
      logger.error('storage', 'นำเข้าข้อมูลล้มเหลว', { error: String(error) })
      throw error
    }
  }
}
