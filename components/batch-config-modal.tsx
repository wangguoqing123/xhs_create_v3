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
import { useBatchRewrite } from "@/lib/hooks/use-batch-rewrite"
import { BatchConfig } from "@/lib/types"

interface BatchConfigModalProps {
  open: boolean
  onClose: () => void
  selectedNotes: string[]
  searchKeywords?: string // 添加搜索关键词参数
  notesData?: any[] // 添加笔记数据参数
}

export function BatchConfigModal({ open, onClose, selectedNotes, searchKeywords, notesData }: BatchConfigModalProps) {
  const router = useRouter()
  
  // 批量改写Hook
  const { 
    isCreating, 
    isProcessing, 
    error, 
    createBatchTask, 
    processBatchTask,
    clearError 
  } = useBatchRewrite()

  // 配置状态
  const [config, setConfig] = useState<BatchConfig>({
    type: 'auto',
    theme: '',
    persona: 'default',
    purpose: 'default'
  })

  // 处理批量生成
  const handleBatchGenerate = async () => {
    // 验证选择的笔记
    if (selectedNotes.length === 0) {
      alert("请先选择要生成的笔记")
      return
    }

    try {
      // 清除之前的错误
      clearError()

      console.log('开始创建批量改写任务:', {
        selectedNotes: selectedNotes.length,
        config,
        searchKeywords
      })

      // 创建批量改写任务
      const taskId = await createBatchTask(selectedNotes, config, searchKeywords, notesData)
      
      if (!taskId) {
        // 错误信息已经在Hook中处理
        return
      }

      // 开始处理任务
      const success = await processBatchTask(taskId)
      
      if (!success) {
        // 错误信息已经在Hook中处理
        return
      }

      // 跳转到结果页面
      router.push(`/results?taskId=${taskId}`)
      
      // 关闭模态框
      onClose()

    } catch (error) {
      console.error('批量生成失败:', error)
      alert(error instanceof Error ? error.message : '批量生成失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-0 rounded-2xl shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">批量生成配置</DialogTitle>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 text-sm">
                  {selectedNotes.length > 0 ? (
                    <>
                      已选择{" "}
                      <Badge variant="secondary" className="mx-1 text-sm px-2 py-0.5">
                        {selectedNotes.length}
                      </Badge>{" "}
                      篇笔记，每篇将生成3个不同风格的版本
                    </>
                  ) : (
                    "请先选择要生成的笔记"
                  )}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="rounded-full w-8 h-8 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Configuration Grid */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 内容类型 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900 dark:text-white">内容类型</Label>
              <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
                <SelectTrigger className="h-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="auto">自动识别</SelectItem>
                  <SelectItem value="article">全部生成图文笔记</SelectItem>
                  <SelectItem value="video">全部生成口播视频稿</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 人设定位 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900 dark:text-white">人设定位</Label>
              <Select value={config.persona} onValueChange={(value) => setConfig({ ...config, persona: value })}>
                <SelectTrigger className="h-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-xl text-sm">
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
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900 dark:text-white">营销目的</Label>
              <Select value={config.purpose} onValueChange={(value) => setConfig({ ...config, purpose: value })}>
                <SelectTrigger className="h-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-xl text-sm">
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

            {/* 空占位，保持布局 */}
            <div></div>
          </div>

          {/* 特定主题 - 单独一行 */}
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-white">特定主题</Label>
            <Input
              type="text"
              placeholder="输入特定主题，如：美妆护肤、职场成长等"
              value={config.theme}
              onChange={(e) => setConfig({ ...config, theme: e.target.value })}
              className="h-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-xl text-sm px-3"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">留空则保持原主题风格</p>
          </div>
        </div>

        {/* 错误信息显示 */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="px-6 py-2 h-auto text-sm rounded-xl border-gray-200 dark:border-slate-600"
          >
            取消
          </Button>
          <Button
            onClick={handleBatchGenerate}
            disabled={selectedNotes.length === 0 || isCreating || isProcessing}
            className="px-8 py-2 h-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                创建任务中...
              </>
            ) : isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                启动处理中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                开始生成
                <Zap className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
