"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Copy, CheckCircle } from "lucide-react"
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
  status: "generating" | "completed" | "failed"
  results: GeneratedContent[]
}

interface ResultDisplayProps {
  task: Task
}

export function ResultDisplay({ task }: ResultDisplayProps) {
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
              src="/placeholder.svg?height=60&width=80"
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
          <Tabs defaultValue={task.results[0]?.id} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              {task.results.map((result, index) => (
                <TabsTrigger key={result.id} value={result.id}>
                  生成稿{index + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {task.results.map((result) => (
                <TabsContent key={result.id} value={result.id} className="h-full flex flex-col mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{result.title}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(result.content, result.id)}
                      className="flex items-center gap-2"
                    >
                      {copiedId === result.id ? (
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
                    <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.content}</p>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
