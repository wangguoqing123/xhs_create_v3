"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, XCircle, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { preprocessImageUrl } from "@/lib/image-utils"

// 智能图片组件 - 自动处理加载失败
function SmartImage({ 
  src, 
  alt, 
  width, 
  height, 
  className 
}: { 
  src: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(() => {
    // 如果是小红书图片链接，使用代理
    if (src && (src.includes('sns-webpic-qc.xhscdn.com') || src.includes('ci.xiaohongshu.com'))) {
      return `/api/image-proxy?url=${encodeURIComponent(src)}`
    }
    return preprocessImageUrl(src, '/placeholder.svg')
  })

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget
    
    if (!imageError && img.src !== '/placeholder.svg') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🖼️ [SmartImage] 图片加载失败，尝试占位符:', src)
      }
      setImageError(true)
      setImageSrc('/placeholder.svg')
    }
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  )
}

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

interface NoteListSidebarProps {
  tasks: Task[]
  selectedNoteId: string
  onNoteSelect: (noteId: string) => void
  taskName?: string
  hasMore?: boolean
  onLoadMore?: () => void
  totalCount?: number
  className?: string
}

export function NoteListSidebar({ 
  tasks, 
  selectedNoteId, 
  onNoteSelect, 
  taskName,
  hasMore,
  onLoadMore,
  totalCount,
  className 
}: NoteListSidebarProps) {
  // 获取状态图标
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

  // 获取状态文本和样式
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return {
          text: "已完成",
          className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
        }
      case "generating":
        return {
          text: "生成中",
          className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
        }
      case "failed":
        return {
          text: "生成失败",
          className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        }
      default:
        return {
          text: "待生成",
          className: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
        }
    }
  }

  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-r-2xl border-r border-gray-200/50 dark:border-slate-700/50 h-full flex flex-col", className)}>
      {/* 标题区域 */}
      <CardHeader className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
              笔记列表
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {taskName || '任务详情'} - 共 {totalCount || tasks.length} 篇笔记
              {tasks.length < (totalCount || 0) && ` · 已显示 ${tasks.length} 篇`}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* 笔记列表 */}
      <CardContent className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-2">
          {tasks.length > 0 ? (
            tasks.map((task, index) => {
              const statusDisplay = getStatusDisplay(task.status)
              const isSelected = task.id === selectedNoteId
              const completedCount = task.results.filter(r => r.status === "completed").length
              const totalCount = task.results.length

              return (
                <Card
                  key={task.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300 hover:shadow-lg border-0",
                    isSelected
                      ? "ring-2 ring-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-xl scale-105"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 shadow-md hover:scale-102"
                  )}
                  onClick={() => onNoteSelect(task.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-2.5">
                                      {/* 笔记封面 - 3:4比例 */}
                <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                  <SmartImage
                    src={task.noteCover || "/placeholder.svg"}
                    alt="笔记封面"
                    width={48}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>

                      <div className="flex-1 min-w-0">
                        {/* 笔记编号和状态 - 更紧凑 */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            {index + 1}
                          </div>
                          <Badge className={cn("text-xs px-1.5 py-0.5 rounded-full border-0", statusDisplay.className)}>
                            <div className="flex items-center gap-0.5">
                              {getStatusIcon(task.status)}
                              <span className="text-xs">{statusDisplay.text}</span>
                            </div>
                          </Badge>
                        </div>

                        {/* 笔记标题 - 更紧凑 */}
                        <h3 className={cn(
                          "font-medium text-xs text-gray-900 dark:text-white line-clamp-2 mb-1.5 leading-tight",
                          isSelected ? "font-semibold" : ""
                        )}>
                          {task.noteTitle}
                        </h3>

                        {/* 生成进度和内容统计 - 简化 */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {completedCount}/{totalCount} 篇
                          </span>

                          {/* 进度条 - 缩小 */}
                          {totalCount > 0 && (
                            <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                暂无笔记
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                请选择一个任务查看相关笔记
              </p>
            </div>
          )}
          
          {/* 加载更多按钮 */}
          {hasMore && tasks.length > 0 && (
            <div className="px-4 pb-4">
              <Button
                onClick={onLoadMore}
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
        </div>
      </CardContent>
    </div>
  )
} 