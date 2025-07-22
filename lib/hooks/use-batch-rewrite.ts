import { useState, useCallback } from 'react'
import { BatchConfig } from '@/lib/types'
import { useCreditsContext } from '@/components/credits-context'
import { useMySQLAuth } from '@/components/mysql-auth-context'

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
  const { balance, updateBalance, refreshBalance } = useCreditsContext()
  
  // 获取认证上下文
  const { user } = useMySQLAuth()

  // 创建批量改写任务
  const createBatchTask = useCallback(async (
    selectedNotes: string[],
    config: BatchConfig,
    searchKeywords?: string,
    notesData?: any[]
  ): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isCreating: true, error: null }))

      // 检查用户认证状态
      if (!user) {
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

      // 准备笔记数据 - 将selectedNotes和notesData合并为API期望的格式
      const notes = selectedNotes.map(noteId => {
        // 从notesData中找到对应的笔记数据
        const noteData = notesData?.find(note => 
          note.id === noteId || note.note_id === noteId
        )
        
        return {
          note_id: noteId,
          ...noteData // 包含完整的笔记数据
        }
      })

      console.log('📝 [前端] 准备发送的笔记数据:', notes.length, '条')
      
      // 开发环境调试信息
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 [前端] 笔记数据详情:', notes.map((note, index) => ({
          index,
          note_id: note.note_id,
          id: note.id,
          title: note.title,
          note_display_title: note.note_display_title,
          cover: note.cover,
          note_cover_url_default: note.note_cover_url_default,
          dataKeys: Object.keys(note)
        })))
      }

      // 调用创建任务API - 使用Cookie认证
      const response = await fetch('/api/batch-rewrite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 包含Cookie
        body: JSON.stringify({
          taskName,
          config,
          notes,
          searchKeywords
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
        taskId: result.task?.id || null
      }))

      // 乐观更新积分（预扣积分）
      const totalCost = selectedNotes.length * 1 // 每个笔记1积分（与API一致）
      const consumedCredits = result.task?.creditsConsumed || totalCost
      // 从当前积分中减去消耗的积分，但确保不会变为负数
      const currentCredits = balance?.current || 0
      const newCredits = Math.max(0, currentCredits - consumedCredits)
      updateBalance({ current: newCredits })

      console.log('✅ [前端] 批量改写任务创建成功:', result.task?.id)
      return result.task?.id || null

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isCreating: false, 
        error: error instanceof Error ? error.message : '创建任务失败' 
      }))
      return null
    }
  }, [user, updateBalance])

  // 处理批量改写任务
  const processBatchTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }))

      // 检查用户认证状态
      if (!user) {
        throw new Error('用户未登录')
      }

      console.log('⚡ [前端] 开始处理批量改写任务:', taskId)

      // 调用处理任务API - 使用Cookie认证
      const response = await fetch('/api/batch-rewrite/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 包含Cookie
        body: JSON.stringify({ taskId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '处理任务失败')
      }

      const result = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false 
      }))

      // 刷新积分余额
      await refreshBalance()

      return result.success

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: error instanceof Error ? error.message : '处理任务失败' 
      }))
      return false
    }
  }, [user, refreshBalance])

  // 获取批量任务状态
  const getBatchTaskStatus = useCallback(async (taskId: string): Promise<BatchTaskStatus | null> => {
    try {
      // 检查用户认证状态
      if (!user) {
        console.warn('用户未登录，无法获取任务状态')
        return null
      }

      // 调用状态查询API - 使用Cookie认证
      const response = await fetch(`/api/batch-rewrite/status?taskId=${taskId}`, {
        credentials: 'include' // 包含Cookie
      })

      if (!response.ok) {
        console.error('获取任务状态失败:', response.status)
        return null
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error('获取任务状态异常:', error)
      return null
    }
  }, [user])

  // 获取批量任务列表
  const getBatchTaskList = useCallback(async (
    limit: number = 20,
    offset: number = 0,
    status?: string
  ): Promise<{ tasks: any[], total: number } | null> => {
    try {
      // 检查用户认证状态
      if (!user) {
        console.warn('🔍 [Hook] 用户未登录，无法获取任务列表')
        return null
      }

      console.log('🔍 [Hook] 开始获取任务列表，用户:', user.id)

      // 构建查询参数
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })
      
      if (status) {
        params.append('status', status)
      }

      const apiUrl = `/api/batch-rewrite/list?${params}`
      console.log('🔍 [Hook] 调用API:', apiUrl)

      // 调用列表查询API - 使用Cookie认证
      const response = await fetch(apiUrl, {
        credentials: 'include' // 包含Cookie
      })

      console.log('🔍 [Hook] API响应状态:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔍 [Hook] 获取任务列表失败:', response.status, errorText)
        return null
      }

      const result = await response.json()
      console.log('🔍 [Hook] API返回数据:', result)
      
      return {
        tasks: result.tasks,
        total: result.total
      }

    } catch (error) {
      console.error('获取任务列表异常:', error)
      return null
    }
  }, [user])

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // 状态
    isCreating: state.isCreating,
    isProcessing: state.isProcessing,
    error: state.error,
    taskId: state.taskId,
    
    // 操作方法
    createBatchTask,
    processBatchTask,
    getBatchTaskStatus,
    getBatchTaskList,
    clearError
  }
} 