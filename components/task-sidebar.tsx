"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, Sparkles, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface GeneratedContent {
  id: string
  title: string
  content: string
  status: "generating" | "completed" | "failed"
}

interface Task {
  id: string
  noteTitle: string
  noteCover: string
  status: "generating" | "completed" | "failed"
  results: GeneratedContent[]
}

interface TaskSidebarProps {
  tasks: Task[] // 当前选中任务的笔记列表（用于右侧显示）
  selectedTaskId: string
  onTaskSelect: (taskId: string) => void
  selectedNoteId?: string // 当前选中的笔记ID
  onNoteSelect?: (noteId: string) => void // 选择笔记的回调
  taskName?: string // 当前任务名
  taskList?: any[] // 用户的所有任务列表（用于左侧任务列表）
}

export function TaskSidebar({ tasks, selectedTaskId, onTaskSelect, selectedNoteId, onNoteSelect, taskName, taskList }: TaskSidebarProps) {
  const [isTaskListCollapsed, setIsTaskListCollapsed] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "generating":
        return <Clock className="h-3 w-3 text-yellow-500 animate-spin" />
      case "failed":
        return <XCircle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成"
      case "generating":
        return "生成中"
      case "failed":
        return "生成失败"
      default:
        return ""
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      case "generating":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
      case "failed":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
    }
  }

  const handleExportAllTasks = () => {
    const allTasksContent = tasks
      .map((task, taskIndex) => {
        const taskContent = task.results
          .map((result, resultIndex) => {
            return `${result.title}\n\n${result.content}`
          })
          .join("\n\n" + "=".repeat(50) + "\n\n")

        return `任务${taskIndex + 1}：${task.noteTitle}\n${"=".repeat(80)}\n\n${taskContent}`
      })
      .join("\n\n" + "█".repeat(100) + "\n\n")

    const blob = new Blob([allTasksContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `批量生成任务_全部内容.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={cn(
        "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-slate-700/50 h-full overflow-hidden flex transition-all duration-300",
        isTaskListCollapsed ? "w-80" : "w-[500px]",
      )}
    >
      {/* 左侧：任务列表 */}
      <div
        className={cn(
          "border-r border-gray-200/50 dark:border-slate-700/50 h-full overflow-y-auto transition-all duration-300",
          isTaskListCollapsed ? "w-0 opacity-0" : "w-48",
        )}
      >
        <div className="p-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">我的任务</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">共 {taskList?.length || 0} 个任务</p>
            </div>
          </div>
        </div>

        <div className="p-2 space-y-2">
          {taskList?.map((task, index) => (
            <Card
              key={task.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md border-0 p-2",
                selectedTaskId === task.id
                  ? "ring-1 ring-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20"
                  : "bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700",
              )}
              onClick={() => onTaskSelect(task.id)}
            >
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">#{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs text-gray-900 dark:text-white line-clamp-1 mb-1">
                    {task.taskName || `任务 ${index + 1}`}
                  </h3>
                  <div className="flex items-center justify-between">
                    <Badge className={cn("text-xs px-2 py-0.5 rounded-full border-0", getStatusColor(task.status))}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(task.status)}
                        <span className="text-xs">{getStatusText(task.status)}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {task.progress?.total || 0} 个笔记 · {task.contentStats?.completed || 0} 个内容
                  </div>
                </div>
              </div>
            </Card>
          )) || (
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">
              暂无任务
            </div>
          )}
        </div>
      </div>

      {/* 中间：笔记列表 */}
      <div
        className={cn(
          "h-full overflow-y-auto border-r border-gray-200/50 dark:border-slate-700/50",
          isTaskListCollapsed ? "w-80" : "w-80",
        )}
      >
        {/* 收起/展开按钮和导出按钮 */}
        <div className="p-2 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTaskListCollapsed(!isTaskListCollapsed)}
              className="w-8 h-8 p-0 rounded-lg"
            >
              {isTaskListCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{taskName || '任务详情'}</h3>
          </div>
          <Button
            onClick={handleExportAllTasks}
            size="sm"
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg shadow-sm text-xs px-3 py-1 h-7"
          >
            <Download className="h-3 w-3 mr-1" />
            导出全部
          </Button>
        </div>

        <div className="p-2 space-y-2">
          {selectedTaskId && tasks.length > 0 ? (
            tasks.map((task, index) => (
              <Card 
                key={task.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md border-0",
                  selectedNoteId === task.id
                    ? "ring-1 ring-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                    : "bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                )}
                onClick={() => onNoteSelect?.(task.id)}
              >
                <CardContent className="p-2">
                  <div className="flex gap-2">
                    <div className="w-10 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                      <Image
                        src={task.noteCover || "/placeholder.svg"}
                        alt="笔记封面"
                        width={40}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">#{index + 1}</span>
                        <Badge className={cn("text-xs px-2 py-0.5 rounded-full border-0", getStatusColor(task.status))}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            <span className="text-xs">{getStatusText(task.status)}</span>
                          </div>
                        </Badge>
                      </div>
                      <h4 className="font-medium text-xs text-gray-900 dark:text-white line-clamp-2 mb-2 leading-tight">
                        {task.noteTitle}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Badge className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0 rounded-full">
                          图文笔记
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {task.results.length}篇内容
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">
              暂无笔记
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
