import { useState, useCallback } from 'react'
import { BatchConfig } from '@/lib/types'
import { useCreditsContext } from '@/components/credits-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'

interface BatchRewriteState {
  isCreating: boolean
  isProcessing: boolean
  error: string | null
  taskId: string | null
}

interface BatchTaskProgress {
  total: number
  completed: number
  failed: number
  processing: number
  pending: number
}

interface BatchTaskStatus {
  taskId: string
  taskName: string
  searchKeywords: string | null
  config: BatchConfig
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  progress: BatchTaskProgress
  notes: Array<{
    id: string
    noteId: string
    noteData: any
    status: 'pending' | 'processing' | 'completed' | 'failed'
    errorMessage: string | null
    createdAt: string
    updatedAt: string
    generatedContents: Array<{
      id: string
      title: string | null
      content: string | null
      content_type: string
      status: 'generating' | 'completed' | 'failed'
      error_message: string | null
      created_at: string
      updated_at: string
      completed_at: string | null
    }>
  }>
}

export function useBatchRewrite() {
  const [state, setState] = useState<BatchRewriteState>({
    isCreating: false,
    isProcessing: false,
    error: null,
    taskId: null
  })

  // 获取积分Context
  const { updateBalance, refreshBalance } = useCreditsContext()
  
  // 获取认证上下文
  const { user } = useAuth()

  // 获取用户认证token - 改进版本，更可靠
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      // 首先检查认证上下文中是否有用户
      if (!user) {
        console.warn('🔐 [认证] 用户未登录 - 认证上下文中无用户')
        return null
      }

      // 尝试获取当前session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('🔐 [认证] 获取session失败:', error)
        return null
      }

      if (session?.access_token) {
        // 检查token是否即将过期（提前5分钟刷新）
        const expiresAt = session.expires_at
        const now = Math.floor(Date.now() / 1000)
        const fiveMinutes = 5 * 60
        
        if (expiresAt && (expiresAt - now) < fiveMinutes) {
          console.log('🔐 [认证] Token即将过期，尝试刷新...')
          
          // 尝试刷新token
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.error('🔐 [认证] 刷新token失败:', refreshError)
            return null
          }
          
          if (refreshData.session?.access_token) {
            console.log('🔐 [认证] Token刷新成功')
            return refreshData.session.access_token
          }
        }
        
        return session.access_token
      }

      // 如果没有session，尝试重新获取用户信息
      console.warn('🔐 [认证] 无有效session，尝试重新获取用户信息...')
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('🔐 [认证] 重新获取用户信息失败:', userError)
        return null
      }

      // 重新获取session
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession?.access_token) {
        console.log('🔐 [认证] 重新获取session成功')
        return newSession.access_token
      }

      console.error('🔐 [认证] 无法获取有效的访问token')
      return null

    } catch (error) {
      console.error('🔐 [认证] 获取认证token时发生异常:', error)
      return null
    }
  }, [user])

  // 创建批量改写任务
  const createBatchTask = useCallback(async (
    selectedNotes: string[],
    config: BatchConfig,
    searchKeywords?: string,
    notesData?: any[]
  ): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isCreating: true, error: null }))

      // 获取认证token
      const token = await getAuthToken()
      if (!token) {
        throw new Error('用户未登录')
      }

      // 构建任务名称（关键词+时间）
      const now = new Date()
      const timeStr = now.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/\//g, '-')
      
      const taskName = searchKeywords 
        ? `${searchKeywords}_${timeStr}`
        : `批量改写_${timeStr}`

      console.log('🚀 [前端] 创建批量改写任务:', {
        selectedNotes: selectedNotes.length,
        taskName,
        config
      })

      // 调用创建任务API
      const response = await fetch('/api/batch-rewrite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          selectedNotes,
          config,
          taskName,
          notesData: notesData || []
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '创建任务失败')
      }

      const result = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        isCreating: false, 
        taskId: result.taskId 
      }))

      // 乐观更新积分（预扣积分）
      const requiredCredits = selectedNotes.length
      updateBalance({ 
        current: (result.currentCredits || 0) - requiredCredits 
      })

      console.log('✅ [前端] 批量改写任务创建成功:', result.taskId)
      console.log('💰 [前端] 已预扣积分:', requiredCredits)
      return result.taskId

    } catch (error) {
      console.error('❌ [前端] 创建批量改写任务失败:', error)
      setState(prev => ({ 
        ...prev, 
        isCreating: false, 
        error: error instanceof Error ? error.message : '创建任务失败' 
      }))
      return null
    }
  }, [getAuthToken])

  // 开始处理批量改写任务
  const processBatchTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }))

      // 获取认证token
      const token = await getAuthToken()
      if (!token) {
        throw new Error('用户未登录')
      }

      console.log('🚀 [前端] 开始处理批量改写任务:', taskId)

      // 调用处理任务API
      const response = await fetch('/api/batch-rewrite/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '处理任务失败')
      }

      const result = await response.json()
      
      setState(prev => ({ ...prev, isProcessing: false }))

      console.log('✅ [前端] 批量改写任务开始处理:', result)
      return true

    } catch (error) {
      console.error('❌ [前端] 处理批量改写任务失败:', error)
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: error instanceof Error ? error.message : '处理任务失败' 
      }))
      return false
    }
  }, [getAuthToken])

  // 获取用户所有任务列表
  const getTaskList = useCallback(async (page: number = 1, limit: number = 20): Promise<any> => {
    try {
      // 获取认证token
      const token = await getAuthToken()
      if (!token) {
        throw new Error('用户未登录')
      }

      // 调用任务列表API
      const response = await fetch(`/api/batch-rewrite/list?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '获取任务列表失败')
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error('获取任务列表失败:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '获取任务列表失败' 
      }))
      return null
    }
  }, [getAuthToken])

  // 查询任务状态
  const getTaskStatus = useCallback(async (taskId: string): Promise<BatchTaskStatus | null> => {
    try {
      // 获取认证token
      const token = await getAuthToken()
      if (!token) {
        throw new Error('用户未登录')
      }

      // 调用状态查询API
      const response = await fetch(`/api/batch-rewrite/status?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '查询任务状态失败')
      }

      const result = await response.json()
      return result as BatchTaskStatus

    } catch (error) {
      console.error('查询任务状态失败:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '查询任务状态失败' 
      }))
      return null
    }
  }, [getAuthToken])

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // 重置状态
  const resetState = useCallback(() => {
    setState({
      isCreating: false,
      isProcessing: false,
      error: null,
      taskId: null
    })
  }, [])

  return {
    // 状态
    isCreating: state.isCreating,
    isProcessing: state.isProcessing,
    error: state.error,
    taskId: state.taskId,
    
    // 方法
    createBatchTask,
    processBatchTask,
    getTaskList,
    getTaskStatus,
    clearError,
    resetState
  }
} 