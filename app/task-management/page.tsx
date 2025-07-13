"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw,
  Calendar,
  User,
  FileText,
  Sparkles,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Edit3,
  Settings,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

// 任务状态类型
type TaskStatus = "pending" | "generating" | "completed" | "failed" | "cancelled"

// 任务类型
interface Task {
  id: string
  taskName: string
  taskType: "batch_rewrite" | "author_copy" | "note_rewrite" | "rewrite"
  status: TaskStatus
  progress: {
    total: number
    completed: number
    failed: number
  }
  createdAt: string
  updatedAt: string
  creditsConsumed: number
  notes?: TaskNote[]
}

// 任务笔记类型
interface TaskNote {
  id: string
  title: string
  cover: string
  status: TaskStatus
  content: string
  generatedAt?: string
}

export default function TaskManagementPage() {
  const { user, loading: authLoading } = useMySQLAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // 获取任务列表
  const fetchTasks = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      // 模拟API调用 - 实际应该调用真实的API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟数据
      const mockTasks: Task[] = [
        {
          id: "task_1",
          taskName: "美食探店批量改写",
          taskType: "batch_rewrite",
          status: "completed",
          progress: { total: 10, completed: 8, failed: 2 },
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T11:45:00Z",
          creditsConsumed: 80,
          notes: [
            {
              id: "note_1",
              title: "上海网红咖啡店探店记",
              cover: "/placeholder.jpg",
              status: "completed",
              content: "今天去了上海最火的咖啡店...",
              generatedAt: "2024-01-15T11:30:00Z"
            }
          ]
        },
        {
          id: "task_2", 
          taskName: "护肤品种草文案生成",
          taskType: "author_copy",
          status: "generating",
          progress: { total: 5, completed: 2, failed: 0 },
          createdAt: "2024-01-16T09:15:00Z",
          updatedAt: "2024-01-16T09:45:00Z",
          creditsConsumed: 20
        },
        {
          id: "task_3",
          taskName: "旅行攻略改写",
          taskType: "note_rewrite", 
          status: "failed",
          progress: { total: 3, completed: 0, failed: 3 },
          createdAt: "2024-01-14T14:20:00Z",
          updatedAt: "2024-01-14T14:35:00Z",
          creditsConsumed: 15
        }
      ]
      
      setTasks(mockTasks)
      if (mockTasks.length > 0 && !selectedTask) {
        setSelectedTask(mockTasks[0])
      }
    } catch (error) {
      console.error("获取任务列表失败:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  // 获取状态图标
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "generating":
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取状态文本
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "已完成"
      case "generating":
        return "生成中"
      case "failed":
        return "失败"
      case "cancelled":
        return "已取消"
      default:
        return "待处理"
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      case "generating":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
      case "failed":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      case "cancelled":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
      default:
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
    }
  }

  // 获取任务类型文本
  const getTaskTypeText = (type: string) => {
    switch (type) {
      case "batch_rewrite":
        return "批量改写"
      case "author_copy":
        return "作者复刻"
      case "rewrite":
        return "笔记翻写"
      case "rewrite":
        return "爆文改写"
      default:
        return "未知类型"
    }
  }

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // 切换任务展开状态
  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  // 格式化时间
  const formatTime = (timeString: string) => {
    try {
      return formatDistanceToNow(new Date(timeString), { 
        addSuffix: true, 
        locale: zhCN 
      })
    } catch {
      return timeString
    }
  }

  // 未登录状态
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center pt-20">
        <Card className="w-96 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">需要登录</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              请先登录后查看任务管理
            </p>
            <Button onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-8">
      <div className="px-4 py-8 max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            任务管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">管理您的所有创作任务</p>
        </div>

        {/* 搜索和过滤 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="all">所有状态</option>
            <option value="pending">待处理</option>
            <option value="generating">生成中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        {/* 响应式布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 任务列表 */}
          <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">暂无任务</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    您还没有创建任何任务
                  </p>
                  <Button onClick={() => window.location.href = '/search'}>
                    开始创作
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={cn(
                    "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl cursor-pointer transition-all duration-200",
                    selectedTask?.id === task.id ? "ring-2 ring-blue-500" : "hover:shadow-2xl"
                  )}
                  onClick={() => setSelectedTask(task)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {task.taskName}
                          </h3>
                          <Badge className={cn("text-xs", getStatusColor(task.status))}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(task.status)}
                              {getStatusText(task.status)}
                            </div>
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {getTaskTypeText(task.taskType)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatTime(task.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4" />
                            {task.creditsConsumed} 积分
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTaskExpanded(task.id)
                        }}
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* 进度条 */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>进度</span>
                        <span>{task.progress.completed}/{task.progress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(task.progress.completed / task.progress.total) * 100}%` }}
                        />
                      </div>
                      {task.progress.failed > 0 && (
                        <div className="text-xs text-red-500 mt-1">
                          {task.progress.failed} 个失败
                        </div>
                      )}
                    </div>

                    {/* 展开的详细信息 */}
                    {expandedTasks.has(task.id) && task.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          生成内容 ({task.notes.length})
                        </h4>
                        <div className="space-y-2">
                          {task.notes.map((note) => (
                            <div
                              key={note.id}
                              className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {note.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {note.generatedAt && formatTime(note.generatedAt)}
                                </div>
                              </div>
                              <Badge className={cn("text-xs", getStatusColor(note.status))}>
                                {getStatusText(note.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* 任务详情 */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  任务详情
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTask ? (
                  <div className="space-y-6">
                    {/* 基本信息 */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {selectedTask.taskName}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">类型</span>
                          <span className="font-medium">{getTaskTypeText(selectedTask.taskType)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">状态</span>
                          <Badge className={cn("text-xs", getStatusColor(selectedTask.status))}>
                            {getStatusText(selectedTask.status)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">创建时间</span>
                          <span className="font-medium">{formatTime(selectedTask.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">积分消耗</span>
                          <span className="font-medium text-orange-600">{selectedTask.creditsConsumed}</span>
                        </div>
                      </div>
                    </div>

                    {/* 进度统计 */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">进度统计</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">{selectedTask.progress.total}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">总数</div>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-lg font-bold text-green-600">{selectedTask.progress.completed}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">已完成</div>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-lg font-bold text-red-600">{selectedTask.progress.failed}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">失败</div>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="space-y-2">
                      <Button className="w-full" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        查看详情
                      </Button>
                      {selectedTask.status === "completed" && (
                        <Button variant="outline" className="w-full" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          导出结果
                        </Button>
                      )}
                      {selectedTask.status === "failed" && (
                        <Button variant="outline" className="w-full" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          重新生成
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      选择一个任务查看详情
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 