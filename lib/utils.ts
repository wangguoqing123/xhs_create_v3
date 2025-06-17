import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 本地存储工具函数
export const storage = {
  // 安全地获取本地存储项
  getItem: <T>(key: string, defaultValue: T | null = null): T | null => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`读取本地存储失败 (${key}):`, error)
      return defaultValue
    }
  },

  // 安全地设置本地存储项
  setItem: <T>(key: string, value: T): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`保存到本地存储失败 (${key}):`, error)
      return false
    }
  },

  // 安全地移除本地存储项
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`删除本地存储失败 (${key}):`, error)
      return false
    }
  },

  // 清除多个本地存储项
  removeItems: (keys: string[]): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      keys.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('批量删除本地存储失败:', error)
      return false
    }
  }
}
