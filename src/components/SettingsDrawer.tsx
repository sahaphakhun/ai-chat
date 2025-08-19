import React, { useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { ModelSelect } from './ModelSelect'
import { TokenCostPanel } from './TokenCostPanel'
import { useToast } from '../contexts/ToastContext'

export const SettingsDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { settings, setSettings } = useSettings()
  const [show, setShow] = useState(false)
  const { push } = useToast()

  const testKey = async () => {
    if (!settings.apiKey) return push({ type: 'error', msg: 'ยังไม่ได้กรอก API Key' })
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${settings.apiKey}` }
      })
      if (!res.ok) throw new Error()
      push({ type: 'success', msg: 'คีย์ใช้งานได้' })
    } catch {
      push({ type: 'error', msg: 'คีย์ไม่ถูกต้องหรือหมดโควตา' })
    }
  }

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white dark:bg-neutral-900 border-l dark:border-neutral-800 transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-3 border-b dark:border-neutral-800">
        <div className="font-medium">ตั้งค่า</div>
        <button onClick={onClose} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700">ปิด</button>
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <label className="text-sm">API Key</label>
          <div className="flex gap-2">
            <input
              type={show ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="flex-1 border dark:border-neutral-700 rounded px-2 py-1 bg-white dark:bg-neutral-900"
            />
            <button onClick={() => setShow(v => !v)} className="px-2 rounded bg-neutral-200 dark:bg-neutral-700">
              {show ? 'ซ่อน' : 'แสดง'}
            </button>
            <button onClick={testKey} className="px-2 rounded bg-blue-600 text-white">ทดสอบคีย์</button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm">System Instruction</label>
          <textarea
            value={settings.systemPrompt}
            onChange={e => setSettings(s => ({ ...s, systemPrompt: e.target.value }))}
            placeholder="ข้อความ system ที่จะส่งทุกครั้ง"
            className="w-full h-32 border dark:border-neutral-700 rounded p-2 bg-white dark:bg-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">โมเดล</label>
          <ModelSelect />
        </div>

        <TokenCostPanel />
      </div>
    </div>
  )
}
