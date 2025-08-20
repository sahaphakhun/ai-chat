import React from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { ModelSelect } from './ModelSelect'
import { TokenCostPanel } from './TokenCostPanel'

export const SettingsDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { settings, setSettings } = useSettings()
  

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white dark:bg-neutral-900 border-l dark:border-neutral-800 transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-3 border-b dark:border-neutral-800">
        <div className="font-medium">ตั้งค่า</div>
        <button onClick={onClose} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700">ปิด</button>
      </div>

      <div className="p-4 space-y-6">
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
