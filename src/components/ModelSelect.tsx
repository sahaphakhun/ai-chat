import React, { useEffect, useState } from 'react'
import { MODEL_PRICING } from '../constants/modelPricing'
import { useSettings } from '../contexts/SettingsContext'
import { listModels } from '../utils/openai'
import { useToast } from '../contexts/ToastContext'

export const ModelSelect: React.FC = () => {
  const { settings, setSettings } = useSettings()
  const { push } = useToast()
  const [models, setModels] = useState<string[]>(MODEL_PRICING.map(m => m.name))

  const refresh = async () => {
    try {
      const data = await listModels(settings.apiKey)
      const ids = data.map(d => d.id)
      setModels(ids)
      push({ type: 'success', msg: 'อัปเดตรายชื่อโมเดลจาก API แล้ว' })
    } catch {
      setModels(MODEL_PRICING.map(m => m.name))
      push({ type: 'error', msg: 'โหลดจาก API ไม่สำเร็จ ใช้ค่าคงที่แทน' })
    }
  }

  useEffect(() => {
    // sync price fields when model matches constant
    const found = MODEL_PRICING.find(m => m.name === settings.model)
    if (found) {
      setSettings(s => ({ ...s, inPricePerK: found.inK, outPricePerK: found.outK }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.model])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select value={settings.model} onChange={e => setSettings(s => ({ ...s, model: e.target.value as any }))}
          className="border dark:border-neutral-700 rounded px-2 py-1 bg-white dark:bg-neutral-900">
          {models.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={refresh} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700">Refresh from API</button>
      </div>
      <div className="text-xs text-neutral-500">
        ราคาจะเติมอัตโนมัติตามโมเดล
      </div>
    </div>
  )
}
