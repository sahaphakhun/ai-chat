import React, { useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { logger } from '../utils/logger'

export const SettingsDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { settings, setSettings } = useSettings()
  const { push } = useToast()
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)

  const testApiKey = async () => {
    const key = settings.apiKey.trim()
    if (!key) return push({ type: 'error', msg: 'กรอก API Key ก่อน' })
    
    setTesting(true)
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      push({ type: 'success', msg: '✅ คีย์ใช้งานได้' })
      logger.info('settings', 'ทดสอบ API Key สำเร็จ')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'คีย์ไม่ถูกต้อง'
      push({ type: 'error', msg: `❌ ${msg}` })
      logger.error('settings', 'ทดสอบ API Key ล้มเหลว', { error: String(e) })
    } finally {
      setTesting(false)
    }
  }

  const models = [
    { name: 'gpt-4o', label: 'GPT-4o (เร็วที่สุด)' },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini (ประหยัด)' },
    { name: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ]

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-all duration-300 ease-out z-50 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">⚙️</span>
            </div>
            <h2 className="text-xl font-semibold">ตั้งค่าระบบ</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔑</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">OpenAI API Key</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowKey(v => !v)}
                  className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={showKey ? 'ซ่อน API Key' : 'แสดง API Key'}
                >
                  {showKey ? '👁️‍🗨️' : '👁️'}
                </button>
                <button
                  onClick={testApiKey}
                  disabled={testing || !settings.apiKey.trim()}
                  className="px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {testing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>ทดสอบ...</span>
                    </>
                  ) : (
                    <>
                      <span>🧪</span>
                      <span>ทดสอบ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* System Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💬</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Instruction</h3>
            </div>
            
            <textarea
              value={settings.systemPrompt}
              onChange={e => setSettings(s => ({ ...s, systemPrompt: e.target.value }))}
              placeholder="ข้อความ system ที่จะส่งให้ AI ทุกครั้ง เช่น บทบาท ลักษณะการตอบ หรือข้อจำกัดต่างๆ"
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              💡 ตัวอย่าง: "คุณเป็นผู้ช่วยที่เป็นมิตรและให้ข้อมูลที่ถูกต้อง ตอบเป็นภาษาไทยเสมอ"
            </div>
          </div>

          {/* Model Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🤖</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">โมเดล AI</h3>
            </div>
            
            <select
              value={settings.model}
              onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {models.map(model => (
                <option key={model.name} value={model.name}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💰</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ราคา (ต่อ 1K tokens)</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Input Price ($)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={settings.inPricePerK}
                  onChange={e => setSettings(s => ({ ...s, inPricePerK: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Price ($)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={settings.outPricePerK}
                  onChange={e => setSettings(s => ({ ...s, outPricePerK: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
