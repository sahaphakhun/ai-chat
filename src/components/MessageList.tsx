import React, { useEffect, useRef, useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { costUSD, formatUSD, calculateCostFromUsage } from '../utils/cost'
import type { Message } from '../types'

export const MessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const { settings } = useSettings()
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // ตรวจสอบว่าผู้ใช้กำลังเลื่อนหรือไม่
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50 // ให้ buffer 50px
      
      setIsUserScrolling(!isAtBottom)
      setShouldAutoScroll(isAtBottom)
    }

    // เพิ่ม passive: true เพื่อประสิทธิภาพที่ดีขึ้น
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // ตรวจสอบสถานะเริ่มต้น
    handleScroll()
    
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // เลื่อนลงอัตโนมัติเฉพาะเมื่อผู้ใช้อยู่ที่ด้านล่าง
  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      // ใช้ setTimeout เพื่อให้ DOM อัพเดทก่อน
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages, shouldAutoScroll, isUserScrolling])

  // เลื่อนลงทันทีเมื่อมีข้อความใหม่และผู้ใช้อยู่ที่ด้านล่าง
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      const container = containerRef.current
      if (container) {
        // ตรวจสอบว่าอยู่ใกล้ด้านล่างหรือไม่
        const { scrollTop, scrollHeight, clientHeight } = container
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        
        if (isNearBottom) {
          setTimeout(() => {
            container.scrollTop = container.scrollHeight
          }, 50)
        }
      }
    }
  }, [messages.length, shouldAutoScroll])

  const getMessageCost = (message: Message) => {
    // ใช้ข้อมูลจาก OpenAI API โดยตรงสำหรับทั้ง user และ assistant messages
    // ข้อมูล usage มาจาก response ของ OpenAI API ที่ส่งมาพร้อมกับ streaming response
    if (message.usage) {
      const costData = calculateCostFromUsage(message.usage, settings.model)
      
      // คำนวณต้นทุนตาม role ของข้อความ
      let displayCost = 0
      if (message.role === 'user') {
        // สำหรับ User messages: prompt_tokens*PRICE_INPUT + cached_tokens*PRICE_CACHED
        displayCost = costData.breakdown.regularInputCost + costData.breakdown.cachedInputCost
      } else if (message.role === 'assistant') {
        // สำหรับ Assistant messages: completion_tokens*PRICE_OUTPUT
        displayCost = costData.breakdown.outputCost
      }
      
      return {
        totalCost: displayCost,
        breakdown: costData.breakdown,
        tokens: {
          input: message.usage.prompt_tokens,
          output: message.usage.completion_tokens,
          total: message.usage.total_tokens,
          cached: message.usage.prompt_tokens_details?.cached_tokens ?? 0
        }
      }
    }
    
    // Fallback: ใช้การคำนวณเองเฉพาะกรณีที่ไม่มีข้อมูล usage จาก OpenAI API
    // (ควรจะไม่เกิดขึ้นในการใช้งานปกติ)
    if (message.tokens) {
      const cost = costUSD(message.tokens, message.role === 'user' ? settings.inPricePerK : settings.outPricePerK)
      return {
        totalCost: cost,
        breakdown: null,
        tokens: {
          input: message.role === 'user' ? message.tokens : 0,
          output: message.role === 'assistant' ? message.tokens : 0,
          total: message.tokens,
          cached: 0
        }
      }
    }
    
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin min-h-0"
      style={{ 
        scrollBehavior: 'smooth',
        overscrollBehavior: 'contain',
        height: '100%'
      }}
    >
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] md:max-w-2xl lg:max-w-3xl ${m.role === 'user' ? 'order-2' : 'order-1'}`}>
            {/* Avatar */}
            <div className={`flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${m.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                }`}>
                {m.role === 'user' ? '👤' : '🤖'}
              </div>
              
              {/* Message Content */}
              <div className={`flex-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm
                  ${m.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                  }`}>
                  {m.content}
                </div>
                
                {/* Message Info */}
                <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center justify-between">
                    <span>{m.role === 'user' ? 'คุณ' : 'AI Assistant'}</span>
                    {(() => {
                      const costInfo = getMessageCost(m)
                      if (!costInfo) return null
                      
                      return (
                        <div className="flex items-center space-x-2">
                          {/* แสดงโทเค็นตาม role ของข้อความ */}
                          {m.usage ? (
                            <span>
                              {m.role === 'user' ? (
                                <>
                                  • {costInfo.tokens.input} input tokens
                                  {costInfo.tokens.cached > 0 && ` (${costInfo.tokens.cached} cached)`}
                                </>
                              ) : (
                                <>• {costInfo.tokens.output} output tokens</>
                              )}
                            </span>
                          ) : (
                            <span>• {costInfo.tokens.total} tokens (คำนวณโดยประมาณ)</span>
                          )}
                          
                          {/* แสดงราคา */}
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            • {formatUSD(costInfo.totalCost)}
                          </span>
                          
                          {/* แสดงรายละเอียดราคาตาม role */}
                          {costInfo.breakdown && m.usage && (
                            <span className="text-xs text-gray-400">
                              {m.role === 'user' ? (
                                <>
                                  (input: {formatUSD(costInfo.breakdown.regularInputCost)}
                                  {costInfo.breakdown.cachedInputCost > 0 && ` + cached: ${formatUSD(costInfo.breakdown.cachedInputCost)}`})
                                </>
                              ) : (
                                <>(output: {formatUSD(costInfo.breakdown.outputCost)})</>
                              )}
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
      
      {/* ปุ่มกลับไปด้านล่าง */}
      {isUserScrolling && (
        <div className="fixed bottom-24 right-6 z-10 animate-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => {
              const container = containerRef.current
              if (container) {
                container.scrollTop = container.scrollHeight
              }
              setShouldAutoScroll(true)
              setIsUserScrolling(false)
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            title="กลับไปด้านล่าง"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
