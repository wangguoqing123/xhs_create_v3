"use client"

import { useState, useEffect, Suspense, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { TaskSidebar } from "@/components/task-sidebar"
import { ResultViewer } from "@/components/result-viewer"
import { useBatchRewrite } from "@/lib/hooks/use-batch-rewrite"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { FileText } from "lucide-react"

// 任务显示接口（兼容现有UI组件）
interface Task {
  id: string
  noteTitle: string
  noteCover: string
  status: "generating" | "completed" | "failed"
  results: Array<{
    id: string
    title: string
    content: string
    status: "generating" | "completed" | "failed"
  }>
}

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const [taskList, setTaskList] = useState<any[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // 批量改写Hook
  const { getBatchTaskList, getBatchTaskStatus } = useBatchRewrite()
  
  // 获取认证状态
  const { user, loading } = useMySQLAuth()

  // 获取URL参数中的taskId（如果有的话，默认选中这个任务）
  const urlTaskId = searchParams?.get("taskId")

  // 获取用户所有任务列表
  const fetchTaskList = useCallback(async (isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        setIsLoading(true)
        setError(null)
      }
      
      console.log('📋 [任务列表] 开始获取任务列表...')
      const result = await getBatchTaskList()
      
      if (!result) {
        throw new Error("获取任务列表失败")
      }

      console.log('📋 [任务列表] 获取成功，任务数量:', result.tasks?.length || 0)
      setTaskList(result.tasks || [])
      
      // 如果URL有taskId参数，默认选中该任务
      if (urlTaskId && result.tasks?.length > 0) {
        const targetTask = result.tasks.find((task: any) => task.id === urlTaskId)
        if (targetTask) {
          setSelectedTaskId(urlTaskId)
        } else {
          // 如果找不到指定任务，选中第一个
          setSelectedTaskId(result.tasks[0].id)
        }
      } else if (result.tasks?.length > 0) {
        // 没有指定taskId，选中第一个任务
        setSelectedTaskId(result.tasks[0].id)
      }
      
      setIsLoading(false)
      setRetryCount(0) // 重置重试计数
      
    } catch (error) {
      console.error('📋 [任务列表] 获取失败:', error)
      const errorMessage = error instanceof Error ? error.message : '获取任务列表失败'
      
      // 如果是认证错误且还没重试过多次，尝试重试
      if (errorMessage.includes('认证') && retryCount < 2) {
        console.log('📋 [任务列表] 认证错误，1秒后重试...', retryCount + 1)
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          fetchTaskList(true)
        }, 1000)
        return
      }
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [getBatchTaskList, urlTaskId, retryCount])

  // 监听认证状态变化，用户登录后重新获取数据
  useEffect(() => {
    // 只有在认证完成且有用户时才获取数据
    if (!loading && user) {
      console.log('👤 [认证状态] 用户已登录，获取任务列表')
      fetchTaskList()
    } else if (!loading && !user) {
      console.log('👤 [认证状态] 用户未登录')
      setError('请先登录')
      setIsLoading(false)
    }
  }, [user, loading, fetchTaskList])

  // 当选中任务变化时，获取该任务的详细信息
  useEffect(() => {
    if (!selectedTaskId) return

    // 立即获取任务详情（包含笔记数据）
    const fetchTaskDetails = async () => {
      try {
        const taskDetails = await getBatchTaskStatus(selectedTaskId)
        if (taskDetails) {
          setSelectedTask(taskDetails)
        }
      } catch (error) {
        console.error('获取任务详情失败:', error)
      }
    }

    fetchTaskDetails()

    const selectedTaskData = taskList.find(task => task.id === selectedTaskId)
    if (selectedTaskData) {
      // 如果任务还在处理中，设置轮询
      if (selectedTaskData.status === 'processing') {
        const intervalId = setInterval(async () => {
          try {
            const updatedStatus = await getBatchTaskStatus(selectedTaskId)
            if (updatedStatus) {
              // 更新任务列表中的对应任务
              setTaskList(prev => prev.map(task => 
                task.id === selectedTaskId 
                  ? { ...task, ...updatedStatus, status: updatedStatus.status }
                  : task
              ))
              
                             // 更新当前选中任务
               setSelectedTask((prev: any) => ({ ...prev, ...updatedStatus }))

              // 如果任务完成，停止轮询
              if (updatedStatus.status !== 'processing') {
                clearInterval(intervalId)
              }
            }
          } catch (error) {
            console.error('轮询任务状态失败:', error)
            clearInterval(intervalId)
          }
        }, 3000)

        // 清理函数
        return () => clearInterval(intervalId)
      }
    }
  }, [selectedTaskId, taskList, getBatchTaskStatus])

  // 转换选中的任务数据格式，兼容现有UI组件
  // 将任务的笔记数据转换为Task数组，每个笔记对应一个Task
  const convertedTasks: Task[] = useMemo(() => {
    if (!selectedTask?.notes) return []
    
    console.log('🔍 [前端] 转换任务数据:', selectedTask)
    
    return selectedTask.notes.map((note: any, index: number) => {
      console.log(`📝 [前端] 处理笔记 ${index + 1}:`, {
        noteId: note.id,
        noteStatus: note.status,
        generatedContents: note.generatedContents,
        generatedContentsLength: note.generatedContents?.length
      })
      
      // 确保每个笔记至少有一个占位的生成内容，即使还没开始生成
      let results = []
      
      if (note.generatedContents && note.generatedContents.length > 0) {
        // 如果有生成内容，使用实际数据
        console.log(`✅ [前端] 笔记 ${index + 1} 有 ${note.generatedContents.length} 个生成内容`)
        results = note.generatedContents.map((content: any, contentIndex: number) => {
          console.log(`📄 [前端] 生成内容 ${contentIndex + 1}:`, {
            id: content.id,
            title: content.title,
            contentLength: content.content?.length,
            status: content.status
          })
          return {
            id: content.id,
            title: content.title || "", // 使用空字符串而不是null
            content: content.content || "", // 使用空字符串而不是null
            status: content.status === 'completed' ? 'completed' : content.status === 'failed' ? 'failed' : 'generating'
          }
        })
      } else {
        // 如果没有生成内容，创建占位内容（根据配置决定数量，默认3个）
        console.log(`⚠️ [前端] 笔记 ${index + 1} 没有生成内容，创建占位内容`)
        const contentCount = selectedTask.config?.contentCount || 3
        results = Array.from({ length: contentCount }, (_, i) => ({
          id: `placeholder-${note.id}-${i}`,
          title: "",
          content: "",
          status: note.status === 'processing' ? 'generating' : 'generating' as const
        }))
      }

      return {
        id: note.id,
        noteTitle: note.noteData?.title || `笔记 ${index + 1}`,
        noteCover: note.noteData?.cover || "/placeholder.svg", // 使用本地占位符图片
        status: note.status === 'completed' ? 'completed' : note.status === 'failed' ? 'failed' : 'generating' as const,
        results
      }
    })
  }, [selectedTask])

  // 当前选中的笔记ID（用于在笔记列表中高亮显示）
  const [selectedNoteId, setSelectedNoteId] = useState<string>("")

  // 当任务变化时，默认选中第一个笔记
  useEffect(() => {
    if (convertedTasks.length > 0) {
      // 如果当前选中的笔记不在新的任务中，或者没有选中笔记，则选中第一个
      const isCurrentNoteInTask = convertedTasks.some(task => task.id === selectedNoteId)
      if (!isCurrentNoteInTask) {
        setSelectedNoteId(convertedTasks[0].id)
      }
    } else {
      // 如果没有笔记，清空选中状态
      setSelectedNoteId("")
    }
  }, [selectedTaskId, convertedTasks]) // 依赖selectedTaskId，确保任务切换时重新选择笔记

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgb(248 250 252) 0%, rgb(219 234 254) 50%, rgb(199 210 254) 100%)',
        overflow: 'hidden'
      }}
    >
      {/* 主内容容器 - 80%宽度，100%高度 */}
      <div 
        style={{ 
          width: '75vw',
          height: '100vh',
          display: 'flex',
          overflow: 'hidden',
          marginLeft: '10vw'
        }}
      >
        {/* Left Sidebar - 固定宽度 */}
        <TaskSidebar 
          tasks={convertedTasks} 
          selectedTaskId={selectedTaskId} 
          onTaskSelect={setSelectedTaskId}
          selectedNoteId={selectedNoteId}
          onNoteSelect={setSelectedNoteId}
          taskName={selectedTask?.taskName || '批量改写任务'}
          taskList={taskList}
        />

        {/* Main Content - 自适应宽度 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {selectedNoteId && convertedTasks.length > 0 ? (
            <ResultViewer 
              task={convertedTasks.find(task => task.id === selectedNoteId)!} 
              taskName={selectedTask?.taskName}
              allTasks={convertedTasks}
            />
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'white'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {isLoading ? '加载中...' : error ? '加载失败' : '请选择一个笔记'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isLoading ? '正在获取任务数据...' : error || '从左侧列表中选择一个笔记来查看改写结果'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsPageContent />
    </Suspense>
  )
}
