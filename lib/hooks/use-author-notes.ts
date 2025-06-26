import { useState, useCallback } from 'react'
import { Note, AuthorInfo } from '@/lib/types'
import { useMySQLAuth } from '@/components/mysql-auth-context'

// 作者笔记获取结果类型
interface AuthorNotesResult {
  success: boolean
  data: {
    author_info: AuthorInfo
    notes: Note[]
    total: number
  }
  userProfileUrl: string
  error?: string
}

// Hook返回类型
interface UseAuthorNotesReturn {
  authorInfo: AuthorInfo | null // 作者信息
  authorNotes: Note[] // 作者笔记列表
  isLoading: boolean // 加载状态
  error: string | null // 错误信息
  fetchAuthorNotes: (userProfileUrl: string) => Promise<void> // 获取作者笔记方法
  clearResults: () => void // 清空结果
  clearError: () => void // 清空错误
}

/**
 * 获取作者笔记的Hook
 * @returns UseAuthorNotesReturn 作者笔记相关的状态和方法
 */
export function useAuthorNotes(): UseAuthorNotesReturn {
  const { user, profile } = useMySQLAuth()
  const [authorInfo, setAuthorInfo] = useState<AuthorInfo | null>(null)
  const [authorNotes, setAuthorNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取用户Cookie（不抛出错误，由上层组件处理状态检查）
  const getUserCookie = useCallback(async (): Promise<string | null> => {
    try {
      // 如果用户未登录，返回null（不抛出错误）
      if (!user) {
        console.log('🔐 [use-author-notes] 用户未登录')
        return null
      }

      // 如果Cookie未配置，返回null（不抛出错误）
      if (!profile?.user_cookie) {
        console.log('🍪 [use-author-notes] Cookie未配置')
        return null
      }

      return profile.user_cookie

    } catch (err) {
      console.error('❌ [use-author-notes] 获取用户Cookie失败:', err)
      return null
    }
  }, [user?.id, profile?.user_cookie])

  // 获取作者笔记
  const fetchAuthorNotes = useCallback(async (userProfileUrl: string) => {
    // 清除之前的错误
    setError(null)
    setIsLoading(true)

    try {
      // 验证作者链接
      if (!userProfileUrl.trim()) {
        throw new Error('请输入作者链接')
      }

      // 验证URL格式
      if (!userProfileUrl.includes('xiaohongshu.com/user/profile/')) {
        throw new Error('请输入有效的小红书作者链接')
      }

      // 获取用户Cookie
      const cookieStr = await getUserCookie()
      if (!cookieStr) {
        // Cookie为空时，不抛出错误，直接返回（由上层组件处理状态检查）
        console.log('🔍 [use-author-notes] Cookie为空，停止获取')
        setIsLoading(false)
        return
      }

      console.log('📝 [use-author-notes] 开始获取作者笔记:', {
        userProfileUrl,
        hasCookie: !!cookieStr
      })

      // 调用作者笔记获取API
      const response = await fetch('/api/author-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileUrl: userProfileUrl.trim(),
          cookieStr
        })
      })

      // 解析响应
      const result: AuthorNotesResult = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '获取作者笔记失败')
      }

      if (!result.success) {
        throw new Error(result.error || '获取作者笔记失败')
      }

      // 更新作者信息和笔记结果
      setAuthorInfo(result.data.author_info)
      setAuthorNotes(result.data.notes)

      console.log('✅ [use-author-notes] 获取作者笔记成功:', {
        authorName: result.data.author_info.nick_name,
        notesCount: result.data.notes.length
      })

      // 如果没有笔记，提示用户
      if (result.data.notes.length === 0) {
        setError('该作者暂无公开笔记')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取作者笔记失败，请稍后重试'
      setError(errorMessage)
      setAuthorInfo(null) // 清空作者信息
      setAuthorNotes([]) // 清空笔记结果
      console.error('获取作者笔记失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [getUserCookie])

  // 清空结果
  const clearResults = useCallback(() => {
    setAuthorInfo(null)
    setAuthorNotes([])
    setError(null)
  }, [])

  // 清空错误信息
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    authorInfo,
    authorNotes,
    isLoading,
    error,
    fetchAuthorNotes,
    clearResults,
    clearError
  }
} 