import React, { useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { ModelSelect } from './ModelSelect'
import { TokenCostPanel } from './TokenCostPanel'
import { useToast } from '../contexts/ToastContext'
import { listModels } from '../utils/openai'

export const SettingsDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { settings, setSettings } = useSettings()
  const { push } = useToast()
  const [showKey, setShowKey] = useState(false)
  

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white dark:bg-neutral-900 border-l dark:border-neutral-800 transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-3 border-b dark:border-neutral-800">
        <div className="font-medium">ตั้งค่า</div>
        <button onClick={onClose} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700">ปิด</button>
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <label className="text-sm">OpenAI API Key</label>
          <div className="flex items-center gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="flex-1 border dark:border-neutral-700 rounded p-2 bg-white dark:bg-neutral-900"
            />
            <button
              onClick={() => setShowKey(v => !v)}
              className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700"
            >
              {showKey ? 'ซ่อน' : 'แสดง'}
            </button>
            <button
              onClick={async () => {
                const key = settings.apiKey.trim()
                if (!key) return push({ type: 'error', msg: 'กรอก API Key ก่อน' })
                try {
                  await listModels(key)
                  push({ type: 'success', msg: 'คีย์ใช้งานได้' })
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'คีย์ไม่ถูกต้อง'
                  push({ type: 'error', msg })
                }
              }}
              className="px-2 py-1 rounded bg-blue-600 text-white"
            >
              ทดสอบคีย์
            </button>
          </div>
          <div className="text-xs text-neutral-500">
            เก็บไว้ในอุปกรณ์ของคุณ (localStorage). หลีกเลี่ยงการใช้บนอุปกรณ์สาธารณะ
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
