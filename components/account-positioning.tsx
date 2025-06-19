"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Sparkles, X, ChevronDown, Edit } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

// 账号定位数据类型
export interface AccountPosition {
  id: string
  name: string
  slogan: string
  coreValue: string
  targetUser?: string
  keyPersona: string
  coreStyle: string
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

// 默认的账号定位数据
const DEFAULT_POSITIONS: AccountPosition[] = [
  {
    id: "ai-life-mentor",
    name: "AI实战派学姐",
    slogan: "AI实战派学姐：手把手教你用AI解决日常问题，赢在求职&搞钱起跑线",
    coreValue: "将复杂的AI技术简化为普通人可实操的生活工具，帮助用户用AI解决实际问题，提升效率与生活品质。",
    targetUser: "18-35岁有效率提升需求的都市年轻人，特别是职场新人、学生党、自由职业者等数字原住民。",
    keyPersona: "AI生活实验家——亲和友善的AI工具探索者与分享者，既是同辈朋友也是实用技能传授者。",
    coreStyle: "轻松活泼、干货实用、通俗易懂，强调'小白也能学会'的亲民感。",
    createdAt: new Date()
  },
  {
    id: "beauty-expert",
    name: "美妆护肤达人",
    slogan: "美妆护肤达人：专业测评+真实体验，让你避坑不踩雷",
    coreValue: "通过专业的产品测评和真实的使用体验，帮助用户选择适合自己的美妆护肤产品，避免消费陷阱。",
    targetUser: "18-40岁爱美女性，特别是美妆新手和护肤困扰人群。",
    keyPersona: "专业又贴心的美妆顾问——既有专业知识又有闺蜜般的亲和力。",
    coreStyle: "专业可信、真实接地气、温暖贴心，注重实用性和性价比。",
    createdAt: new Date()
  },
  {
    id: "life-blogger",
    name: "生活美学博主",
    slogan: "生活美学博主：发现平凡生活中的小确幸与美好瞬间",
    coreValue: "通过分享日常生活中的美好细节，传递积极的生活态度，帮助用户发现并创造属于自己的生活美学。",
    targetUser: "20-35岁追求生活品质的都市人群，特别是注重精神层面满足的年轻人。",
    keyPersona: "生活美学家——温暖治愈的生活观察者和美好传递者。",
    coreStyle: "温暖治愈、文艺清新、细腻感性，注重情感共鸣和美感体验。",
    createdAt: new Date()
  }
]

export function AccountPositioning({ 
  selectedPosition, 
  onSelectionChange, 
  className = "",
  placeholder = "选择账号定位",
  hideLabel = false
}: AccountPositioningProps) {
  // 组件状态
  const [positions, setPositions] = useState<AccountPosition[]>(DEFAULT_POSITIONS)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>("")

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

  // 获取已选择的账号定位对象
  const getSelectedPosition = () => {
    return positions.find((pos: AccountPosition) => pos.id === selectedPosition)
  }

  // 处理账号定位选择
  const handlePositionSelect = (positionId: string) => {
    onSelectionChange(positionId)
    setIsDropdownOpen(false) // 单选后关闭下拉框
  }

  // 处理添加新账号定位
  const handleAddPosition = () => {
    // 验证必填字段
    if (!newPosition.name.trim() || !newPosition.slogan.trim() || 
        !newPosition.coreValue.trim() || !newPosition.keyPersona.trim() || 
        !newPosition.coreStyle.trim()) {
      alert("请填写所有必填字段")
      return
    }

    // 创建新的账号定位
    const position: AccountPosition = {
      id: `custom-${Date.now()}`,
      ...newPosition,
      createdAt: new Date()
    }

    // 添加到定位列表
    const updatedPositions = [...positions, position]
    setPositions(updatedPositions)

    // 自动选中新添加的定位
    onSelectionChange(position.id)

    // 重置表单并关闭模态框
    setNewPosition({
      name: "",
      slogan: "",
      coreValue: "",
      targetUser: "",
      keyPersona: "",
      coreStyle: ""
    })
    setShowAddModal(false)
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
                    setShowAddModal(true)
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
                    新增账号定位
                  </DialogTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    创建专属的账号定位，打造独特的内容风格
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
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 h-auto text-sm rounded-xl"
                >
                  取消
                </Button>
                <Button
                  onClick={handleAddPosition}
                  className="px-8 py-2 h-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl"
                >
                  保存定位
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