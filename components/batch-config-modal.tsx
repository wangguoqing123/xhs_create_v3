"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Settings, Zap, X, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useBatchRewrite } from "@/lib/hooks/use-batch-rewrite"
import { BatchConfig } from "@/lib/types"
import { useCreditsContext } from "@/components/credits-context"
import { CreditsWarning, CreditsInfo } from "@/components/credits-warning"
import { useEffect } from "react"
import { AccountPositioning } from "@/components/account-positioning"

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

  // 积分Hook（使用全局Context）
  const { balance, getLatestBalance } = useCreditsContext()

  // 配置状态
  const [config, setConfig] = useState<BatchConfig>({
    type: 'auto',
    theme: '',
    persona: 'default',
    purpose: '' // 默认为空，让用户主动选择
  })
  
  // 账号定位选择状态
  const [selectedPosition, setSelectedPosition] = useState<string>("")
  
  // SEO关键词状态
  const [keywordInput, setKeywordInput] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])

  // 每次模态框打开时获取最新积分
  useEffect(() => {
    if (open) {
      console.log('🔄 [批量配置] 模态框打开，获取最新积分')
      getLatestBalance()
    }
  }, [open, getLatestBalance])

  // 处理关键词添加
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  // 处理关键词删除
  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  // 处理回车添加关键词
  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  // 处理批量生成
  const handleBatchGenerate = async () => {
    // 验证选择的笔记
    if (selectedNotes.length === 0) {
      alert("请先选择要生成的笔记")
      return
    }

    // 检查所有选中笔记是否都有原文链接
    const notesWithoutLinks: string[] = []
    
    selectedNotes.forEach(noteId => {
      const noteData = notesData?.find(note => note.id === noteId || note.note_id === noteId)
      if (noteData) {
        const originalData = noteData.originalData || {}
        const hasNoteUrl = noteData.note_url || noteData.noteUrl || noteData.url || 
                          originalData.note_url || originalData.noteUrl || originalData.url ||
                          originalData.backup_note_url
        
        const isValidLink = hasNoteUrl && 
                           typeof hasNoteUrl === 'string' && 
                           hasNoteUrl.trim() !== '' && 
                           hasNoteUrl !== 'null' && 
                           hasNoteUrl !== 'undefined' &&
                           (hasNoteUrl.includes('xiaohongshu') || hasNoteUrl.includes('xhslink'))
        
        if (!isValidLink) {
          notesWithoutLinks.push(noteData.title || noteData.note_display_title || `笔记${noteId}`)
        }
      }
    })

    // 如果有笔记缺少链接，直接终止并提示
    if (notesWithoutLinks.length > 0) {
      const notesList = notesWithoutLinks.slice(0, 3).join('、') + (notesWithoutLinks.length > 3 ? '等' : '')
      alert(`❌ 以下笔记缺少原文链接，无法进行批量生成：\n\n${notesList}\n\n批量生成功能需要所有笔记都包含有效的小红书原文链接。\n请重新选择有原文链接的笔记。`)
      return
    }

    try {
      // 清除之前的错误
      clearError()

      // 获取选中的账号定位信息
      let accountPositioningText = ''
      if (selectedPosition) {
        // 这里需要获取账号定位的详细信息
        // 注意：这里可能需要调用API获取完整的账号定位信息
        // 为了简化，我们先传递ID，后续可以扩展
        accountPositioningText = selectedPosition
      }

      // 构建增强的配置对象
      const enhancedConfig = {
        ...config,
        accountPositioning: accountPositioningText,
        keywords: keywords // 传递实际的关键词数组
      }

      console.log('开始创建批量改写任务:', {
        selectedNotes: selectedNotes.length,
        config: enhancedConfig,
        searchKeywords
      })

      // 创建批量改写任务
      const taskId = await createBatchTask(selectedNotes, enhancedConfig, searchKeywords, notesData)
      
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
        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">批量生成配置</DialogTitle>
                {/* 使用div替代DialogDescription，避免p标签嵌套div的HTML错误 */}
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 text-sm">
                  {selectedNotes.length > 0 ? (
                    <>
                      已选择{" "}
                      <Badge variant="secondary" className="mx-1 text-sm px-2 py-0.5">
                        {selectedNotes.length}
                      </Badge>{" "}
                      篇笔记，每篇将生成2个不同风格的版本
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
          <div className="space-y-4">
            {/* 第一行：特定主题和账号定位 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 特定主题 */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900 dark:text-white">改写主题</Label>
                <Input
                  type="text"
                  placeholder="护肤技巧、美食分享..."
                  value={config.theme}
                  onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                  className="h-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg text-sm px-3"
                />
              </div>

              {/* 账号定位 */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900 dark:text-white">账号定位</Label>
                <div className="h-10 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center">
                  <AccountPositioning 
                    selectedPosition={selectedPosition}
                    onSelectionChange={setSelectedPosition}
                    placeholder="选择账号定位"
                    className="flex-1 space-y-0"
                    hideLabel={true}
                  />
                </div>
              </div>
            </div>

            {/* 第二行：营销目的 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 营销目的 */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900 dark:text-white">笔记目的</Label>
                <Select value={config.purpose} onValueChange={(value) => setConfig({ ...config, purpose: value })}>
                  <SelectTrigger className="h-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg text-sm">
                    <SelectValue placeholder="选择目的" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="share-experience">分享经验</SelectItem>
                    <SelectItem value="product-review">产品测评</SelectItem>
                    <SelectItem value="tutorial-guide">教程攻略</SelectItem>
                    <SelectItem value="daily-life">日常记录</SelectItem>
                    <SelectItem value="recommendation">好物推荐</SelectItem>
                    <SelectItem value="problem-solving">问题解答</SelectItem>
                    <SelectItem value="inspiration-sharing">灵感分享</SelectItem>
                    <SelectItem value="trend-analysis">趋势分析</SelectItem>
                    <SelectItem value="personal-story">个人故事</SelectItem>
                    <SelectItem value="knowledge-sharing">知识科普</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 第三行：SEO关键词 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900 dark:text-white">SEO关键词</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="输入关键词，如：护肤、美妆..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={handleKeywordKeyPress}
                    className="flex-1 h-10 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddKeyword}
                    disabled={!keywordInput.trim()}
                    className="h-10 w-10 p-0 border-gray-300 dark:border-slate-600"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* 关键词标签 */}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 特定主题说明 */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">留空则保持原主题风格</p>

          {/* 积分检查 */}
          <div className="mt-6 space-y-3">
            <CreditsInfo selectedCount={selectedNotes.length} />
            {balance && selectedNotes.length > 0 && (
              <CreditsWarning 
                currentCredits={balance.current} 
                requiredCredits={selectedNotes.length * 1} 
              />
            )}
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
            disabled={
              selectedNotes.length === 0 || 
              isCreating || 
              isProcessing ||
              (balance ? balance.current < selectedNotes.length * 1 : false)
            }
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
