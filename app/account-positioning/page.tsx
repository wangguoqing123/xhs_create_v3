"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Plus, Edit3, Loader2, AlertCircle, Clock, Menu, X, ChevronLeft, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { useCreditsContext } from "@/components/credits-context"
import type { AccountPositioning } from "@/lib/types"

export default function AccountPositioningPage() {
  // 获取认证上下文
  const { user, profile } = useMySQLAuth()
  const { balance, refreshBalance } = useCreditsContext()
  
  // 状态管理
  const [positions, setPositions] = useState<AccountPositioning[]>([])
  const [selectedPosition, setSelectedPosition] = useState<AccountPositioning | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // AI生成状态
  const [aiKeywords, setAiKeywords] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false) // 是否正在创建新定位
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [editingPosition, setEditingPosition] = useState<AccountPositioning | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // 删除状态
  const [deleteConfirmPosition, setDeleteConfirmPosition] = useState<AccountPositioning | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 获取账号定位列表
  const fetchPositions = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔍 [账号定位] 开始获取账号定位列表')
      
      const response = await fetch('/api/account-positioning', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '获取账号定位列表失败')
      }

      console.log('✅ [账号定位] 账号定位列表获取成功:', result.data.length, '条记录')
      
      setPositions(result.data || [])
      
      // 如果有记录且没有选中的定位，默认选中第一个
      if (result.data && result.data.length > 0 && !selectedPosition) {
        setSelectedPosition(result.data[0])
      }
      
    } catch (error) {
      console.error('❌ [账号定位] 获取账号定位列表失败:', error)
      setError(error instanceof Error ? error.message : '获取账号定位列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [user]) // 移除selectedPosition依赖，避免重复加载

  // 组件挂载时获取数据
  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  // 格式化时间显示
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return timeString
    }
  }

  // 开始创建新定位
  const handleStartCreate = () => {
    // 创建一个临时的新定位对象
    const newPosition: AccountPositioning = {
      id: 'temp-new',
      user_id: user?.id || '',
      name: '未命名定位',
      one_line_description: '',
      core_value: '',
      target_audience: '',
      key_persona: '',
      core_style: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // 设置为创建模式
    setIsCreatingNew(true)
    setSelectedPosition(newPosition)
    setAiKeywords("")
    
    // 取消编辑状态
    setIsEditing(false)
    setEditingPosition(null)
    
    // 移动端关闭菜单
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(false)
    }
  }

  // 处理AI生成
  const handleAIGenerate = async () => {
    // 验证关键词输入
    if (!aiKeywords.trim()) {
      alert("请输入领域和特色描述")
      return
    }

    // 检查用户登录状态
    if (!user) {
      alert("请先登录")
      return
    }

    // 检查积分是否足够
    const requiredCredits = 1 // 生成账号定位需要1积分
    if (!balance || balance.current < requiredCredits) {
      alert(`积分不足！当前积分：${balance?.current || 0}，需要积分：${requiredCredits}`)
      return
    }

    setIsGenerating(true)

    try {
      console.log('🚀 开始调用AI生成账号定位')
      
      // 调用后端API生成账号定位
      const response = await fetch('/api/account-positioning/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          keywords: aiKeywords.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP错误: ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'AI生成失败')
      }

      // 解析AI生成的结果
      const aiResult = result.data
      
      // 保存到数据库
      const saveResponse = await fetch('/api/account-positioning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: aiResult.name || `${aiKeywords}专家`,
          one_line_description: aiResult.slogan || `${aiKeywords}专家：专业分享${aiKeywords}相关知识和经验，助你快速成长`,
          core_value: aiResult.coreValue || `通过专业的${aiKeywords}知识分享和实战经验传授，帮助用户在${aiKeywords}领域快速提升和成长。`,
          target_audience: aiResult.targetUser || `对${aiKeywords}感兴趣的初学者和进阶者`,
          key_persona: aiResult.keyPersona || `${aiKeywords}领域的专业导师——既有深厚专业功底又有良好的教学能力`,
          core_style: aiResult.coreStyle || "专业权威、通俗易懂、实用性强，注重理论与实践相结合"
        })
      })

      const saveResult = await saveResponse.json()

      if (!saveResponse.ok || !saveResult.success) {
        throw new Error(saveResult.error || '保存账号定位失败')
      }

      // 刷新积分余额
      await refreshBalance()
      
      // 刷新列表
      await fetchPositions()
      
      // 选中新创建的定位
      setSelectedPosition(saveResult.data)
      
      // 清空状态
      setAiKeywords("")
      setIsCreatingNew(false)
      
      console.log('✅ AI生成并保存账号定位成功')

    } catch (error) {
      console.error('❌ AI生成账号定位失败:', error)
      alert(`AI生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // 取消创建
  const handleCancelCreate = () => {
    setIsCreatingNew(false)
    setAiKeywords("")
    setSelectedPosition(positions.length > 0 ? positions[0] : null)
  }

  // 处理编辑保存
  const handleSave = async () => {
    if (!editingPosition || !editingPosition.id) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/account-positioning/${editingPosition.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editingPosition.name,
          one_line_description: editingPosition.one_line_description,
          core_value: editingPosition.core_value,
          target_audience: editingPosition.target_audience,
          key_persona: editingPosition.key_persona,
          core_style: editingPosition.core_style
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '更新账号定位失败')
      }

      // 更新本地状态
      setPositions(prev => prev.map(p => 
        p.id === editingPosition.id ? result.data : p
      ))
      setSelectedPosition(result.data)
      setIsEditing(false)
      setEditingPosition(null)

      console.log('✅ 账号定位更新成功')

    } catch (error) {
      console.error('❌ 更新账号定位失败:', error)
      alert(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 开始编辑
  const startEdit = () => {
    if (selectedPosition) {
      setEditingPosition({ ...selectedPosition })
      setIsEditing(true)
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingPosition(null)
    setIsEditing(false)
  }

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmPosition) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/account-positioning/${deleteConfirmPosition.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '删除账号定位失败')
      }

      // 更新本地状态
      setPositions(prev => prev.filter(p => p.id !== deleteConfirmPosition.id))
      
      // 如果删除的是当前选中的定位，选择第一个或清空
      if (selectedPosition?.id === deleteConfirmPosition.id) {
        const remainingPositions = positions.filter(p => p.id !== deleteConfirmPosition.id)
        setSelectedPosition(remainingPositions.length > 0 ? remainingPositions[0] : null)
      }
      
      // 关闭确认框
      setDeleteConfirmPosition(null)

      console.log('✅ 账号定位删除成功')

    } catch (error) {
      console.error('❌ 删除账号定位失败:', error)
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // 取消删除
  const handleDeleteCancel = () => {
    setDeleteConfirmPosition(null)
  }

  // 如果用户未登录，显示登录提示
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center pt-20">
        <Card className="w-96 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">需要登录</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              请先登录后管理账号定位
            </p>
            <Button onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900/80 pt-8">
      <div className="px-4 py-8 max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                账号定位管理
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">创建和管理您的小红书账号定位</p>
            </div>
            
            {/* 移动端菜单按钮 */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-9 w-9 p-0"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* 响应式布局 - 移动端单栏，桌面端双栏 */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6">
          {/* 左侧：账号定位列表 */}
          <div className={cn(
            "lg:col-span-1",
            selectedPosition && !isMobileMenuOpen ? "hidden lg:block" : "block"
          )}>
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-3 lg:pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base lg:text-lg font-semibold flex items-center">
                    账号定位
                    {positions.length > 0 && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {positions.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={handleStartCreate}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    新增
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[50vh] lg:max-h-[calc(100vh-220px)] overflow-y-auto">
                  <div className="space-y-3 p-6 pt-0">
                    {/* 加载状态 */}
                    {isLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">加载中...</span>
                      </div>
                    )}

                    {/* 错误状态 */}
                    {error && (
                      <div className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={fetchPositions}
                          className="mt-2"
                        >
                          重试
                        </Button>
                      </div>
                    )}

                    {/* 空状态 */}
                    {!isLoading && !error && positions.length === 0 && (
                      <div className="text-center py-8">
                        <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">暂无账号定位</p>
                        <Button 
                          size="sm" 
                          onClick={handleStartCreate}
                          className="mt-2"
                        >
                          创建第一个定位
                        </Button>
                      </div>
                    )}

                    {/* 临时创建的新定位 */}
                    {isCreatingNew && selectedPosition?.id === 'temp-new' && (
                                             <Card
                         className="border border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/20 cursor-pointer transition-all duration-200"
                       >
                        <CardContent className="p-3 lg:p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-sm lg:text-sm truncate flex-1 text-purple-600 dark:text-purple-400">
                              未命名定位
                            </h3>
                            <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              新建中
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <p>请在右侧输入领域描述生成定位</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 定位列表 */}
                    {positions.map((position) => (
                      <Card
                        key={position.id}
                                                 className={cn(
                           "cursor-pointer transition-all duration-200 hover:shadow-md border",
                           selectedPosition?.id === position.id
                             ? "border-purple-400 dark:border-purple-500 bg-purple-50/50 dark:bg-purple-900/20"
                             : "border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50",
                         )}
                        onClick={() => {
                          setSelectedPosition(position)
                          // 移动端选择记录后自动关闭菜单
                          if (window.innerWidth < 1024) {
                            setIsMobileMenuOpen(false)
                          }
                          // 取消编辑状态
                          setIsEditing(false)
                          setEditingPosition(null)
                        }}
                      >
                        <CardContent className="p-3 lg:p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-sm lg:text-sm truncate flex-1">
                              {position.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirmPosition(position)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{formatTime(position.created_at)}</span>
                            </div>
                            {position.one_line_description && (
                              <p className="truncate text-xs">{position.one_line_description}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：账号定位详情 - 内容部分在下一次编辑中补充 */}
          <div className={cn(
            "lg:col-span-3",
            selectedPosition && !isMobileMenuOpen ? "block" : "hidden lg:block"
          )}>
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
              {selectedPosition ? (
                <>
                  <CardHeader className="pb-3 lg:pb-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                      {/* 移动端返回按钮 */}
                      <div className="flex items-center gap-3 lg:hidden">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsMobileMenuOpen(true)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle className="text-base font-semibold truncate">
                          {isCreatingNew ? 'AI生成账号定位' : isEditing ? '编辑账号定位' : selectedPosition.name}
                        </CardTitle>
                      </div>
                      
                      {/* 桌面端标题 */}
                      <CardTitle className="hidden lg:block text-lg font-semibold truncate">
                        {isCreatingNew ? 'AI生成账号定位' : isEditing ? '编辑账号定位' : selectedPosition.name}
                      </CardTitle>
                      
                      <div className="flex gap-2">
                        {isCreatingNew ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelCreate}
                            disabled={isGenerating}
                          >
                            取消创建
                          </Button>
                        ) : isEditing ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEdit}
                              disabled={isSaving}
                            >
                              取消
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={isSaving}
                            >
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                              保存
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={startEdit}
                            variant="outline"
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 lg:px-6">
                    <div className="max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-260px)] overflow-y-auto">
                      <div className="space-y-6">
                        {/* AI生成区域 */}
                        {isCreatingNew && (
                          <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="h-3 w-3 text-white" />
                              </div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">AI智能生成</h3>
                            </div>
                            
                            <div className="space-y-3">
                              <Label htmlFor="ai-keywords" className="text-sm font-medium text-gray-900 dark:text-white">
                                领域和特色描述 <span className="text-red-500">*</span>
                              </Label>
                                                             <Textarea
                                 id="ai-keywords"
                                 placeholder="请详细描述您的专业领域和特色，如：绍兴18年经验装修工长，专做绍兴老房改造"
                                 value={aiKeywords}
                                 onChange={(e) => setAiKeywords(e.target.value)}
                                 rows={3}
                                 className="w-full !border-0 !border !border-purple-200 dark:!border-purple-700 focus:!border-purple-500 dark:focus:!border-purple-400"
                                 disabled={isGenerating}
                               />
                              <p className="text-xs text-gray-500">
                                AI将根据您的描述生成专业的账号定位，包含命名、slogan、核心价值等内容
        </p>
      </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-xs text-purple-700 dark:text-purple-400">
                                消耗积分：<strong>1积分</strong> | 当前积分：{balance?.current || 0}
                              </div>
                              <Button
                                onClick={handleAIGenerate}
                                disabled={isGenerating || !aiKeywords.trim()}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    AI生成中...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    AI生成
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* 生成状态或账号定位详情表单 */}
                        {isGenerating ? (
                          <div className="space-y-6">
                            {/* 生成中的骨架屏 */}
                            <div className="text-center py-8">
                              <div className="flex flex-col items-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                                  <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI正在生成账号定位</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">请稍候，AI正在为您创建专业的账号定位...</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* 生成中的内容骨架 */}
                            {[1, 2, 3, 4, 5, 6].map((index) => (
                              <div key={index} className="space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                                <div className="space-y-2">
                                  <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                                  {index > 1 && index < 6 && (
                                    <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid gap-6">
                            {/* 账号定位命名 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                              账号定位命名 <span className="text-red-500">*</span>
                            </Label>
                            {isEditing ? (
                                                             <Input
                                 value={editingPosition?.name || ''}
                                 onChange={(e) => setEditingPosition(prev => 
                                   prev ? { ...prev, name: e.target.value } : null
                                 )}
                                 placeholder="如：AI健体塑形师"
                                 className="w-full !border-0 !border !border-purple-200 dark:!border-purple-700 focus:!border-purple-500 dark:focus:!border-purple-400"
                               />
                            ) : (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <p className="text-gray-900 dark:text-gray-100">{selectedPosition.name}</p>
                              </div>
                            )}
                          </div>

                          {/* 一句话定位 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                              一句话定位
                            </Label>
                            {isEditing ? (
                                                             <Textarea
                                 value={editingPosition?.one_line_description || ''}
                                 onChange={(e) => setEditingPosition(prev => 
                                   prev ? { ...prev, one_line_description: e.target.value } : null
                                 )}
                                 placeholder="如：AI探索学习者：手把手用AI做效率提升，赋能用户AI应用落地投资人工智能"
                                 rows={2}
                                 className="w-full !border-0 !border !border-purple-200 dark:!border-purple-700 focus:!border-purple-500 dark:focus:!border-purple-400"
                               />
                            ) : (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <p className="text-gray-900 dark:text-gray-100">{selectedPosition.one_line_description || '暂无'}</p>
                              </div>
                            )}
                          </div>

                          {/* 核心价值 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                              核心价值
                            </Label>
                            {isEditing ? (
                                                             <Textarea
                                 value={editingPosition?.core_value || ''}
                                 onChange={(e) => setEditingPosition(prev => 
                                   prev ? { ...prev, core_value: e.target.value } : null
                                 )}
                                 placeholder="如：将复杂的AI技术简化为可实际应用的生活工具，帮助用户用AI解决实际问题，提高效率与生活品质。"
                                 rows={3}
                                 className="w-full !border-0 !border !border-purple-200 dark:!border-purple-700 focus:!border-purple-500 dark:focus:!border-purple-400"
                               />
                            ) : (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <p className="text-gray-900 dark:text-gray-100">{selectedPosition.core_value || '暂无'}</p>
                              </div>
                            )}
                          </div>

                          {/* 目标用户 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                              目标用户
                            </Label>
                            {isEditing ? (
                                                             <Textarea
                                 value={editingPosition?.target_audience || ''}
                                 onChange={(e) => setEditingPosition(prev => 
                                   prev ? { ...prev, target_audience: e.target.value } : null
                                 )}
                                 placeholder="如：18-35岁有效率提升需求的都市年轻人，特别是职场新人、学生党、自由职业者等数字原住民。"
                                 rows={2}
                                 className="w-full !border-0 !border !border-purple-200 dark:!border-purple-700 focus:!border-purple-500 dark:focus:!border-purple-400"
                               />
                            ) : (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <p className="text-gray-900 dark:text-gray-100">{selectedPosition.target_audience || '暂无'}</p>
                              </div>
                            )}
                          </div>

                          {/* 关键人设 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                              关键人设
                            </Label>
                            {isEditing ? (
                                                             <Textarea
                                 value={editingPosition?.key_persona || ''}
                                 onChange={(e) => setEditingPosition(prev => 
                                   prev ? { ...prev, key_persona: e.target.value } : null
                                 )}
                                 placeholder="如：AI生活实验家——亲和友善的AI探索者与分享者，既是同龄朋友也是聪慧导师"
                                 rows={2}
                                 className="w-full !border-0 !border !border-purple-200 dark:!border-purple-700 focus:!border-purple-500 dark:focus:!border-purple-400"
                               />
                            ) : (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <p className="text-gray-900 dark:text-gray-100">{selectedPosition.key_persona || '暂无'}</p>
                              </div>
                            )}
                          </div>

                          {/* 核心风格 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                              核心风格
                            </Label>
                            {isEditing ? (
                                                             <Textarea
                                 value={editingPosition?.core_style || ''}
                                 onChange={(e) => setEditingPosition(prev => 
                                   prev ? { ...prev, core_style: e.target.value } : null
                                 )}
                                 placeholder="如：干货实用、老实诚信"
                                 rows={2}
                                 className="w-full !border-0 !border !border-purple-200 dark:!border-purple-700 focus:!border-purple-500 dark:focus:!border-purple-400"
                               />
                            ) : (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <p className="text-gray-900 dark:text-gray-100">{selectedPosition.core_style || '暂无'}</p>
                              </div>
                            )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-96 lg:h-[calc(100vh-200px)]">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">请选择一个账号定位查看详情</p>
                    <Button onClick={handleStartCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      创建新定位
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* 删除确认弹框 */}
      {deleteConfirmPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    确认删除
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    此操作无法撤销
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  您确定要删除账号定位 <span className="font-semibold text-gray-900 dark:text-white">&ldquo;{deleteConfirmPosition.name}&rdquo;</span> 吗？
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  删除后将无法恢复此定位的所有信息。
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      删除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      确认删除
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
} 