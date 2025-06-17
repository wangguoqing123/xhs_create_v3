"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Settings, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

interface BatchPanelProps {
  selectedNotes: string[]
}

export function BatchPanel({ selectedNotes }: BatchPanelProps) {
  const router = useRouter()
  const [config, setConfig] = useState({
    count: "3",
    type: "article",
    theme: "original",
    persona: "default",
    purpose: "default",
  })

  const handleBatchGenerate = () => {
    const params = new URLSearchParams({
      notes: selectedNotes.join(","),
      ...config,
    })
    router.push(`/results?${params}`)
  }

  return (
    <div className="sticky top-32 z-30 bg-white/95 backdrop-blur-xl border-y border-gray-200">
      <div className="container mx-auto px-6 py-6">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200/50 shadow-lg">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">批量生成配置</h3>
                  <p className="text-sm text-gray-600">
                    已选择{" "}
                    <Badge variant="secondary" className="mx-1">
                      {selectedNotes.length}
                    </Badge>{" "}
                    篇笔记
                  </p>
                </div>
              </div>
            </div>

            {/* Configuration Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              {/* 生成数量 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">生成数量</Label>
                <Select value={config.count} onValueChange={(value) => setConfig({ ...config, count: value })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1篇</SelectItem>
                    <SelectItem value="3">3篇</SelectItem>
                    <SelectItem value="5">5篇</SelectItem>
                    <SelectItem value="10">10篇</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 笔记类型 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">内容类型</Label>
                <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">图文笔记</SelectItem>
                    <SelectItem value="video">口播视频稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 主题改写 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">主题改写</Label>
                <Select value={config.theme} onValueChange={(value) => setConfig({ ...config, theme: value })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">保持原主题</SelectItem>
                    <SelectItem value="beauty">美妆护肤</SelectItem>
                    <SelectItem value="career">职场成长</SelectItem>
                    <SelectItem value="fitness">健身减肥</SelectItem>
                    <SelectItem value="food">美食探店</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 人设定位 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">人设定位</Label>
                <Select value={config.persona} onValueChange={(value) => setConfig({ ...config, persona: value })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">默认风格</SelectItem>
                    <SelectItem value="expert">专业导师</SelectItem>
                    <SelectItem value="friend">贴心闺蜜</SelectItem>
                    <SelectItem value="humor">幽默达人</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 营销目的 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">营销目的</Label>
                <Select value={config.purpose} onValueChange={(value) => setConfig({ ...config, purpose: value })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">无特定目的</SelectItem>
                    <SelectItem value="brand">品牌种草</SelectItem>
                    <SelectItem value="review">产品测评</SelectItem>
                    <SelectItem value="traffic">引流获客</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleBatchGenerate}
                size="lg"
                className="h-12 px-10 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                开始批量生成
                <Zap className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
