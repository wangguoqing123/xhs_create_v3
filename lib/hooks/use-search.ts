import { useState, useCallback } from 'react'
import { Note, SearchConfig } from '@/lib/types'
import { useMySQLAuth } from '@/components/mysql-auth-context'

// 搜索结果类型
interface SearchResult {
  success: boolean
  data: Note[]
  total: number
  config: SearchConfig
  keywords: string
  error?: string
}

// Hook返回类型
interface UseSearchReturn {
  searchResults: Note[]
  isLoading: boolean
  error: string | null
  searchNotes: (keywords: string, config?: Partial<SearchConfig>) => Promise<void>
  clearResults: () => void
  clearError: () => void
}

/**
 * 搜索小红书笔记的Hook
 * @returns UseSearchReturn 搜索相关的状态和方法
 */
export function useSearch(): UseSearchReturn {
  const { user, profile } = useMySQLAuth()
  const [searchResults, setSearchResults] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取用户Cookie（不抛出错误，由上层组件处理状态检查）
  const getUserCookie = useCallback(async (): Promise<string | null> => {
    try {
      // 如果用户未登录，返回null（不抛出错误）
      if (!user) {
        console.log('🔐 [use-search] 用户未登录')
        return null
      }

      // 如果Cookie未配置，返回null（不抛出错误）
      if (!profile?.user_cookie) {
        console.log('🍪 [use-search] Cookie未配置')
        return null
      }

      return profile.user_cookie

    } catch (err) {
      console.error('❌ [use-search] 获取用户Cookie失败:', err)
      return null
    }
  }, [user?.id, profile?.user_cookie])

  // 搜索笔记
  const searchNotes = useCallback(async (
    keywords: string, 
    config: Partial<SearchConfig> = {}
  ) => {
    // 清除之前的错误
    setError(null)
    setIsLoading(true)

    try {
      // 验证关键词
      if (!keywords.trim()) {
        throw new Error('请输入搜索关键词')
      }

      // 获取用户Cookie
      const cookieStr = await getUserCookie()
      if (!cookieStr) {
        // Cookie为空时，不抛出错误，直接返回（由上层组件处理状态检查）
        console.log('🔍 [use-search] Cookie为空，停止搜索')
        setIsLoading(false)
        return
      }

      // 构建搜索配置
      const searchConfig: SearchConfig = {
        noteType: config.noteType ?? 0, // 默认全部类型
        sort: config.sort ?? 0, // 默认综合排序
        totalNumber: config.totalNumber ?? 20 // 默认20条
      }

      // 调用搜索API
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.trim(),
          cookieStr,
          config: searchConfig
        })
      })

      // 解析响应
      const result: SearchResult = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '搜索请求失败')
      }

      if (!result.success) {
        throw new Error(result.error || '搜索失败')
      }

      // 更新搜索结果
      setSearchResults(result.data)

      // 如果没有结果，提示用户
      if (result.data.length === 0) {
        setError('没有找到相关内容，请尝试其他关键词')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜索失败，请稍后重试'
      setError(errorMessage)
      setSearchResults([]) // 清空结果
      console.error('搜索失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [getUserCookie])

  // 清空搜索结果
  const clearResults = useCallback(() => {
    setSearchResults([])
    setError(null)
  }, [])

  // 清空错误信息
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    searchResults,
    isLoading,
    error,
    searchNotes,
    clearResults,
    clearError
  }
} 