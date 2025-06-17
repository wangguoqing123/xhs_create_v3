"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface BatchOperationsProps {
  selectedNotes: string[]
}

export function BatchOperations({ selectedNotes }: BatchOperationsProps) {
  const router = useRouter()
  const [config, setConfig] = useState({
    count: "3",
    type: "article",
    theme: "original",
    persona: "default",
    purpose: "default",
  })

  const handleBatchGenerate = () => {
    // 跳转到结果页面，传递配置参数
    const params = new URLSearchParams({
      notes: selectedNotes.join(","),
      ...config,
    })
    router.push(`/results?${params}`)
  }

  return (
    <Card className="mb-6 bg-purple-50 border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">批量生成配置 (已选择 {selectedNotes.length} 篇笔记)</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* 生成数量 */}
          <div className="space-y-2">
            <Label htmlFor="count">生成数量</Label>
            <Select value={config.count} onValueChange={(value) => setConfig({ ...config, count: value })}>
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="type">笔记类型</Label>
            <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">图文笔记</SelectItem>
                <SelectItem value="video">口播视频稿</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 主题改写 */}
          <div className="space-y-2">
            <Label htmlFor="theme">主题改写</Label>
            <Select value={config.theme} onValueChange={(value) => setConfig({ ...config, theme: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">按原主题</SelectItem>
                <SelectItem value="beauty">改写为美妆护肤</SelectItem>
                <SelectItem value="career">改写为职场成长</SelectItem>
                <SelectItem value="fitness">改写为健身减肥</SelectItem>
                <SelectItem value="food">改写为美食探店</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 人设定位 */}
          <div className="space-y-2">
            <Label htmlFor="persona">人设定位</Label>
            <Select value={config.persona} onValueChange={(value) => setConfig({ ...config, persona: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">默认</SelectItem>
                <SelectItem value="expert">专业导师</SelectItem>
                <SelectItem value="friend">贴心闺蜜</SelectItem>
                <SelectItem value="humor">幽默达人</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 营销目的 */}
          <div className="space-y-2">
            <Label htmlFor="purpose">营销目的</Label>
            <Select value={config.purpose} onValueChange={(value) => setConfig({ ...config, purpose: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">默认</SelectItem>
                <SelectItem value="brand">品牌种草</SelectItem>
                <SelectItem value="review">产品测评</SelectItem>
                <SelectItem value="traffic">引流获客</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleBatchGenerate} size="lg" className="px-8">
            批量生成
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
