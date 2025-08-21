import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Settings, SavedApiKey, SavedSystemInstruction } from '../types'
import { MODEL_PRICING } from '../constants/modelPricing'

const DEFAULT_API_KEY = (import.meta as any)?.env?.VITE_DEFAULT_API_KEY ?? ''

const defaultSettings: Settings = {
  apiKey: DEFAULT_API_KEY,
  systemPrompt: '',
  model: 'gpt-5',
  inPricePerK: MODEL_PRICING[0].inK,
  outPricePerK: MODEL_PRICING[0].outK,
  theme: 'light',
  savedApiKeys: [],
  savedSystemInstructions: []
}

const SettingsCtx = createContext<{
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  // ฟังก์ชันจัดการ API Keys
  saveApiKey: (apiKey: Omit<SavedApiKey, 'id' | 'createdAt'>) => void
  updateApiKey: (id: string, apiKey: Omit<SavedApiKey, 'id' | 'createdAt'>) => void
  deleteApiKey: (id: string) => void
  // ฟังก์ชันจัดการ System Instructions
  saveSystemInstruction: (instruction: Omit<SavedSystemInstruction, 'id' | 'createdAt'>) => void
  updateSystemInstruction: (id: string, instruction: Omit<SavedSystemInstruction, 'id' | 'createdAt'>) => void
  deleteSystemInstruction: (id: string) => void
} | null>(null)

export function useSettings() {
  const ctx = useContext(SettingsCtx)
  if (!ctx) throw new Error('SettingsCtx missing')
  return ctx
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // เริ่มจากค่าดีฟอลต์ แล้วให้ `ChatContext` โหลดค่าจากเซิร์ฟเวอร์มาซิงค์ภายหลัง
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings, apiKey: DEFAULT_API_KEY || '' })

  // When model changes, sync price from constants
  useEffect(() => {
    const found = MODEL_PRICING.find(m => m.name === settings.model)
    if (found && (found.inK !== settings.inPricePerK || found.outK !== settings.outPricePerK)) {
      setSettings(s => ({ ...s, inPricePerK: found.inK, outPricePerK: found.outK }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.model])

  // ฟังก์ชันจัดการ API Keys
  const saveApiKey = (apiKey: Omit<SavedApiKey, 'id' | 'createdAt'>) => {
    const newApiKey: SavedApiKey = {
      ...apiKey,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    }
    setSettings(s => ({
      ...s,
      savedApiKeys: [...s.savedApiKeys, newApiKey]
    }))
  }

  const updateApiKey = (id: string, apiKey: Omit<SavedApiKey, 'id' | 'createdAt'>) => {
    setSettings(s => ({
      ...s,
      savedApiKeys: s.savedApiKeys.map(item => 
        item.id === id ? { ...item, ...apiKey } : item
      )
    }))
  }

  const deleteApiKey = (id: string) => {
    setSettings(s => ({
      ...s,
      savedApiKeys: s.savedApiKeys.filter(item => item.id !== id)
    }))
  }

  // ฟังก์ชันจัดการ System Instructions
  const saveSystemInstruction = (instruction: Omit<SavedSystemInstruction, 'id' | 'createdAt'>) => {
    const newInstruction: SavedSystemInstruction = {
      ...instruction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    }
    setSettings(s => ({
      ...s,
      savedSystemInstructions: [...s.savedSystemInstructions, newInstruction]
    }))
  }

  const updateSystemInstruction = (id: string, instruction: Omit<SavedSystemInstruction, 'id' | 'createdAt'>) => {
    setSettings(s => ({
      ...s,
      savedSystemInstructions: s.savedSystemInstructions.map(item => 
        item.id === id ? { ...item, ...instruction } : item
      )
    }))
  }

  const deleteSystemInstruction = (id: string) => {
    setSettings(s => ({
      ...s,
      savedSystemInstructions: s.savedSystemInstructions.filter(item => item.id !== id)
    }))
  }

  const value = useMemo(() => ({ 
    settings, 
    setSettings,
    saveApiKey,
    updateApiKey,
    deleteApiKey,
    saveSystemInstruction,
    updateSystemInstruction,
    deleteSystemInstruction
  }), [settings])

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>
}
