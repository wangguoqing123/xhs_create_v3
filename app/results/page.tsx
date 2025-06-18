"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { TaskSidebar } from "@/components/task-sidebar"
import { ResultViewer } from "@/components/result-viewer"
import { useBatchRewrite } from "@/lib/hooks/use-batch-rewrite"

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
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [taskList, setTaskList] = useState<any[]>([]) // 用户的所有任务列表
  const [selectedTask, setSelectedTask] = useState<any>(null) // 当前选中的任务详情
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 批量改写Hook
  const { getTaskList, getTaskStatus } = useBatchRewrite()

  // 获取URL参数中的taskId（如果有的话，默认选中这个任务）
  const urlTaskId = searchParams?.get("taskId")

  // 获取用户所有任务列表
  useEffect(() => {
    const fetchTaskList = async () => {
      try {
        setIsLoading(true)
        const result = await getTaskList()
        
        if (!result) {
          setError("获取任务列表失败")
          return
        }

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
      } catch (error) {
        console.error('获取任务列表失败:', error)
        setError(error instanceof Error ? error.message : '获取任务列表失败')
        setIsLoading(false)
      }
    }

    fetchTaskList()
  }, [getTaskList, urlTaskId])

  // 当选中任务变化时，获取该任务的详细信息
  useEffect(() => {
    if (!selectedTaskId) return

    const selectedTaskData = taskList.find(task => task.id === selectedTaskId)
    if (selectedTaskData) {
      setSelectedTask(selectedTaskData)

      // 如果任务还在处理中，设置轮询
      if (selectedTaskData.status === 'processing') {
        const intervalId = setInterval(async () => {
          try {
            const updatedStatus = await getTaskStatus(selectedTaskId)
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
  }, [selectedTaskId, taskList, getTaskStatus])

  // 转换选中的任务数据格式，兼容现有UI组件
  // 将任务的笔记数据转换为Task数组，每个笔记对应一个Task
  const convertedTasks: Task[] = selectedTask?.notes?.map((note: any, index: number) => ({
    id: note.id,
    noteTitle: note.noteData?.title || `笔记 ${index + 1}`,
    noteCover: note.noteData?.cover || "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=400&fit=crop&crop=center",
    status: note.status === 'completed' ? 'completed' : note.status === 'failed' ? 'failed' : 'generating',
    results: note.generatedContents?.map((content: any) => ({
      id: content.id,
      title: content.title || "生成中...",
      content: content.content || "内容生成中，请稍候...",
      status: content.status === 'completed' ? 'completed' : content.status === 'failed' ? 'failed' : 'generating'
    })) || []
  })) || []

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-colors duration-300">
      <Header />
      <div className="pt-20 h-screen flex">
        {/* Left Sidebar */}
        <TaskSidebar 
          tasks={convertedTasks} 
          selectedTaskId={selectedTaskId} 
          onTaskSelect={setSelectedTaskId}
          selectedNoteId={selectedNoteId}
          onNoteSelect={setSelectedNoteId}
          taskName={selectedTask?.taskName || '批量改写任务'}
          taskList={taskList}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-700 dark:text-gray-300">正在加载任务数据...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-red-600 mb-2">加载失败</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  重新加载
                </button>
              </div>
            </div>
          ) : selectedTask && convertedTasks.length > 0 ? (
            <ResultViewer task={convertedTasks.find(t => t.id === selectedNoteId) || convertedTasks[0]} />
          ) : selectedTask ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  {selectedTask.taskName}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  任务状态：{selectedTask.status === 'completed' ? '已完成' : selectedTask.status === 'processing' ? '处理中' : '待处理'}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  包含 {selectedTask.progress?.total || 0} 个笔记，生成了 {selectedTask.contentStats?.completed || 0} 个内容
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-xl">
              请选择一个任务查看结果
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
