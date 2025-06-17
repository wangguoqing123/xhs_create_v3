"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface GeneratedContent {
  id: string
  title: string
  content: string
  status: "generating" | "completed" | "failed"
}

interface Task {
  id: string
  noteTitle: string
  status: "generating" | "completed" | "failed"
  results: GeneratedContent[]
}

interface TaskListProps {
  tasks: Task[]
  selectedTaskId: string
  onTaskSelect: (taskId: string) => void
}

export function TaskList({ tasks, selectedTaskId, onTaskSelect }: TaskListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "generating":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
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
        return "失败"
      default:
        return ""
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-medium mb-4">生成任务</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={cn(
              "cursor-pointer transition-colors hover:shadow-md",
              selectedTaskId === task.id ? "ring-2 ring-purple-500 bg-purple-50" : "",
            )}
            onClick={() => onTaskSelect(task.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm line-clamp-2">{task.noteTitle}</h3>
                <div className="flex items-center gap-1 ml-2">{getStatusIcon(task.status)}</div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {getStatusText(task.status)}
                </Badge>
                <span className="text-xs text-gray-500">{task.results.length} 篇内容</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
