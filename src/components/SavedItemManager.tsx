import React, { useState } from 'react'
import type { SavedApiKey, SavedSystemInstruction } from '../types'

type SavedItemManagerProps<T> = {
  items: T[]
  currentValue: string
  onSelect: (value: string) => void
  onSave: (item: Omit<T, 'id' | 'createdAt'>) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, item: Omit<T, 'id' | 'createdAt'>) => void
  type: 'apiKey' | 'systemInstruction'
  placeholder: string
  title: string
  icon: string
}

export function SavedItemManager<T extends SavedApiKey | SavedSystemInstruction>({
  items,
  currentValue,
  onSelect,
  onSave,
  onDelete,
  onUpdate,
  type,
  placeholder,
  title,
  icon
}: SavedItemManagerProps<T>) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [saveName, setSaveName] = useState('')
  const [saveValue, setSaveValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSave = () => {
    if (!saveName.trim() || !saveValue.trim()) return

    if (editingItem) {
      // อัปเดตรายการเดิม
      if (type === 'apiKey') {
        onUpdate(editingItem.id, { name: saveName, key: saveValue } as Omit<T, 'id' | 'createdAt'>)
      } else {
        onUpdate(editingItem.id, { name: saveName, content: saveValue } as Omit<T, 'id' | 'createdAt'>)
      }
    } else {
      // สร้างรายการใหม่
      if (type === 'apiKey') {
        onSave({ name: saveName, key: saveValue } as Omit<T, 'id' | 'createdAt'>)
      } else {
        onSave({ name: saveName, content: saveValue } as Omit<T, 'id' | 'createdAt'>)
      }
    }

    // รีเซ็ตฟอร์ม
    setSaveName('')
    setSaveValue('')
    setEditingItem(null)
    setShowSaveDialog(false)
  }

  const handleEdit = (item: T) => {
    setEditingItem(item)
    setSaveName(item.name)
    setSaveValue(type === 'apiKey' ? (item as SavedApiKey).key : (item as SavedSystemInstruction).content)
    setShowSaveDialog(true)
  }

  const handleCancelSave = () => {
    setSaveName('')
    setSaveValue('')
    setEditingItem(null)
    setShowSaveDialog(false)
  }

  const handleSelectItem = (item: T) => {
    const value = type === 'apiKey' ? (item as SavedApiKey).key : (item as SavedSystemInstruction).content
    onSelect(value)
    setShowDropdown(false)
  }

  const handleSaveCurrentValue = () => {
    setSaveValue(currentValue)
    setShowSaveDialog(true)
  }

  return (
    <div className="space-y-3">
      {/* Dropdown เลือกรายการที่บันทึกไว้ */}
      {items.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span>{icon}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">เลือกจากรายการที่บันทึกไว้</span>
            </div>
            <span className="text-gray-400">{showDropdown ? '▲' : '▼'}</span>
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleSelectItem(item)}
                      className="text-left w-full"
                    >
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {type === 'apiKey' 
                          ? `${(item as SavedApiKey).key.substring(0, 20)}...`
                          : (item as SavedSystemInstruction).content.substring(0, 50) + (item.content.length > 50 ? '...' : '')
                        }
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="แก้ไข"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                      title="ลบ"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ปุ่มบันทึกค่าปัจจุบัน */}
      {currentValue.trim() && (
        <button
          onClick={handleSaveCurrentValue}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-green-700 dark:text-green-300"
        >
          <span>💾</span>
          <span className="text-sm">บันทึก{title}ปัจจุบัน</span>
        </button>
      )}

      {/* ปุ่มสร้างใหม่ */}
      <button
        onClick={() => setShowSaveDialog(true)}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-700 dark:text-blue-300"
      >
        <span>➕</span>
        <span className="text-sm">สร้าง{title}ใหม่</span>
      </button>

      {/* Dialog บันทึก/แก้ไข */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItem ? `แก้ไข${title}` : `บันทึก${title}ใหม่`}
              </h3>
              <button
                onClick={handleCancelSave}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อ{title}
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={`เช่น ${type === 'apiKey' ? 'API Key หลัก' : 'ผู้ช่วยเป็นมิตร'}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {title}
                </label>
                {type === 'apiKey' ? (
                  <input
                    type="password"
                    value={saveValue}
                    onChange={(e) => setSaveValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <textarea
                    value={saveValue}
                    onChange={(e) => setSaveValue(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={!saveName.trim() || !saveValue.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {editingItem ? 'อัปเดต' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
