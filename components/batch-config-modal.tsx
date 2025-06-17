"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Settings, Zap, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface BatchConfigModalProps {
  open: boolean
  onClose: () => void
  selectedNotes: string[]
}

export function BatchConfigModal({ open, onClose, selectedNotes }: BatchConfigModalProps) {
  const router = useRouter()
  const [config, setConfig] = useState({
    count: "3",
    type: "article",
    theme: "",
    persona: "default",
    purpose: "default",
  })

  const handleBatchGenerate = () => {
    if (selectedNotes.length === 0) {
      alert("请先选择要生成的笔记")
      return
    }

    const params = new URLSearchParams({
      notes: selectedNotes.join(","),
      ...config,
    })
    router.push(`/results?${params}`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border-0 rounded-3xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="pb-6 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">批量生成配置</DialogTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-base">
                  {selectedNotes.length > 0 ? (
                    <>
                      已选择{" "}
                      <Badge variant="secondary" className="mx-1 text-base px-2 py-1">
                        {selectedNotes.length}
                      </Badge>{" "}
                      篇笔记，准备开始创作
                    </>
                  ) : (
                    "请先选择要生成的笔记"
                  )}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-10 h-10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Configuration Grid */}
        <div className="py-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 生成数量 */}
            <div className="space-y-3">
              <Label className="text-lg font-bold text-gray-900 dark:text-white">生成数量</Label>
              <Select value={config.count} onValueChange={(value) => setConfig({ ...config, count: value })}>
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-2xl text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1篇内容</SelectItem>
                  <SelectItem value="3">3篇内容</SelectItem>
                  <SelectItem value="5">5篇内容</SelectItem>
                  <SelectItem value="10">10篇内容</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 内容类型 */}
            <div className="space-y-3">
              <Label className="text-lg font-bold text-gray-900 dark:text-white">内容类型</Label>
              <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-2xl text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">图文笔记</SelectItem>
                  <SelectItem value="video">口播视频稿</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 特定主题 */}
            <div className="space-y-3">
              <Label className="text-lg font-bold text-gray-900 dark:text-white">特定主题</Label>
              <Input
                type="text"
                placeholder="输入特定主题，如：美妆护肤、职场成长等"
                value={config.theme}
                onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                className="h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-2xl text-base px-4"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">留空则保持原主题风格</p>
            </div>

            {/* 人设定位 */}
            <div className="space-y-3">
              <Label className="text-lg font-bold text-gray-900 dark:text-white">人设定位</Label>
              <Select value={config.persona} onValueChange={(value) => setConfig({ ...config, persona: value })}>
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-2xl text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认风格</SelectItem>
                  <SelectItem value="expert">专业导师</SelectItem>
                  <SelectItem value="friend">贴心闺蜜</SelectItem>
                  <SelectItem value="humor">幽默达人</SelectItem>
                  <SelectItem value="professional">商务专业</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 营销目的 */}
            <div className="space-y-3">
              <Label className="text-lg font-bold text-gray-900 dark:text-white">营销目的</Label>
              <Select value={config.purpose} onValueChange={(value) => setConfig({ ...config, purpose: value })}>
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-2xl text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">无特定目的</SelectItem>
                  <SelectItem value="brand">品牌种草</SelectItem>
                  <SelectItem value="review">产品测评</SelectItem>
                  <SelectItem value="traffic">引流获客</SelectItem>
                  <SelectItem value="education">知识科普</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="px-8 py-3 h-auto text-lg rounded-2xl">
            取消
          </Button>
          <Button
            onClick={handleBatchGenerate}
            disabled={selectedNotes.length === 0}
            className="px-10 py-3 h-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            开始生成
            <Zap className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
