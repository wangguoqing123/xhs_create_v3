"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, Sparkles, Download, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { getProxiedImageUrl, preprocessImageUrl } from "@/lib/image-utils"
import * as XLSX from 'xlsx'

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
    // 使用预处理功能，确保URL有效
    return preprocessImageUrl(src, '/placeholder.svg')
  })

  // 处理图片加载错误
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ [SmartImage] 图片加载失败:', src)
    
    const img = event.currentTarget
    
    // 如果还没有尝试过占位符，使用占位符
    if (!imageError && img.src !== '/placeholder.svg') {
      setImageError(true)
      setImageSrc('/placeholder.svg')
      console.log('🔄 [SmartImage] 使用占位符图片')
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

  // 导出TXT文件
  const handleExportTxt = () => {
    const allTasksContent = tasks
      .map((task, taskIndex) => {
        const taskContent = task.results
          .filter(result => result.status === "completed") // 只导出已完成的内容
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

  // 导出Excel文件（任务汇总）
  const handleExportExcel = () => {
    // 检查是否有已完成的内容
    const hasCompletedContent = tasks.some(task => 
      task.results.some(result => result.status === "completed")
    )
    
    if (!hasCompletedContent) {
      alert("暂无已完成的内容可导出")
      return
    }

    // 准备Excel数据
    const excelData = []
    
    // 添加表头
    excelData.push([
      '任务名称',
      '笔记编号',
      '仿写笔记标题', 
      '仿写笔记封面链接',
      '内容编号',
      '仿写标题',
      '仿写内容',
      '生成状态',
      '导出时间'
    ])

    // 遍历所有任务
    tasks.forEach((task, taskIndex) => {
      // 只导出已完成的内容
      const completedResults = task.results.filter(result => result.status === "completed")
      
      if (completedResults.length > 0) {
        completedResults.forEach((result, resultIndex) => {
          excelData.push([
            taskName || `批量改写任务`, // 任务名称
            taskIndex + 1, // 笔记编号
            task.noteTitle, // 仿写笔记标题
            task.noteCover, // 仿写笔记封面链接
            resultIndex + 1, // 内容编号
            result.title || '', // 仿写标题
            result.content || '', // 仿写内容
            '已完成', // 生成状态
            new Date().toLocaleString('zh-CN') // 导出时间
          ])
        })
      }
    })

    // 如果没有数据行，说明没有已完成的内容
    if (excelData.length <= 1) {
      alert("暂无已完成的内容可导出")
      return
    }

    // 创建工作簿
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 20 }, // 任务名称
      { wch: 10 }, // 笔记编号
      { wch: 30 }, // 仿写笔记标题
      { wch: 40 }, // 仿写笔记封面链接
      { wch: 10 }, // 内容编号
      { wch: 35 }, // 仿写标题
      { wch: 60 }, // 仿写内容
      { wch: 10 }, // 生成状态
      { wch: 20 }  // 导出时间
    ]
    
    // 设置表头样式（加粗）
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:I1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E3F2FD" } },
        alignment: { horizontal: "center" }
      }
    }
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '批量改写汇总')
    
    // 生成文件名
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-')
    const fileName = `${taskName || '批量改写任务'}_汇总_${dateStr}_${timeStr}.xlsx`
    
    // 导出Excel文件
    XLSX.writeFile(workbook, fileName)
    
    // 显示成功提示
    alert(`Excel文件导出成功！\n文件名：${fileName}\n共导出 ${excelData.length - 1} 条记录`)
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border-r border-gray-200/50 dark:border-slate-700/50 h-full overflow-hidden flex transition-all duration-300",
        // 根据收起状态调整宽度 - 减少侧边栏宽度为右侧内容区域让出更多空间
        isTaskListCollapsed ? "w-64" : "w-[400px]"
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
                    <Badge className={cn("text-xs px-2 py-0.5 rounded-full border-0 pointer-events-none", getStatusColor(task.status))}>
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
      <div className={cn(
        "h-full overflow-y-auto border-r border-gray-200/50 dark:border-slate-700/50 flex-1"
      )}>
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
          <div className="flex items-center gap-1">
            {/* <Button
              onClick={handleExportTxt}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg shadow-sm text-xs px-2 py-1 h-7"
            >
              <Download className="h-3 w-3 mr-1" />
              TXT
            </Button> */}
            <Button
              onClick={handleExportExcel}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg shadow-sm text-xs px-2 py-1 h-7"
            >
              <FileSpreadsheet className="h-3 w-3 mr-1" />
              Excel
            </Button>
          </div>
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
                      <SmartImage
                        src={task.noteCover || "/placeholder.svg"} // 使用代理URL
                        alt="笔记封面"
                        width={40}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">#{index + 1}</span>
                        <Badge className={cn("text-xs px-2 py-0.5 rounded-full border-0 pointer-events-none", getStatusColor(task.status))}>
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
