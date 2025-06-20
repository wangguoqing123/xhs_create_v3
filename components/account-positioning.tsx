"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Sparkles, X, ChevronDown, Edit } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { AccountPositioning as AccountPositioningType } from "@/lib/types"

// 账号定位数据类型（用于UI展示，映射数据库字段）
export interface AccountPosition {
  id: string
  name: string
  slogan: string // 对应数据库的 one_line_description
  coreValue: string // 对应数据库的 core_value
  targetUser?: string // 对应数据库的 target_audience
  keyPersona: string // 对应数据库的 key_persona
  coreStyle: string // 对应数据库的 core_style
  createdAt: Date
}

// 组件Props类型
interface AccountPositioningProps {
  selectedPosition: string
  onSelectionChange: (positionId: string) => void
  className?: string
  placeholder?: string
  hideLabel?: boolean // 是否隐藏标签
}

// 不再使用默认的模拟数据，只显示数据库中的真实数据

export function AccountPositioning({ 
  selectedPosition, 
  onSelectionChange, 
  className = "",
  placeholder = "选择账号定位",
  hideLabel = false
}: AccountPositioningProps) {
  // 获取认证状态
  const { user } = useMySQLAuth()
  
  // 组件状态 - 只显示数据库中的真实数据
  const [positions, setPositions] = useState<AccountPosition[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false) // 加载状态
  const [isSaving, setIsSaving] = useState(false) // 保存状态
  const [editingId, setEditingId] = useState<string | null>(null) // 正在编辑的账号定位ID

  // 空白定位项，用于新增时显示
  const blankPosition: AccountPosition = {
    id: "blank-position",
    name: "未命名定位",
    slogan: "",
    coreValue: "",
    targetUser: "",
    keyPersona: "",
    coreStyle: "",
    createdAt: new Date()
  }

  // 新增账号定位表单状态
  const [newPosition, setNewPosition] = useState({
    name: "",
    slogan: "",
    coreValue: "",
    targetUser: "",
    keyPersona: "",
    coreStyle: ""
  })

  // AI生成相关状态
  const [aiKeywords, setAiKeywords] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // 数据转换函数：将数据库格式转换为UI格式
  const convertDbToUi = (dbItem: AccountPositioningType): AccountPosition => {
    return {
      id: dbItem.id,
      name: dbItem.name,
      slogan: dbItem.one_line_description || "",
      coreValue: dbItem.core_value || "",
      targetUser: dbItem.target_audience || "",
      keyPersona: dbItem.key_persona || "",
      coreStyle: dbItem.core_style || "",
      createdAt: new Date(dbItem.created_at)
    }
  }

  // 数据转换函数：将UI格式转换为数据库格式
  const convertUiToDb = (uiItem: Partial<AccountPosition>) => {
    return {
      name: uiItem.name || "",
      one_line_description: uiItem.slogan || null,
      core_value: uiItem.coreValue || null,
      target_audience: uiItem.targetUser || null,
      key_persona: uiItem.keyPersona || null,
      core_style: uiItem.coreStyle || null
    }
  }

  // 从API获取账号定位列表
  const fetchPositions = async () => {
    if (!user) return // 用户未登录时不获取数据
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/account-positioning', {
        method: 'GET',
        credentials: 'include', // 包含Cookie
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // 转换数据格式，只显示数据库中的真实数据
          const dbPositions = result.data.map(convertDbToUi)
          setPositions(dbPositions)
        }
      } else {
        console.error('获取账号定位列表失败:', response.statusText)
      }
    } catch (error) {
      console.error('获取账号定位列表异常:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchPositions()
  }, [user]) // 依赖用户状态

  // 获取已选择的账号定位对象
  const getSelectedPosition = () => {
    return positions.find((pos: AccountPosition) => pos.id === selectedPosition)
  }

  // 处理账号定位选择
  const handlePositionSelect = (positionId: string) => {
    onSelectionChange(positionId)
    setIsDropdownOpen(false) // 单选后关闭下拉框
  }

  // 处理编辑账号定位
  const handleEditPosition = (position: AccountPosition) => {
    setEditingId(position.id) // 设置编辑状态
    setSelectedHistoryId(position.id) // 选中该历史定位
    setNewPosition({
      name: position.name,
      slogan: position.slogan,
      coreValue: position.coreValue,
      targetUser: position.targetUser || "",
      keyPersona: position.keyPersona,
      coreStyle: position.coreStyle
    })
    setShowAddModal(true) // 打开编辑模态框
  }

  // 处理保存账号定位（新建或更新）
  const handleSavePosition = async () => {
    // 验证必填字段
    if (!newPosition.name.trim() || !newPosition.slogan.trim() || 
        !newPosition.coreValue.trim() || !newPosition.keyPersona.trim() || 
        !newPosition.coreStyle.trim()) {
      alert("请填写所有必填字段")
      return
    }

    if (!user) {
      alert("请先登录")
      return
    }

    setIsSaving(true)
    try {
      // 转换为数据库格式
      const dbData = convertUiToDb(newPosition)
      
      if (editingId) {
        // 编辑模式 - 调用更新API
        const response = await fetch(`/api/account-positioning/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 包含Cookie
          body: JSON.stringify(dbData)
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // 转换返回的数据格式
            const updatedPositionFromDb = convertDbToUi(result.data)
            
            // 更新定位列表中的对应项
            const updatedPositions = positions.map(pos => 
              pos.id === editingId ? updatedPositionFromDb : pos
            )
            setPositions(updatedPositions)

            // 重置状态并关闭模态框
            resetModalState()
            
            console.log('✅ 账号定位更新成功:', updatedPositionFromDb.name)
          } else {
            alert(result.error || '更新账号定位失败')
          }
        } else {
          const result = await response.json()
          alert(result.error || '更新账号定位失败')
        }
      } else {
        // 新建模式 - 调用创建API
        const response = await fetch('/api/account-positioning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 包含Cookie
          body: JSON.stringify(dbData)
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // 转换返回的数据格式
            const newPositionFromDb = convertDbToUi(result.data)
            
            // 添加到定位列表
            const updatedPositions = [...positions, newPositionFromDb]
            setPositions(updatedPositions)

            // 自动选中新添加的定位
            onSelectionChange(newPositionFromDb.id)

            // 重置状态并关闭模态框
            resetModalState()
            
            console.log('✅ 账号定位创建成功:', newPositionFromDb.name)
          } else {
            alert(result.error || '创建账号定位失败')
          }
        } else {
          const result = await response.json()
          alert(result.error || '创建账号定位失败')
        }
      }
    } catch (error) {
      console.error('保存账号定位异常:', error)
      alert('网络错误，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 重置模态框状态
  const resetModalState = () => {
    setNewPosition({
      name: "",
      slogan: "",
      coreValue: "",
      targetUser: "",
      keyPersona: "",
      coreStyle: ""
    })
    setShowAddModal(false)
    setEditingId(null) // 重置编辑状态
    setSelectedHistoryId("")
  }

  // 处理历史定位选择
  const handleHistorySelect = (positionId: string) => {
    const position = positions.find((p: AccountPosition) => p.id === positionId)
    if (position) {
      setNewPosition({
        name: position.name,
        slogan: position.slogan,
        coreValue: position.coreValue,
        targetUser: position.targetUser || "",
        keyPersona: position.keyPersona,
        coreStyle: position.coreStyle
      })
      setSelectedHistoryId(positionId)
    }
  }

  // 处理AI生成（模拟功能）
  const handleAIGenerate = async () => {
    if (!aiKeywords.trim()) {
      alert("请输入关键词")
      return
    }

    setIsGenerating(true)

    // 模拟AI生成过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟生成结果
    const generatedPosition = {
      name: `${aiKeywords}专家`,
      slogan: `${aiKeywords}专家：专业分享${aiKeywords}相关知识和经验，助你快速成长`,
      coreValue: `通过专业的${aiKeywords}知识分享和实战经验传授，帮助用户在${aiKeywords}领域快速提升和成长。`,
      targetUser: `对${aiKeywords}感兴趣的初学者和进阶者`,
      keyPersona: `${aiKeywords}领域的专业导师——既有深厚专业功底又有良好的教学能力`,
      coreStyle: "专业权威、通俗易懂、实用性强，注重理论与实践相结合"
    }

    // 填充到表单
    setNewPosition(generatedPosition)
    setIsGenerating(false)
    setShowAIModal(false)
    
    // 清空关键词
    setAiKeywords("")
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 标签 */}
      {!hideLabel && (
        <Label className="flex items-center gap-2 text-sm font-medium">
          <User className="h-3 w-3 text-indigo-600" />
          账号定位
        </Label>
      )}

      {/* 下拉选择框 */}
      <div className="relative">
        <div
          className="w-full h-9 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer flex items-center justify-between text-sm"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className={selectedPosition !== null && selectedPosition !== undefined ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
            {selectedPosition === ""
              ? "不设置定位"
              : selectedPosition 
                ? getSelectedPosition()?.name || placeholder
                : placeholder
            }
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} />
        </div>

        {/* 下拉菜单 */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {/* 不设置定位选项 */}
            <div
              className={`flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-600 ${
                selectedPosition === "" ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
              }`}
              onClick={() => handlePositionSelect("")}
            >
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-500 dark:text-gray-400">
                  不设置定位
                </div>
              </div>
            </div>
            
            {/* 现有定位选项 */}
            {positions.map((position) => (
              <div
                key={position.id}
                className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-600 last:border-b-0 ${
                  selectedPosition === position.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
                onClick={() => handlePositionSelect(position.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {position.name}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditPosition(position) // 调用编辑函数
                  }}
                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Edit className="h-3 w-3 text-blue-600" />
                </Button>
              </div>
            ))}
            
            {/* 添加新定位按钮 */}
            <div className="p-2 border-t border-gray-100 dark:border-slate-600">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(null) // 设置为新建模式
                  setSelectedHistoryId("blank-position") // 默认选中空白定位
                  setNewPosition({
                    name: "",
                    slogan: "",
                    coreValue: "",
                    targetUser: "",
                    keyPersona: "",
                    coreStyle: ""
                  })
                  setShowAddModal(true)
                }}
                className="w-full h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                添加新定位
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 添加账号定位模态框 */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-0 rounded-2xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingId ? '编辑账号定位' : '新增账号定位'}
                  </DialogTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {editingId ? '修改账号定位信息，完善内容风格' : '创建专属的账号定位，打造独特的内容风格'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIModal(true)}
                  className="text-xs px-3 py-1 h-7"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI生成
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full w-8 h-8 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex h-[600px]">
            {/* 左侧：历史定位列表 */}
            <div className="w-1/3 border-r border-gray-100 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                历史定位
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {/* 空白定位项 */}
                <div
                  key={blankPosition.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedHistoryId === blankPosition.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                  onClick={() => {
                    setSelectedHistoryId(blankPosition.id)
                    setNewPosition({
                      name: "",
                      slogan: "",
                      coreValue: "",
                      targetUser: "",
                      keyPersona: "",
                      coreStyle: ""
                    })
                  }}
                >
                  <div className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1 italic">
                    {blankPosition.name}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    创建新的账号定位
                  </div>
                </div>
                
                {/* 历史定位列表 */}
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedHistoryId === position.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                    onClick={() => handleHistorySelect(position.id)}
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                      {position.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {position.slogan}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧：表单区域 */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* 账号定位命名 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    账号定位命名 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="如：AI自媒体账号定位"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                {/* 一句话定位 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    一句话定位 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="如：AI实战派学姐：手把手教你用AI解决日常问题，赢在求职&搞钱起跑线"
                    value={newPosition.slogan}
                    onChange={(e) => setNewPosition({ ...newPosition, slogan: e.target.value })}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>

                {/* 核心价值 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    核心价值 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="如：将复杂的AI技术简化为普通人可实操的生活工具，帮助用户用AI解决实际问题，提升效率与生活品质。"
                    value={newPosition.coreValue}
                    onChange={(e) => setNewPosition({ ...newPosition, coreValue: e.target.value })}
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>

                {/* 目标用户 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    目标用户 <span className="text-gray-400">(可选)</span>
                  </Label>
                  <Textarea
                    placeholder="如：18-35岁有效率提升需求的都市年轻人，特别是职场新人、学生党、自由职业者等数字原住民。"
                    value={newPosition.targetUser}
                    onChange={(e) => setNewPosition({ ...newPosition, targetUser: e.target.value })}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>

                {/* 关键人设 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    关键人设 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="如：AI生活实验家——亲和友善的AI工具探索者与分享者，既是同辈朋友也是实用技能传授者。"
                    value={newPosition.keyPersona}
                    onChange={(e) => setNewPosition({ ...newPosition, keyPersona: e.target.value })}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>

                {/* 核心风格 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    核心风格 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="如：轻松活泼、干货实用、通俗易懂，强调'小白也能学会'的亲民感。"
                    value={newPosition.coreStyle}
                    onChange={(e) => setNewPosition({ ...newPosition, coreStyle: e.target.value })}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  onClick={resetModalState}
                  className="px-6 py-2 h-auto text-sm rounded-xl"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSavePosition}
                  disabled={isSaving}
                  className="px-8 py-2 h-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingId ? '更新中...' : '保存中...'}
                    </>
                  ) : (
                    editingId ? '更新定位' : '保存定位'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI生成模态框 */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-0 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI一键生成
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              输入关键词，让AI帮你一键生成账号定位
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                关键词
              </Label>
              <Input
                placeholder="如：美食、健身、科技..."
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAIModal(false)}
                disabled={isGenerating}
                className="px-4 py-2 h-auto text-sm"
              >
                取消
              </Button>
              <Button
                onClick={handleAIGenerate}
                disabled={!aiKeywords.trim() || isGenerating}
                className="px-6 py-2 h-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    生成定位
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 点击外部关闭下拉框 */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
} 