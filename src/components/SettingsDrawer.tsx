import React, { useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { ModelSelect } from './ModelSelect'
import { TokenCostPanel } from './TokenCostPanel'
import { SavedItemManager } from './SavedItemManager'
import { useToast } from '../contexts/ToastContext'
import { listModels } from '../utils/openai'
import { logger } from '../utils/logger'
import type { SavedApiKey, SavedSystemInstruction } from '../types'

export const SettingsDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { 
    settings, 
    setSettings,
    saveApiKey,
    updateApiKey,
    deleteApiKey,
    saveSystemInstruction,
    updateSystemInstruction,
    deleteSystemInstruction
  } = useSettings()
  const { push } = useToast()
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)

  const testApiKey = async () => {
    const key = settings.apiKey.trim()
    if (!key) return push({ type: 'error', msg: 'กรอก API Key ก่อน' })
    
    setTesting(true)
    try {
      await listModels(key)
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
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-all duration-300 ease-out z-50 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
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
              {/* Current API Key Input */}
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

              {/* Saved API Keys Manager */}
              <SavedItemManager<SavedApiKey>
                items={settings.savedApiKeys}
                currentValue={settings.apiKey}
                onSelect={(key) => setSettings(s => ({ ...s, apiKey: key }))}
                onSave={saveApiKey}
                onDelete={deleteApiKey}
                onUpdate={updateApiKey}
                type="apiKey"
                placeholder="sk-..."
                title="API Key"
                icon="🔑"
              />
            </div>
          </div>

          {/* System Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💬</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Instruction</h3>
            </div>
            
            <div className="space-y-3">
              {/* Current System Prompt Input */}
              <textarea
                value={settings.systemPrompt}
                onChange={e => setSettings(s => ({ ...s, systemPrompt: e.target.value }))}
                placeholder="ข้อความ system ที่จะส่งให้ AI ทุกครั้ง เช่น บทบาท ลักษณะการตอบ หรือข้อจำกัดต่างๆ"
                className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                💡 ตัวอย่าง: "คุณเป็นผู้ช่วยที่เป็นมิตรและให้ข้อมูลที่ถูกต้อง ตอบเป็นภาษาไทยเสมอ"
              </div>

              {/* Saved System Instructions Manager */}
              <SavedItemManager<SavedSystemInstruction>
                items={settings.savedSystemInstructions}
                currentValue={settings.systemPrompt}
                onSelect={(content) => setSettings(s => ({ ...s, systemPrompt: content }))}
                onSave={saveSystemInstruction}
                onDelete={deleteSystemInstruction}
                onUpdate={updateSystemInstruction}
                type="systemInstruction"
                placeholder="ข้อความ system ที่จะส่งให้ AI ทุกครั้ง เช่น บทบาท ลักษณะการตอบ หรือข้อจำกัดต่างๆ"
                title="System Instruction"
                icon="💬"
              />
            </div>
          </div>

          {/* Model Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🤖</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">โมเดล AI</h3>
            </div>
            <ModelSelect />
          </div>

          {/* Token Cost Panel */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💰</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ข้อมูลการใช้งาน</h3>
            </div>
            <TokenCostPanel />
          </div>
        </div>
      </div>
    </>
  )
}
