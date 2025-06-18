import { useState, useCallback } from 'react'
import { BatchConfig } from '@/lib/types'
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

  // 获取用户认证token
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

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

      console.log('创建批量改写任务:', {
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

      console.log('批量改写任务创建成功:', result.taskId)
      return result.taskId

    } catch (error) {
      console.error('创建批量改写任务失败:', error)
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

      console.log('开始处理批量改写任务:', taskId)

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

      console.log('批量改写任务开始处理:', result)
      return true

    } catch (error) {
      console.error('处理批量改写任务失败:', error)
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