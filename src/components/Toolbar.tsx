import React from 'react'
import { useChat } from '../contexts/ChatContext'
import { exportAsJson, importFromJson } from '../utils/storage'
import { useToast } from '../contexts/ToastContext'
import { logger } from '../utils/logger'

export const Toolbar: React.FC<{ onOpenSessions: () => void }> = ({ onOpenSessions }) => {
  const { state, actions } = useChat()
  const { conversations, currentId } = state
  const { push } = useToast()

  const onUpload = async (file: File) => {
    try {
      logger.info('import', 'เริ่มนำเข้าข้อมูลจากไฟล์', { name: file.name, size: file.size })
      const convs = await importFromJson(file)
      actions.replaceConversations(convs)
      push({ type: 'success', msg: 'อัปโหลดสำเร็จ' })
      logger.info('import', 'นำเข้าข้อมูลสำเร็จ', { conversations: Object.keys(convs).length })
    } catch (e) {
      push({ type: 'error', msg: 'อัปโหลดล้มเหลว' })
      logger.error('import', 'นำเข้าล้มเหลว', { error: String(e) })
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={onOpenSessions} 
          className="lg:hidden p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm"
          title="เปิดรายการห้องสนทนา"
        >
          💬
        </button>

        <button 
          onClick={() => actions.createConversation()}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all shadow-sm"
        >
          <span>➕</span>
          <span className="hidden sm:inline">ห้องใหม่</span>
        </button>

        {currentId && (
          <button 
            onClick={() => actions.deleteConversation(currentId)} 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-sm"
            title="ลบห้องสนทนานี้"
          >
            <span>🗑️</span>
            <span className="hidden md:inline">ลบห้องนี้</span>
          </button>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        <div className="hidden md:flex items-center space-x-2">
          <button 
            onClick={() => exportAsJson(conversations)} 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="ดาวน์โหลดข้อมูล"
          >
            <span>💾</span>
            <span className="hidden lg:inline">ดาวน์โหลด</span>
          </button>

          <label className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors" title="อัปโหลดข้อมูล">
            <span>📁</span>
            <span className="hidden lg:inline">อัปโหลด</span>
            <input type="file" accept="application/json" className="hidden"
              onChange={e => e.target.files && onUpload(e.target.files[0])} />
          </label>

          <button 
            onClick={() => actions.deleteAllConversations()} 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
            title="ลบทั้งหมด"
          >
            <span>🗑️</span>
            <span className="hidden lg:inline">ลบทั้งหมด</span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <select 
            onChange={(e) => {
              const action = e.target.value
              if (action === 'export') exportAsJson(conversations)
              else if (action === 'deleteAll') actions.deleteAllConversations()
              e.target.value = ''
            }}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0"
          >
            <option value="">⋯</option>
            <option value="export">💾 ดาวน์โหลด</option>
            <option value="deleteAll">🗑️ ลบทั้งหมด</option>
          </select>
        </div>
      </div>
    </div>
  )
}
