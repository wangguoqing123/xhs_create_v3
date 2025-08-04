"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, XCircle, Calendar, Filter, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskHeaderProps {
  taskList: any[]
  selectedTaskId: string
  onTaskSelect: (taskId: string) => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  total?: number
  className?: string
}

export function TaskHeader({ taskList, selectedTaskId, onTaskSelect, hasMore, isLoadingMore, onLoadMore, total, className }: TaskHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isMobileTaskListOpen, setIsMobileTaskListOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    period: "all" // all, today, week, month, custom
  })

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  // 获取状态文本和样式
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return {
          text: "已完成",
          className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
        }
      case "processing":
        return {
          text: "处理中",
          className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
        }
      case "failed":
        return {
          text: "失败",
          className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        }
      default:
        return {
          text: "待处理",
          className: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
        }
    }
  }

  // 根据时间筛选过滤任务
  const filteredTasks = useMemo(() => {
    if (!taskList) return []
    
    let filtered = [...taskList]
    
    // 根据选择的时间期间进行筛选
    if (dateFilter.period !== "all") {
      const now = new Date()
      let startDate: Date
      
      switch (dateFilter.period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "custom":
          if (dateFilter.startDate) {
            startDate = new Date(dateFilter.startDate)
            const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : now
            filtered = filtered.filter(task => {
              const taskDate = new Date(task.createdAt || task.created_at || now)
              return taskDate >= startDate && taskDate <= endDate
            })
          }
          return filtered
        default:
          return filtered
      }
      
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt || task.created_at || now)
        return taskDate >= startDate
      })
    }
    
    return filtered
  }, [taskList, dateFilter])

  // 选中的任务数据
  const selectedTask = filteredTasks.find(task => task.id === selectedTaskId)

  return (
    <div className={cn("w-full", className)}>
      {/* 顶部任务标题和筛选器 */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-t-2xl border-b border-gray-200/50 dark:border-slate-700/50 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 左侧标题信息 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                我的任务
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                共 {total || filteredTasks.length} 个任务
                {dateFilter.period !== "all" && ` (已筛选)`}
                {taskList.length < (total || 0) && ` · 已加载 ${taskList.length} 个`}
              </p>
            </div>
          </div>

          {/* 右侧筛选控制 */}
          <div className="flex items-center gap-3">
            {/* 快速筛选按钮 */}
            <div className="hidden sm:flex items-center gap-2">
              {[
                { key: "all", label: "全部" },
                { key: "today", label: "今天" },
                { key: "week", label: "最近7天" },
                { key: "month", label: "本月" }
              ].map(period => (
                <Button
                  key={period.key}
                  variant={dateFilter.period === period.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter(prev => ({ ...prev, period: period.key }))}
                  className={cn(
                    "rounded-lg text-xs transition-all duration-200",
                    dateFilter.period === period.key
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {period.label}
                </Button>
              ))}
            </div>

            {/* 高级筛选按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              高级筛选
              {isFilterOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>


          </div>
        </div>

        {/* 高级筛选面板 */}
        {isFilterOpen && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">时间范围</Label>
                <Select value={dateFilter.period} onValueChange={(value) => setDateFilter(prev => ({ ...prev, period: value }))}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="选择时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部时间</SelectItem>
                    <SelectItem value="today">今天</SelectItem>
                    <SelectItem value="week">最近7天</SelectItem>
                    <SelectItem value="month">本月</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateFilter.period === "custom" && (
                <>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">开始日期</Label>
                    <Input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">结束日期</Label>
                    <Input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                </>
              )}

              <div className="flex items-end">
                <Button
                  onClick={() => setDateFilter({ startDate: "", endDate: "", period: "all" })}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  重置筛选
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 桌面端：横向任务列表 */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-slate-700/50 p-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
          {filteredTasks.map((task, index) => {
            const statusDisplay = getStatusDisplay(task.status)
            const isSelected = task.id === selectedTaskId

            return (
              <div
                key={task.id}
                className={cn(
                  "flex-shrink-0 w-80 cursor-pointer transition-all duration-300 hover:shadow-lg rounded-2xl overflow-hidden border-2",
                  isSelected
                    ? "ring-2 ring-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-xl border-purple-300 dark:border-purple-600"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                )}
                onClick={() => onTaskSelect(task.id)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {task.taskName || `任务 ${index + 1}`}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("text-xs px-2 py-1 rounded-full border-0", statusDisplay.className)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            <span>{statusDisplay.text}</span>
                          </div>
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {task.progress?.total || 0} 笔记
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {task.createdAt ? new Date(task.createdAt).toLocaleDateString('zh-CN') : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="flex-shrink-0 flex items-center justify-center w-40">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="h-full min-h-[80px] w-full flex flex-col items-center justify-center space-y-2 bg-white/50 hover:bg-white/80 dark:bg-gray-800/50 dark:hover:bg-gray-700/80 border-dashed border-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">加载中...</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      +
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">加载更多</span>
                    <Badge variant="outline" className="text-xs">
                      20
                    </Badge>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 移动端：任务下拉选择 */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-slate-700/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">选择任务</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">共 {filteredTasks.length} 个任务</span>
        </div>
        <select 
          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          value={selectedTaskId}
          onChange={(e) => onTaskSelect(e.target.value)}
        >
          <option value="">请选择要查看的任务...</option>
          {filteredTasks.map((task, index) => (
            <option key={task.id} value={task.id}>
              任务 {index + 1}: {task.taskName || `任务 ${index + 1}`}
            </option>
          ))}
        </select>
        
        {/* 加载更多按钮 - 移动端 */}
        {hasMore && (
          <div className="mt-3">
            <Button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 h-10 text-sm bg-white/50 hover:bg-white/80 dark:bg-gray-800/50 dark:hover:bg-gray-700/80"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>加载中...</span>
                </>
              ) : (
                <>
                  <span>加载更多任务</span>
                  <Badge variant="outline" className="text-xs">
                    20
                  </Badge>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

    </div>
  )
} 