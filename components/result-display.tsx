"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, CheckCircle } from "lucide-react"
import Image from "next/image"
import { getProxiedImageUrl, createFastFallbackImageHandler } from "@/lib/image-utils"

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

interface ResultDisplayProps {
  task: Task
}

export function ResultDisplay({ task }: ResultDisplayProps) {
  const [copiedId, setCopiedId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>(task.results[0]?.id || "")

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(""), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const activeResult = task.results.find(result => result.id === activeTab) || task.results[0]

  return (
    <div className="h-full flex flex-col">
      {/* 源笔记信息 */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">源笔记</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4">
            <Image
              src="/placeholder.svg" // 本地图片不需要代理
              alt="源笔记"
              width={80}
              height={60}
              className="rounded object-cover"
            />
            <div>
              <h3 className="font-medium line-clamp-1">{task.noteTitle}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  图文笔记
                </Badge>
                <span className="text-xs text-gray-500">美妆护肤</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 生成结果 */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">生成结果</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 h-full">
          <div className="h-full flex flex-col">
            {/* Tab导航 */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
              {task.results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => setActiveTab(result.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === result.id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  版本{index + 1}
                </button>
              ))}
            </div>

            {/* 内容显示 */}
            {activeResult && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{activeResult.title}</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(activeResult.content, activeResult.id)}
                    className="flex items-center gap-2"
                  >
                    {copiedId === activeResult.id ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        一键复制
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="prose max-w-none bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {activeResult.content}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
