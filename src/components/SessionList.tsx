import React from 'react'
import { useChat } from '../contexts/ChatContext'
import { useSettings } from '../contexts/SettingsContext'
import { countTokensConversation } from '../utils/token'
import { costUSD, formatUSD } from '../utils/cost'

export const SessionList: React.FC<{ className?: string; onSelect?: () => void }> = ({ className, onSelect }) => {
  const { state, actions } = useChat()
  const { index, conversations, currentId } = state
  const { settings } = useSettings()

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'เมื่อวาน'
    } else if (diffDays < 7) {
      return `${diffDays} วันที่แล้ว`
    } else {
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    }
  }

  const getMessagePreview = (conversation: any) => {
    const lastMessage = conversation?.messages?.[conversation.messages.length - 1]
    if (!lastMessage) return 'ยังไม่มีข้อความ'
    
    const content = lastMessage.content.trim()
    return content.length > 50 ? content.substring(0, 50) + '...' : content
  }

  const getConversationCost = (conversation: any) => {
    if (!conversation?.messages?.length) return 0
    const stats = countTokensConversation(conversation.messages)
    const inCost = costUSD(stats.input, settings.inPricePerK)
    const outCost = costUSD(stats.output, settings.outPricePerK)
    return inCost + outCost
  }

  return (
    <div className={className ?? "w-80 shrink-0 overflow-y-auto h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm scrollbar-thin"}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <span>💬</span>
          <span>ห้องสนทนา</span>
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {index.sessionIds.length} ห้อง
        </div>
      </div>

      {/* Session List */}
      <div className="p-2">
        {index.sessionIds.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">💭</div>
            <div className="text-sm">ยังไม่มีห้องสนทนา</div>
            <div className="text-xs mt-1">เริ่มต้นด้วยการสร้างห้องใหม่</div>
          </div>
        ) : (
          <ul className="space-y-2">
            {index.sessionIds.map(id => {
              const c = conversations[id]
              const isActive = currentId === id
              const messageCount = c?.messages?.length || 0
              const conversationCost = getConversationCost(c)
              
              return (
                <li key={id}>
                  <button
                    onClick={() => { actions.setCurrentConversation(id); onSelect?.() }}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${
                          isActive ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                          {c?.title || 'ไม่ระบุชื่อ'}
                        </div>
                        <div className={`text-xs mt-1 truncate ${
                          isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {getMessagePreview(c)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end ml-2">
                        <div className={`text-xs ${
                          isActive ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {formatDate(c?.updatedAt || Date.now())}
                        </div>
                        {messageCount > 0 && (
                          <div className="flex flex-col items-end space-y-1 mt-1">
                            <div className={`text-xs px-2 py-0.5 rounded-full ${
                              isActive 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                              {messageCount} ข้อความ
                            </div>
                            {conversationCost > 0 && (
                              <div className={`text-xs px-2 py-0.5 rounded-full ${
                                isActive 
                                  ? 'bg-green-500/20 text-green-100' 
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              }`}>
                                {formatUSD(conversationCost)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
