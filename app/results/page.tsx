"use client"

import { useState, useEffect, Suspense, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { TaskHeader } from "@/components/task-header"
import { NoteListSidebar } from "@/components/note-list-sidebar"
import { ResultViewer } from "@/components/result-viewer"
import { useBatchRewrite } from "@/lib/hooks/use-batch-rewrite"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
  
  // 任务分页状态
  const [taskOffset, setTaskOffset] = useState(0)
  const [taskHasMore, setTaskHasMore] = useState(false)
  const [taskIsLoadingMore, setTaskIsLoadingMore] = useState(false)
  const [taskTotal, setTaskTotal] = useState(0)
  
  // 笔记分页状态
  const [notePageSize] = useState(20)
  const [notesDisplayCount, setNotesDisplayCount] = useState(20)

  // 批量改写Hook
  const { getBatchTaskList, getBatchTaskStatus } = useBatchRewrite()
  
  // 获取认证状态
  const { user, loading } = useMySQLAuth()

  // 获取URL参数中的taskId（如果有的话，默认选中这个任务）
  const urlTaskId = searchParams?.get("taskId")

  // 获取用户所有任务列表
  const fetchTaskList = useCallback(async (reset: boolean = true, isRetry: boolean = false) => {
    try {
      const currentOffset = reset ? 0 : taskOffset
      
      if (!isRetry) {
        setIsLoading(reset ? true : false)
        setTaskIsLoadingMore(reset ? false : true)
        setError(null)
      }
      
      console.log('📋 [任务列表] 开始获取任务列表...', { user, loading, offset: currentOffset })
      const result = await getBatchTaskList(20, currentOffset)
      
      console.log('📋 [任务列表] API返回结果:', result)
      
      if (!result) {
        throw new Error("获取任务列表失败")
      }

      console.log('📋 [任务列表] 获取成功，任务数量:', result.tasks?.length || 0)
      console.log('📋 [任务列表] 任务详情:', result.tasks)
      
      // 根据是否重置来决定如何更新数据
      if (reset) {
        setTaskList(result.tasks || [])
        setTaskOffset(20) // 下次加载的偏移量
      } else {
        setTaskList(prev => [...prev, ...(result.tasks || [])])
        setTaskOffset(prev => prev + 20)
      }
      
      // 更新分页信息
      setTaskTotal(result.total || 0)
      setTaskHasMore(result.hasMore || false)
      
      
      setIsLoading(false)
      setTaskIsLoadingMore(false)
      setRetryCount(0) // 重置重试计数
      
    } catch (error) {
      console.error('📋 [任务列表] 获取失败:', error)
      const errorMessage = error instanceof Error ? error.message : '获取任务列表失败'
      
      // 如果是认证错误且还没重试过多次，尝试重试
      if (errorMessage.includes('认证') && retryCount < 2) {
        console.log('📋 [任务列表] 认证错误，1秒后重试...', retryCount + 1)
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          fetchTaskList(true, true)
        }, 1000)
        return
      }
      
      setError(errorMessage)
      setIsLoading(false)
      setTaskIsLoadingMore(false)
    }
  }, [getBatchTaskList, urlTaskId, retryCount, taskOffset])

  // 加载更多任务
  const loadMoreTasks = useCallback(async () => {
    if (taskIsLoadingMore || !taskHasMore) return
    await fetchTaskList(false)
  }, [fetchTaskList, taskIsLoadingMore, taskHasMore])

  // 监听认证状态变化，用户登录后重新获取数据
  useEffect(() => {
    // 只有在认证完成且有用户时才获取数据
    if (!loading && user) {
      console.log('👤 [认证状态] 用户已登录，获取任务列表')
      setTaskOffset(0) // 重置偏移量
      fetchTaskList(true)
    } else if (!loading && !user) {
      console.log('👤 [认证状态] 用户未登录')
      setError('请先登录')
      setIsLoading(false)
    }
  }, [user, loading])

  // 处理任务选择逻辑 - 只在任务列表或URL参数变化时执行，不依赖selectedTaskId
  useEffect(() => {
    if (taskList.length === 0) return
    
    // 如果URL有taskId参数，尝试选中该任务
    if (urlTaskId) {
      const targetTask = taskList.find((task: any) => task.id === urlTaskId)
      if (targetTask) {
        setSelectedTaskId(urlTaskId)
      } else if (taskList.length > 0) {
        // 如果找不到指定任务，选中第一个
        setSelectedTaskId(taskList[0].id)
      }
    } else if (!selectedTaskId && taskList.length > 0) {
      // 没有指定taskId且没有当前选中任务，选中第一个任务
      setSelectedTaskId(taskList[0].id)
    }
  }, [taskList, urlTaskId]) // 移除selectedTaskId依赖，避免覆盖用户选择

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
    if (!selectedTask?.notes) {
      console.log('🔍 [前端] 没有选中任务或笔记数据:', { selectedTask })
      return []
    }
    
    console.log('🔍 [前端] 转换任务数据:', {
      selectedTask: selectedTask,
      notesCount: selectedTask.notes?.length,
      sampleNote: selectedTask.notes?.[0],
      displayCount: notesDisplayCount
    })
    
    // 只显示指定数量的笔记
    return selectedTask.notes.slice(0, notesDisplayCount).map((note: any, index: number) => {
      console.log(`📝 [前端] 处理笔记 ${index + 1}:`, {
        note: note,
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

      // 尝试从多个可能的数据源获取标题和封面
      // API返回的数据结构：note.noteData 包含原始笔记数据
      const noteData = note.noteData || note.note_data || {}
      
      // 从笔记数据中提取标题和封面，支持多种数据格式
      // 1. 搜索页面的Note格式：title, cover
      // 2. 小红书原始格式：note_display_title, note_cover_url_default
      // 3. 爆文格式：title, cover_image
      const title = noteData.title || noteData.note_display_title || noteData.noteTitle || `笔记 ${index + 1}`
      const cover = noteData.cover || noteData.note_cover_url_default || noteData.cover_image || noteData.noteCover || noteData.note_image_list?.[0] || "/placeholder.svg"
      
      // 开发环境调试信息
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [前端] 笔记 ${index + 1} 完整数据结构:`, {
          noteId: note.id,
          noteStatus: note.status,
          noteData: noteData,
          noteDataKeys: Object.keys(noteData),
          原始note对象: note,
          提取的title: title,
          提取的cover: cover,
          链接相关字段: {
            note_url: noteData.note_url,
            noteUrl: noteData.noteUrl,
            url: noteData.url
          }
        })
      }

      return {
        id: note.id,
        noteTitle: title,
        noteCover: cover,
        status: note.status === 'completed' ? 'completed' : note.status === 'failed' ? 'failed' : 'generating' as const,
        results
      }
    })
  }, [selectedTask, notesDisplayCount])

  // 当前选中的笔记ID（用于在笔记列表中高亮显示）
  const [selectedNoteId, setSelectedNoteId] = useState<string>("")
  
  // 加载更多笔记
  const loadMoreNotes = useCallback(() => {
    setNotesDisplayCount(prev => prev + notePageSize)
  }, [notePageSize])
  
  // 计算笔记分页信息
  const noteHasMore = selectedTask?.notes && notesDisplayCount < selectedTask.notes.length
  const noteTotalCount = selectedTask?.notes?.length || 0

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
  
  // 当选中任务变化时，重置笔记显示数量
  useEffect(() => {
    setNotesDisplayCount(notePageSize)
  }, [selectedTaskId, notePageSize])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-7xl w-full min-h-screen flex flex-col">
        {/* 顶部任务选择区域 */}
        <div className="mb-4 sm:mb-6">
          <TaskHeader
            taskList={taskList || []}
            selectedTaskId={selectedTaskId}
            onTaskSelect={(taskId: string) => {
              console.log('🔄 [Results] 任务切换:', {
                from: selectedTaskId,
                to: taskId
              })
              setSelectedTaskId(taskId)
            }}
            hasMore={taskHasMore}
            isLoadingMore={taskIsLoadingMore}
            onLoadMore={loadMoreTasks}
            total={taskTotal}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden"
          />
        </div>

        {/* 移动端笔记横向列表 */}
        <div className="lg:hidden mb-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <FileText className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">笔记列表</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                共 {noteTotalCount} 篇
                {convertedTasks.length < noteTotalCount && ` · 已显示 ${convertedTasks.length} 篇`}
              </span>
            </div>
            
            {convertedTasks.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto scrollbar-thin">
                  {convertedTasks.map((task, index) => {
                  const isSelected = task.id === selectedNoteId
                  const completedCount = task.results?.filter(r => r.status === 'completed').length || 0
                  const totalCount = task.results?.length || 0
                  
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "cursor-pointer transition-all duration-300 hover:shadow-lg rounded-2xl overflow-hidden border-2",
                        isSelected
                          ? "ring-2 ring-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-xl border-purple-300 dark:border-purple-600"
                          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                      )}
                      onClick={() => {
                        console.log('🔄 [Results] 笔记切换 (移动端):', {
                          from: selectedNoteId,
                          to: task.id,
                          noteCover: task.noteCover
                        })
                        setSelectedNoteId(task.id)
                      }}
                    >
                      <div className="p-3">
                        <div className="flex gap-3">
                          {/* 笔记封面 - 3:4比例 */}
                          <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                            <img
                              src={task.noteCover || "/placeholder.svg"}
                              alt="笔记封面"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement
                                if (img.src !== '/placeholder.svg') {
                                  img.src = '/placeholder.svg'
                                }
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* 笔记编号和进度 */}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                {index + 1}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {completedCount}/{totalCount} 篇
                              </span>
                            </div>

                            {/* 笔记标题 */}
                            <h3 className={cn(
                              "font-medium text-xs text-gray-900 dark:text-white line-clamp-2 mb-1.5 leading-tight",
                              isSelected ? "font-semibold" : ""
                            )}>
                              {task.noteTitle}
                            </h3>

                            {/* 进度条 */}
                            {totalCount > 0 && (
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                </div>
                
                {/* 加载更多按钮 */}
                {noteHasMore && (
                  <div className="mt-3">
                    <Button
                      onClick={loadMoreNotes}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2 h-10 text-sm bg-white/50 hover:bg-white/80 dark:bg-gray-800/50 dark:hover:bg-gray-700/80"
                    >
                      <span>加载更多笔记</span>
                      <Badge variant="outline" className="text-xs">
                        20
                      </Badge>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无笔记数据</p>
              </div>
            )}
          </div>
        </div>

        {/* 主内容区域：左右分栏 */}
        <div className="flex-1 flex gap-4 sm:gap-6 min-h-0">
          {/* 左侧笔记列表 - 桌面端显示 */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <NoteListSidebar
              tasks={convertedTasks}
              selectedNoteId={selectedNoteId}
              onNoteSelect={(noteId: string) => {
                const selectedTask = convertedTasks.find(task => task.id === noteId)
                console.log('🔄 [Results] 笔记切换 (桌面端):', {
                  from: selectedNoteId,
                  to: noteId,
                  noteCover: selectedTask?.noteCover
                })
                setSelectedNoteId(noteId)
              }}
              taskName={selectedTask?.taskName || '批量改写任务'}
              hasMore={noteHasMore}
              onLoadMore={loadMoreNotes}
              totalCount={noteTotalCount}
              className="h-full shadow-2xl"
            />
          </div>

          {/* 内容展示区域 - 占据剩余空间 */}
          <div className="flex-1 min-w-0">
            {selectedNoteId && convertedTasks.length > 0 ? (
              <div className="h-full">
                <ResultViewer 
                  task={convertedTasks.find(task => task.id === selectedNoteId)!} 
                  taskName={selectedTask?.taskName}
                  allTasks={convertedTasks}
                  originalTaskData={selectedTask}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 p-8 flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {isLoading ? '加载中...' : error ? '加载失败' : '选择笔记开始查看'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                    {isLoading ? '正在获取任务数据，请稍候...' : 
                     error ? error : 
                     convertedTasks.length === 0 ? '当前任务暂无笔记内容' :
                     '请从左侧列表中选择一个笔记来查看改写结果'}
                  </p>
                  
                  {error && (
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      重新加载
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
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
