import React from 'react'
import { useChat } from '../contexts/ChatContext'
import { StorageService } from '../utils/storage'
import { useToast } from '../contexts/ToastContext'
import { logger } from '../utils/logger'

export const Toolbar: React.FC = () => {
  const { state, actions } = useChat()
  const { push } = useToast()

  const handleNewChat = () => {
    actions.createConversation()
    logger.info('toolbar', 'สร้างห้องสนทนาใหม่')
  }

  const handleDeleteCurrent = () => {
    if (state.currentConversationId) {
      actions.deleteConversation(state.currentConversationId)
      logger.info('toolbar', 'ลบห้องสนทนาปัจจุบัน', { id: state.currentConversationId })
    }
  }

  const handleDeleteAll = () => {
    // ลบทุกห้องสนทนา
    Object.keys(state.conversations).forEach(id => {
      actions.deleteConversation(id)
    })
    logger.info('toolbar', 'ลบห้องสนทนาทั้งหมด')
    push({ type: 'success', msg: 'ลบห้องสนทนาทั้งหมดแล้ว' })
  }

  const handleExport = () => {
    try {
      StorageService.exportAsJson(state.conversations)
      push({ type: 'success', msg: 'ส่งออกข้อมูลสำเร็จ' })
    } catch (error) {
      logger.error('toolbar', 'ส่งออกข้อมูลล้มเหลว', { error: String(error) })
      push({ type: 'error', msg: 'ส่งออกข้อมูลล้มเหลว' })
    }
  }

  const handleImport = async (file: File) => {
    try {
      const conversations = await StorageService.importFromJson(file)
      
      // นำเข้าข้อมูลใหม่
      actions.importConversations(conversations)
      
      push({ type: 'success', msg: 'นำเข้าข้อมูลสำเร็จ' })
    } catch (error) {
      logger.error('toolbar', 'นำเข้าข้อมูลล้มเหลว', { error: String(error) })
      push({ type: 'error', msg: 'นำเข้าข้อมูลล้มเหลว' })
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleNewChat}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all shadow-sm"
        >
          <span>➕</span>
          <span className="hidden sm:inline">ห้องใหม่</span>
        </button>

        {state.currentConversationId && (
          <button 
            onClick={handleDeleteCurrent} 
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
            onClick={handleExport} 
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
              onChange={e => e.target.files && handleImport(e.target.files[0])} />
          </label>

          <button 
            onClick={handleDeleteAll} 
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
              if (action === 'export') handleExport()
              else if (action === 'deleteAll') handleDeleteAll()
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
