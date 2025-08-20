import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Settings } from '../types'
import { StorageService } from '../utils/storage'
import { logger } from '../utils/logger'

const defaultSettings: Settings = {
  apiKey: '',
  systemPrompt: '',
  model: 'gpt-4o',
  inPricePerK: 0.005,
  outPricePerK: 0.015,
  theme: 'light'
}

const SettingsContext = createContext<{
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
} | null>(null)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  // โหลด settings เมื่อเริ่มต้น
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await StorageService.load()
        setSettings(data.settings)
        logger.info('settings', 'โหลดการตั้งค่าสำเร็จ')
      } catch (error) {
        logger.error('settings', 'โหลดการตั้งค่าล้มเหลว', { error: String(error) })
      }
    }
    loadSettings()
  }, [])

  // บันทึก settings เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await StorageService.saveSettings(settings)
        logger.info('settings', 'บันทึกการตั้งค่าสำเร็จ')
      } catch (error) {
        logger.error('settings', 'บันทึกการตั้งค่าล้มเหลว', { error: String(error) })
      }
    }
    saveSettings()
  }, [settings])

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
