"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, CheckCircle, Download, Share2, FileText } from "lucide-react"
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

interface ResultViewerProps {
  task: Task
}

export function ResultViewer({ task }: ResultViewerProps) {
  const [copiedId, setCopiedId] = useState<string>("")

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(""), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const handleExportAll = () => {
    // 导出整个任务的所有内容
    const allContent = task.results
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
                已生成 <span className="font-semibold text-purple-600 dark:text-purple-400">{task.results.length}</span>{" "}
                篇内容变体
              </p>
            </div>
          </div>

          {/* Export All Button */}
          <Button
            onClick={handleExportAll}
            size="lg"
            className="h-10 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            导出全部内容
          </Button>
        </div>
      </div>

      {/* Generated Results - 横向并排显示 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-6">
            {task.results.map((result, index) => (
              <Card
                key={result.id}
                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300"
              >
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
                        <Badge className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0 text-xs">
                          已完成
                        </Badge>
                      </div>
                    </div>

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
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  {/* 标题 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">标题</h3>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                        {result.title}
                      </p>
                    </div>
                  </div>

                  {/* 正文 */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">正文内容</h3>
                    <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-700 p-3 rounded-xl border border-gray-100 dark:border-slate-600 shadow-inner max-h-64 overflow-y-auto">
                      <div className="prose max-w-none">
                        <pre className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                          {result.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
