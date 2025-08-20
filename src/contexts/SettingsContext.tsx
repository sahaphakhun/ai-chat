import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Settings } from '../types'
import { MODEL_PRICING, PRICING_TIERS } from '../constants/modelPricing'

const DEFAULT_API_KEY = (import.meta as any)?.env?.VITE_DEFAULT_API_KEY ?? ''

const defaultSettings: Settings = {
  apiKey: DEFAULT_API_KEY,
  systemPrompt: '',
  model: 'gpt-5',
  pricingTier: 'standard',
  inPricePerK: MODEL_PRICING[0].inK,
  outPricePerK: MODEL_PRICING[0].outK,
  cachedInPricePerK: PRICING_TIERS.standard['gpt-5']?.cachedInK,
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

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // เริ่มจากค่าดีฟอลต์ แล้วให้ `ChatContext` โหลดค่าจากเซิร์ฟเวอร์มาซิงค์ภายหลัง
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings, apiKey: DEFAULT_API_KEY || '' })

  // When model or pricing tier changes, sync price from constants
  useEffect(() => {
    const tierPricing = PRICING_TIERS[settings.pricingTier]?.[settings.model as keyof typeof PRICING_TIERS[typeof settings.pricingTier]]
    if (tierPricing) {
      const needsUpdate = 
        tierPricing.inK !== settings.inPricePerK || 
        tierPricing.outK !== settings.outPricePerK ||
        ('cachedInK' in tierPricing ? tierPricing.cachedInK : undefined) !== settings.cachedInPricePerK
      
      if (needsUpdate) {
        setSettings(s => ({ 
          ...s, 
          inPricePerK: tierPricing.inK, 
          outPricePerK: tierPricing.outK,
          cachedInPricePerK: 'cachedInK' in tierPricing ? tierPricing.cachedInK : undefined
        }))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.model, settings.pricingTier])

  const value = useMemo(() => ({ settings, setSettings }), [settings])

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>
}
