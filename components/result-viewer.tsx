"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, CheckCircle, Download, FileText, Clock, AlertCircle, FileSpreadsheet } from "lucide-react"
import Image from "next/image"
import * as XLSX from 'xlsx'

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

interface ResultViewerProps {
  task: Task
  taskName?: string // 添加任务名称
  allTasks?: Task[] // 添加所有任务数据，用于完整导出
}

// 鱼骨加载组件
function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      {/* 标题骨架 */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
        </div>
      </div>
      
      {/* 内容骨架 */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-700 p-3 rounded-xl border border-gray-100 dark:border-slate-600 shadow-inner space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  )
}

// 逐字输出组件
function TypewriterText({ text, speed = 30, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const indexRef = useRef(0)

  useEffect(() => {
    // 确保text是字符串，如果为空或undefined，直接完成
    const safeText = text || ""
    
    if (safeText.length === 0) {
      setDisplayedText("")
      setIsTyping(false)
      onComplete?.()
      return
    }

    setDisplayedText("")
    setIsTyping(true)
    indexRef.current = 0

    const timer = setInterval(() => {
      if (indexRef.current < safeText.length) {
        setDisplayedText(prev => prev + safeText[indexRef.current])
        indexRef.current++
      } else {
        setIsTyping(false)
        clearInterval(timer)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, onComplete])

  return (
    <span className="relative">
      {displayedText}
      {isTyping && text && text.length > 0 && (
        <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse"></span>
      )}
    </span>
  )
}

// 内容展示组件
function ContentDisplay({ result, index }: { result: GeneratedContent; index: number }) {
  const [copiedId, setCopiedId] = useState<string>("")
  const [titleComplete, setTitleComplete] = useState(false)

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(""), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const getStatusBadge = () => {
    switch (result.status) {
      case "generating":
        return (
          <Badge className="mt-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-0 text-xs">
            <Clock className="h-3 w-3 mr-1 animate-spin" />
            生成中
          </Badge>
        )
      case "completed":
        return (
          <Badge className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            已完成
          </Badge>
        )
      case "failed":
        return (
          <Badge className="mt-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            生成失败
          </Badge>
        )
    }
  }

  // 如果正在生成且没有内容，显示骨架
  if (result.status === "generating" && (!result.title || !result.content)) {
    return (
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-gray-100 dark:border-slate-700 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <Clock className="h-4 w-4 text-white animate-spin" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  生成稿 {index + 1}
                </CardTitle>
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <SkeletonLoader />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-100 dark:border-slate-700 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                生成稿 {index + 1}
              </CardTitle>
              {getStatusBadge()}
            </div>
          </div>

          {result.status === "completed" && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleCopy(`${result.title}\n\n${result.content}`, result.id)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 rounded-lg text-xs px-2 py-1 h-7"
              >
                {copiedId === result.id ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    复制
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
                  {/* 标题 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">标题</h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                {result.status === "generating" && result.title && result.title.length > 0 ? (
                  <TypewriterText 
                    text={result.title} 
                    speed={50} 
                    onComplete={() => setTitleComplete(true)}
                  />
                ) : result.status === "completed" && result.title ? (
                  result.title
                ) : result.status === "failed" ? (
                  <span className="text-red-500">标题生成失败</span>
                ) : (
                  <span className="text-gray-500">标题生成中...</span>
                )}
              </p>
            </div>
          </div>

          {/* 正文 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">正文内容</h3>
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-700 p-3 rounded-xl border border-gray-100 dark:border-slate-600 shadow-inner max-h-64 overflow-y-auto">
              <div className="prose max-w-none">
                <pre className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {result.status === "generating" && result.content && result.content.length > 0 ? (
                    <TypewriterText 
                      text={result.content} 
                      speed={20}
                    />
                  ) : result.status === "completed" && result.content ? (
                    result.content
                  ) : result.status === "failed" ? (
                    <span className="text-red-500">内容生成失败，请重试</span>
                  ) : (
                    <span className="text-gray-500">内容生成中，请稍候...</span>
                  )}
                </pre>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  )
}

export function ResultViewer({ task, taskName, allTasks }: ResultViewerProps) {
  // 导出为文本文件
  const handleExportTxt = () => {
    // 只导出已完成的内容
    const completedResults = task.results.filter(result => result.status === "completed")
    
    if (completedResults.length === 0) {
      alert("暂无已完成的内容可导出")
      return
    }

    const allContent = completedResults
      .map((result, index) => {
        return `=== ${result.title} ===\n\n${result.content}\n\n${"=".repeat(50)}\n\n`
      })
      .join("")

    const blob = new Blob([allContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${task.noteTitle.slice(0, 20)}_批量生成内容.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导出为Excel文件（按数据层级结构）
  const handleExportExcel = () => {
    // 使用所有任务数据，如果没有则使用当前任务
    const tasksToExport = allTasks || [task]
    
    // 检查是否有已完成的内容
    const hasCompletedContent = tasksToExport.some(t => 
      t.results.some(r => r.status === "completed")
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
    tasksToExport.forEach((taskItem, taskIndex) => {
      // 只导出已完成的内容
      const completedResults = taskItem.results.filter(result => result.status === "completed")
      
      if (completedResults.length > 0) {
        completedResults.forEach((result, resultIndex) => {
          excelData.push([
            taskName || `批量改写任务`, // 任务名称
            taskIndex + 1, // 笔记编号
            taskItem.noteTitle, // 仿写笔记标题
            taskItem.noteCover, // 仿写笔记封面链接
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
    XLSX.utils.book_append_sheet(workbook, worksheet, '批量改写结果')
    
    // 生成文件名
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-')
    const fileName = `${taskName || '批量改写任务'}_${dateStr}_${timeStr}.xlsx`
    
    // 导出Excel文件
    XLSX.writeFile(workbook, fileName)
    
    // 显示成功提示
    alert(`Excel文件导出成功！\n文件名：${fileName}\n共导出 ${excelData.length - 1} 条记录`)
  }

  const completedCount = task.results.filter(result => result.status === "completed").length
  const generatingCount = task.results.filter(result => result.status === "generating").length

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Source Note Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Cover with 3:4 ratio */}
            <div className="w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-lg">
              <Image
                src={task.noteCover || "/placeholder.svg"}
                alt="源笔记"
                width={64}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  源笔记
                </Badge>
                <Badge className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  图文笔记
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">
                {task.noteTitle}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                已完成 <span className="font-semibold text-green-600 dark:text-green-400">{completedCount}</span> 篇
                {generatingCount > 0 && (
                  <>
                    ，生成中 <span className="font-semibold text-yellow-600 dark:text-yellow-400">{generatingCount}</span> 篇
                  </>
                )}
                ，共 <span className="font-semibold text-purple-600 dark:text-purple-400">{task.results.length}</span> 篇内容
              </p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            {/* <Button
              onClick={handleExportTxt}
              size="lg"
              disabled={completedCount === 0}
              className="h-10 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              导出TXT
            </Button> */}
            <Button
              onClick={handleExportExcel}
              size="lg"
              disabled={completedCount === 0}
              className="h-10 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              导出Excel ({completedCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Results - 横向并排显示 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-6">
            {task.results.map((result, index) => (
              <ContentDisplay 
                key={result.id} 
                result={result} 
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
