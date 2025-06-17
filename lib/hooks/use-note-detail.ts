"use client"

import { useState, useCallback } from 'react'
import { NoteDetail } from '@/lib/types'

// 笔记详情Hook返回类型
interface UseNoteDetailReturn {
  noteDetail: NoteDetail | null // 笔记详情数据
  isLoading: boolean // 加载状态
  error: string | null // 错误信息
  fetchNoteDetail: (noteUrl: string, cookieStr: string) => Promise<void> // 获取笔记详情函数
  clearError: () => void // 清除错误函数
  clearNoteDetail: () => void // 清除笔记详情函数
}

/**
 * 笔记详情管理Hook
 * 用于获取和管理单个笔记的详细信息
 */
export function useNoteDetail(): UseNoteDetailReturn {
  // 笔记详情数据状态
  const [noteDetail, setNoteDetail] = useState<NoteDetail | null>(null)
  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  // 错误信息状态
  const [error, setError] = useState<string | null>(null)

  /**
   * 获取笔记详情
   * @param noteUrl 笔记URL  
   * @param cookieStr 用户Cookie
   */
  const fetchNoteDetail = useCallback(async (noteUrl: string, cookieStr: string) => {
    try {
      // 开始加载
      setIsLoading(true)
      setError(null)

      console.log('开始获取笔记详情:', { noteUrl })

      // 发送API请求
      const response = await fetch('/api/note-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteUrl,
          cookieStr
        })
      })

      // 解析响应
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP错误: ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || '获取笔记详情失败')
      }

      // 更新笔记详情数据
      setNoteDetail(result.data)
      
      console.log('笔记详情获取成功:', {
        noteId: result.data.id,
        title: result.data.title,
        imageCount: result.data.images?.length || 0
      })

    } catch (err) {
      // 处理错误
      const errorMessage = err instanceof Error ? err.message : '获取笔记详情失败'
      console.error('获取笔记详情失败:', err)
      setError(errorMessage)
      setNoteDetail(null)
    } finally {
      // 结束加载
      setIsLoading(false)
    }
  }, [])

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 清除笔记详情数据
   */
  const clearNoteDetail = useCallback(() => {
    setNoteDetail(null)
    setError(null)
  }, [])

  return {
    noteDetail,
    isLoading,
    error,
    fetchNoteDetail,
    clearError,
    clearNoteDetail
  }
} 