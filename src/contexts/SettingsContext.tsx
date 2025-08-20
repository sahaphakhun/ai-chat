import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Settings } from '../types'
import { MODEL_PRICING } from '../constants/modelPricing'

const DEFAULT_API_KEY = (import.meta as any)?.env?.VITE_DEFAULT_API_KEY ?? ''

const defaultSettings: Settings = {
  apiKey: DEFAULT_API_KEY,
  systemPrompt: '',
  model: 'gpt-5',
  inPricePerK: MODEL_PRICING[0].inK,
  outPricePerK: MODEL_PRICING[0].outK,
  theme: 'light'
}

const SettingsCtx = createContext<{
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
} | null>(null)

export function useSettings() {
  const ctx = useContext(SettingsCtx)
  if (!ctx) throw new Error('SettingsCtx missing')
  return ctx
}

const KEY = 'chatui:settings'

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const raw = localStorage.getItem(KEY)
    // ผสานค่าที่บันทึกไว้กับค่าเริ่มต้น ป้องกันกรณีฟิลด์ใหม่หายไป
    const saved = raw ? (JSON.parse(raw) as Partial<Settings>) : {}
    return { ...defaultSettings, ...saved, apiKey: (saved.apiKey ?? DEFAULT_API_KEY ?? '') as string }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  // When model changes, sync price from constants
  useEffect(() => {
    const found = MODEL_PRICING.find(m => m.name === settings.model)
    if (found && (found.inK !== settings.inPricePerK || found.outK !== settings.outPricePerK)) {
      setSettings(s => ({ ...s, inPricePerK: found.inK, outPricePerK: found.outK }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.model])

  const value = useMemo(() => ({ settings, setSettings }), [settings])

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>
}
