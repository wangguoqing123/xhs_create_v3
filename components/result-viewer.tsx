"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, CheckCircle, XCircle, Clock, Download, FileText, AlertCircle, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import * as XLSX from 'xlsx'
import { getProxiedImageUrl, preprocessImageUrl } from "@/lib/image-utils"

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

interface ResultViewerProps {
  task: Task
  taskName?: string // 添加任务名称
  allTasks?: Task[] // 添加所有任务数据，用于完整导出
  originalTaskData?: any // 添加原始任务数据，用于获取笔记链接等信息
}

// 鱼骨加载组件
function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      {/* 标题骨架 */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/30">
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
        <span className="inline-block w-0.5 h-4 bg-purple-500 ml-0.5 animate-pulse"></span>
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
          <Badge className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0 text-xs pointer-events-none">
            <CheckCircle className="h-3 w-3 mr-1 pointer-events-none" />
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
                  版本 {index + 1}
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
    <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl hover:shadow-3xl transition-all duration-500 transform hover:scale-102 dark:shadow-black/30 group overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-900/10 dark:via-slate-800 dark:to-pink-900/10 border-b border-gray-100 dark:border-slate-700 rounded-t-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                版本 {index + 1}
              </CardTitle>
              {getStatusBadge()}
            </div>
          </div>

          {result.status === "completed" && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleCopy(`${result.title}\n\n${result.content}`, result.id)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl text-sm px-3 py-2 h-9 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {copiedId === result.id ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    复制
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {result.status === "completed" && result.title && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">标题</h3>
            </div>
            <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 shadow-inner">
              <div className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed text-base whitespace-pre-wrap">
                {result.title}
              </div>
            </div>
          </div>
        )}

        {result.content && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">正文内容</h3>
            </div>
            <div className="bg-gradient-to-br from-gray-50/80 via-white to-gray-50/50 dark:from-slate-800/50 dark:via-slate-700/30 dark:to-slate-800/50 p-6 rounded-2xl border border-gray-200/50 dark:border-slate-600/50 shadow-inner min-h-96 max-h-[700px] overflow-y-auto scrollbar-thin">
              <div className="w-full">
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans text-sm selection:bg-purple-200 dark:selection:bg-purple-800 selection:text-purple-900 dark:selection:text-purple-100">
                  {result.status === "generating" && result.content && result.content.length > 0 ? (
                    <TypewriterText 
                      text={result.content} 
                      speed={20}
                    />
                  ) : result.status === "completed" && result.content ? (
                    result.content
                  ) : result.status === "failed" ? (
                    <span className="text-red-500 dark:text-red-400 font-medium">⚠️ 内容生成失败，请重试</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 italic">✨ 内容生成中，请稍候...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {result.status === "failed" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">生成失败</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              内容生成过程中遇到了问题，请重试。
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-6 py-3 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
            >
              重新生成
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ResultViewer({ task, taskName, allTasks, originalTaskData }: ResultViewerProps) {
  const handleExportTxt = () => {
    if (!task) return
    
    const completedResults = task.results.filter(result => result.status === "completed")
    if (completedResults.length === 0) {
      alert("暂无已完成的内容可导出")
      return
    }

    const content = completedResults.map((result, index) => 
      `=== 版本 ${index + 1} ===\n标题：${result.title}\n\n内容：\n${result.content}`
    ).join('\n\n' + '='.repeat(50) + '\n\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${taskName || '批量改写任务'}_${task.noteTitle}_${new Date().toLocaleDateString('zh-CN')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = () => {
    if (!task) return
    
    // 准备Excel数据
    const excelData = [
      ['任务名称', '笔记编号', '仿写笔记标题', '仿写笔记封面链接', '内容编号', '仿写标题', '仿写内容', '生成状态', '导出时间']
    ]

    // 只导出已完成的内容
    const completedResults = task.results.filter(result => result.status === "completed")
    
    if (completedResults.length === 0) {
      alert("暂无已完成的内容可导出")
      return
    }

    completedResults.forEach((result, index) => {
      excelData.push([
        taskName || '批量改写任务', // 任务名称
        '1', // 笔记编号（单个笔记）
        task.noteTitle, // 仿写笔记标题
        task.noteCover || '', // 仿写笔记封面链接
        `版本${index + 1}`, // 内容编号
        result.title, // 仿写标题
        result.content, // 仿写内容
        '已完成', // 生成状态
        new Date().toLocaleString('zh-CN') // 导出时间
      ])
    })

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

  // 安全地获取统计数据
  const completedCount = task?.results?.filter(result => result.status === "completed").length || 0
  const generatingCount = task?.results?.filter(result => result.status === "generating").length || 0

  // 如果没有task，显示错误状态
  if (!task) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">数据加载错误</h3>
          <p className="text-gray-700 dark:text-gray-300">无法加载任务数据，请刷新页面重试</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
      {/* Source Note Header - 响应式设计 */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-pink-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 border-b border-gray-200/50 dark:border-slate-700/50 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Cover with enhanced styling */}
            <div className="w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100 shadow-2xl ring-2 ring-white dark:ring-slate-600">
              <SmartImage
                src={task.noteCover || "/placeholder.svg"}
                alt="源笔记"
                width={80}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  </div>
                  <Badge 
                    className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full border-0 font-medium cursor-pointer hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/50 dark:hover:to-pink-800/50 transition-all duration-200 hover:shadow-md"
                                         onClick={() => {
                       // 获取原文链接 - 添加详细调试信息
                       console.log('🔍 [查看原文] 开始调试数据结构')
                       console.log('🔍 [查看原文] originalTaskData:', originalTaskData)
                       console.log('🔍 [查看原文] task.id:', task.id)
                       
                       if (originalTaskData?.notes) {
                         console.log('🔍 [查看原文] notes数量:', originalTaskData.notes.length)
                         console.log('🔍 [查看原文] 所有notes的id:', originalTaskData.notes.map((note: any) => note.id))
                         
                         // 找到当前笔记的原始数据
                         const currentNote = originalTaskData.notes.find((note: any) => note.id === task.id)
                         console.log('🔍 [查看原文] 找到的currentNote:', currentNote)
                         
                         if (currentNote) {
                           const noteData = currentNote.noteData || currentNote.note_data || {}
                           console.log('🔍 [查看原文] noteData:', noteData)
                           console.log('🔍 [查看原文] noteData的所有键:', Object.keys(noteData))
                           
                           // 尝试从多个位置获取链接
                           const originalData = noteData.originalData || {}
                           console.log('🔍 [查看原文] originalData:', originalData)
                           console.log('🔍 [查看原文] originalData的所有键:', Object.keys(originalData))
                           
                           const noteUrl = noteData.note_url || noteData.noteUrl || noteData.url || 
                                          originalData.note_url || originalData.noteUrl || originalData.url
                           console.log('🔍 [查看原文] 尝试获取的链接字段:', {
                             'noteData.note_url': noteData.note_url,
                             'noteData.noteUrl': noteData.noteUrl,
                             'noteData.url': noteData.url,
                             'originalData.note_url': originalData.note_url,
                             'originalData.noteUrl': originalData.noteUrl,
                             'originalData.url': originalData.url,
                             最终noteUrl: noteUrl
                           })
                           
                           if (noteUrl) {
                             console.log('✅ [查看原文] 找到链接，准备打开:', noteUrl)
                             window.open(noteUrl, '_blank')
                           } else {
                             console.warn('❌ [查看原文] 未找到笔记原文链接')
                             alert(`未找到笔记原文链接。调试信息：\n- noteData键: ${Object.keys(noteData).join(', ')}\n- 请查看控制台获取详细信息`)
                           }
                         } else {
                           console.warn('❌ [查看原文] 未找到笔记数据')
                           alert('未找到笔记数据')
                         }
                       } else {
                         console.warn('❌ [查看原文] 未找到原始任务数据')
                         alert('未找到原始任务数据')
                       }
                     }}
                  >
                    <span className="flex items-center gap-1">
                      查看原文
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </Badge>
                </div>
                <Badge className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full border-0 font-medium">
                  图文笔记
                </Badge>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-2">
                {task.noteTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    已完成 <span className="font-bold text-green-600 dark:text-green-400">{completedCount}</span> 篇
                  </span>
                </div>
                {generatingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      生成中 <span className="font-bold text-yellow-600 dark:text-yellow-400">{generatingCount}</span> 篇
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    共 <span className="font-bold text-purple-600 dark:text-purple-400">{task.results?.length || 0}</span> 篇内容
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Export Buttons - 响应式布局 */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={handleExportExcel}
              size="sm"
              disabled={completedCount === 0}
              className="h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 text-sm sm:text-base"
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              <span className="font-medium">导出Excel ({completedCount})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Results - 优化的网格布局，更大的展示空间 */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="w-full max-w-none">
          {task.results && task.results.length > 0 ? (
            /* 
              竖向排列布局：
              - 所有屏幕尺寸都使用单列布局，便于阅读对比
              - 增加间距，提升视觉体验
            */
            <div className="grid grid-cols-1 gap-8">
              {task.results.map((result, index) => (
                <ContentDisplay 
                  key={result.id} 
                  result={result} 
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  暂无生成内容
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  内容正在生成中，请稍候...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
