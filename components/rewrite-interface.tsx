"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Link, FileText, Sparkles, Copy, Check, X, Plus, Wand2, User, Target, Info, History } from "lucide-react"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { AccountPositioning } from "@/components/account-positioning"

interface GeneratedContent {
  id: string
  title: string
  content: string
}

export function RewriteInterface() {
  // 获取认证上下文，用于检查登录状态和用户信息
  const { user, profile, refreshProfile } = useMySQLAuth()
  
  const [linkInput, setLinkInput] = useState("")
  const [originalText, setOriginalText] = useState("")
  const [theme, setTheme] = useState("")

  const [purpose, setPurpose] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isParsingLink, setIsParsingLink] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false) // 控制结果区域显示
  const [inputMode, setInputMode] = useState<"link" | "text" | null>(null)
  const [parseError, setParseError] = useState<string | null>(null) // 解析错误状态
  const [selectedPosition, setSelectedPosition] = useState<string>("") // 账号定位选择状态
  const [accountPositions, setAccountPositions] = useState<any[]>([]) // 账号定位列表
  const [sourceUrl, setSourceUrl] = useState<string>("") // 原始链接状态，用于数据库记录

  // 人设选项已移除，现在使用账号定位

  // 笔记目的选项
  const purposeOptions = [
    { value: "share-experience", label: "分享经验" },
    { value: "product-review", label: "产品测评" },
    { value: "tutorial-guide", label: "教程攻略" },
    { value: "daily-life", label: "日常记录" },
    { value: "recommendation", label: "好物推荐" },
    { value: "problem-solving", label: "问题解答" },
    { value: "inspiration-sharing", label: "灵感分享" },
    { value: "trend-analysis", label: "趋势分析" },
    { value: "personal-story", label: "个人故事" },
    { value: "knowledge-sharing", label: "知识科普" },
  ]

  // 获取账号定位列表
  const fetchAccountPositions = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/account-positioning', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAccountPositions(result.data)
        }
      }
    } catch (error) {
      console.error('获取账号定位列表失败:', error)
    }
  }

  // 组件挂载时获取账号定位列表
  useEffect(() => {
    fetchAccountPositions()
  }, [user])

  // 处理链接解析功能
  const handleLinkParse = async () => {
    // 检查链接输入是否为空
    if (!linkInput.trim()) return

    // 清除之前的错误信息
    setParseError(null)

    try {
      // 1. 判断是否登录（使用最小损耗的方法，直接检查user对象）
      if (!user) {
        setParseError('请先登录后再使用链接解析功能')
        return
      }

      // 2. 判断是否已经设置了cookie（检查profile中的user_cookie）
      if (!profile?.user_cookie) {
        setParseError('请先在设置中配置小红书Cookie后再使用此功能')
        return
      }

      // 3. 判断是否是小红书链接（检查域名是否包含xiaohongshu）
      const linkUrl = linkInput.trim()
      if (!linkUrl.includes('xiaohongshu')) {
        setParseError('请输入有效的小红书链接')
        return
      }

      // 开始解析过程，设置加载状态
      setIsParsingLink(true)
      setInputMode("link") // 标记当前为链接输入模式

      console.log('开始解析链接:', linkInput.trim())

      // 3. 调用coze接口获取笔记详情（使用现有的note-detail API）
      const response = await fetch('/api/note-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteUrl: linkInput.trim(), // 传递链接URL
          cookieStr: profile.user_cookie // 传递用户cookie
        })
      })

      // 解析API响应数据
      const result = await response.json()

      // 检查HTTP响应状态
      if (!response.ok) {
        throw new Error(result.error || `HTTP错误: ${response.status}`)
      }

      // 检查API返回的成功状态
      if (!result.success) {
        throw new Error(result.error || '获取笔记详情失败')
      }

      // 获取笔记详情数据
      const noteDetail = result.data

      // 格式化内容并填入输入框（按指定格式）
      let formattedContent = ''
      
      // 添加标题部分
      if (noteDetail.title) {
        formattedContent += `【标题】${noteDetail.title}\n\n`
      }
      
      // 添加正文部分
      if (noteDetail.content) {
        formattedContent += `【正文】${noteDetail.content}\n\n`
      }
      
      // 添加话题部分（从标签中提取并格式化）
      if (noteDetail.tags && noteDetail.tags.length > 0) {
        const topics = noteDetail.tags.map((tag: string) => `#${tag}`).join(' ')
        formattedContent += `【话题】${topics}`
      }

      // 设置格式化后的内容到输入框中（保持可编辑状态）
      setOriginalText(formattedContent)
      
      // 保存原始链接，用于数据库记录
      setSourceUrl(linkInput.trim())
      
      // 解析成功后重置输入模式，让用户可以编辑原文
      setInputMode(null)

      // 记录解析成功的日志
      console.log('链接解析成功:', {
        title: noteDetail.title,
        contentLength: noteDetail.content?.length || 0,
        tagsCount: noteDetail.tags?.length || 0
      })

    } catch (error) {
      // 捕获并处理解析过程中的错误
      console.error('链接解析失败:', error)
      let errorMessage = error instanceof Error ? error.message : '链接解析失败，请稍后重试'
      
      // 检查是否是Cookie失效的错误
      if (errorMessage.includes('请求响应失败') || 
          errorMessage.includes('登录已过期') || 
          errorMessage.includes('cookie') ||
          errorMessage.includes('code:-100') ||
          errorMessage.includes('success:false')) {
        setParseError('小红书Cookie已失效，请重新获取并设置Cookie。获取方法：打开小红书网页版登录 → 按F12打开开发者工具 → 在Network标签页找到任意请求 → 复制请求头中的Cookie值 → 在设置页面更新Cookie配置')
      } else {
        setParseError(`解析失败: ${errorMessage}`)
      }
    } finally {
      // 无论成功或失败都要重置加载状态
      setIsParsingLink(false)
    }
  }

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

  // 处理生成爆文
  const handleGenerate = async () => {
    if (!originalText.trim()) return

    // 检查是否登录
    if (!user) {
      alert('请先登录后再使用生成功能')
      return
    }

    // 检查积分是否足够
    if (profile && profile.credits < 1) {
      alert('积分不足，生成爆文需要1积分')
      return
    }

    setIsGenerating(true)
    setShowResults(true) // 立即显示结果区域
    setGeneratedContents([]) // 清空之前的结果

    try {
      console.log('🚀 开始调用爆文改写API')
      
      // 获取选中的账号定位信息
      let accountPositioningText = ''
      if (selectedPosition) {
        const selectedPositionData = accountPositions.find(pos => pos.id === selectedPosition)
        if (selectedPositionData) {
          // 构建完整的账号定位信息
          const parts = []
          if (selectedPositionData.name) parts.push(`定位名称: ${selectedPositionData.name}`)
          if (selectedPositionData.one_line_description) parts.push(`一句话定位: ${selectedPositionData.one_line_description}`)
          if (selectedPositionData.core_value) parts.push(`核心价值: ${selectedPositionData.core_value}`)
          if (selectedPositionData.target_audience) parts.push(`目标用户: ${selectedPositionData.target_audience}`)
          if (selectedPositionData.key_persona) parts.push(`关键人设: ${selectedPositionData.key_persona}`)
          if (selectedPositionData.core_style) parts.push(`核心风格: ${selectedPositionData.core_style}`)
          
          accountPositioningText = parts.join(', ')
        }
      }

      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          originalText: originalText.trim(),
          theme: theme.trim(),
          persona: 'default', // 使用默认人设，因为我们现在用账号定位
          purpose: purpose,
          keywords: keywords,
          accountPositioning: accountPositioningText,
          sourceUrl: sourceUrl || null // 传递原始链接（如果有的话）
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP错误: ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || '生成失败')
      }

      console.log('✅ 爆文改写API调用成功')

      // 转换API返回的数据格式为组件需要的格式
      const generatedResults: GeneratedContent[] = result.data.versions.map((version: any, index: number) => ({
        id: `version-${index + 1}`,
        title: version.title || `版本${index + 1}`,
        content: version.content || ''
      }))

      setGeneratedContents(generatedResults)
      
      // 显示积分消耗信息
      console.log(`💰 消耗积分: ${result.data.creditsConsumed}`)
      
      // 刷新用户资料以更新积分显示
      console.log('🔄 开始刷新用户资料以更新积分显示')
      await refreshProfile()
      console.log('✅ 用户资料刷新完成')

    } catch (error) {
      console.error('❌ 生成爆文失败:', error)
      alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // 处理复制
  const handleCopy = async (content: string, id: string, title: string) => {
    try {
      const fullContent = `${title}\n\n${content}`
      await navigator.clipboard.writeText(fullContent)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  // 重置表单
  const handleReset = () => {
    setLinkInput("") // 清空链接输入
    setOriginalText("") // 清空原文输入
    setTheme("") // 清空主题
    // 不再需要清空人设，因为使用账号定位
    setPurpose("") // 清空目的
    setKeywords([]) // 清空关键词列表
    setKeywordInput("") // 清空关键词输入
    setGeneratedContents([]) // 清空生成的内容
    setShowResults(false) // 隐藏结果区域
    setInputMode(null) // 重置输入模式
    setParseError(null) // 清除解析错误
    setSelectedPosition("") // 清空账号定位选择
    setSourceUrl("") // 清空原始链接
  }

  const hasResults = showResults // 改为基于showResults状态

  return (
    <div className="container mx-auto px-4 h-[calc(100vh-4.5rem)] flex flex-col">
      {/* 页面标题 */}
      <div className="relative text-center py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-2 shadow-md">
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
          爆文改写
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">基于爆款笔记智能生成高质量仿写内容</p>
        
        {/* 历史记录按钮 - 仅登录用户可见 */}
        {user && (
          <Button
            onClick={() => window.location.href = '/rewrite-history'}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 flex items-center gap-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <History className="h-4 w-4" />
            改写记录
          </Button>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* 输入区域 */}
        <div className={`transition-all duration-700 ease-in-out ${hasResults ? "w-2/5" : "w-full max-w-xl mx-auto"}`}>
          <Card className="h-full border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                内容输入
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 h-[calc(100%-4rem)] overflow-y-auto">
              {/* 链接输入 */}
              <div className="space-y-2">
                <Label htmlFor="link-input" className="flex items-center gap-2 text-sm font-medium">
                  <Link className="h-3 w-3 text-blue-600" />
                  输入链接
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="link-input"
                    placeholder="粘贴爆款笔记链接..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    disabled={inputMode === "text" || isParsingLink}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    onClick={handleLinkParse}
                    disabled={!linkInput.trim() || inputMode === "text" || isParsingLink}
                    size="sm"
                    className="px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isParsingLink ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        解析
                      </>
                    ) : (
                      "解析"
                    )}
                  </Button>
                </div>
              </div>

              {/* 分割线 */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">或</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              {/* 错误提示 */}
              {parseError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                      <p className="font-medium mb-1">解析失败</p>
                      <p>{parseError}</p>
                    </div>
                    <button
                      onClick={() => setParseError(null)}
                      className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 原文输入 */}
              <div className="space-y-2">
                <Label htmlFor="original-text" className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-3 w-3 text-purple-600" />
                  输入原文
                </Label>
                <textarea
                  id="original-text"
                  placeholder="粘贴原文内容或通过链接解析..."
                  value={originalText}
                  onChange={(e) => {
                    setOriginalText(e.target.value)
                    if (e.target.value.trim() && !inputMode) {
                      setInputMode("text")
                    } else if (!e.target.value.trim() && inputMode === "text") {
                      setInputMode(null)
                    }
                  }}
                  disabled={inputMode === "link"}
                  className="w-full h-24 p-3 border border-gray-200 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              {/* 主题和账号定位 - 一行显示 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 主题输入 */}
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-sm font-medium">
                    改写主题
                  </Label>
                  <Input
                    id="theme"
                    placeholder="护肤技巧、美食分享..."
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* 账号定位选择 */}
                <AccountPositioning 
                  selectedPosition={selectedPosition}
                  onSelectionChange={setSelectedPosition}
                  placeholder="选择账号定位"
                />
              </div>

              {/* 笔记目的和关键词 - 一行显示 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 笔记目的 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-3 w-3 text-green-600" />
                    笔记目的
                  </Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="选择目的" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SEO关键词 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO关键词</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入关键词后按回车"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={handleKeywordKeyPress}
                      className="flex-1 h-9 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddKeyword}
                      disabled={!keywordInput.trim()}
                      className="h-9 w-9 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 关键词标签 */}
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* 提示信息 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <p className="font-medium mb-1">智能提示</p>
                    <p>
                      改写主题、账号定位、笔记目的、SEO关键词均为可选项，可根据需要选择性填写。未填写的项目将基于原文内容进行智能仿写。
                    </p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>消耗积分</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">1积分</span>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={!originalText.trim() || isGenerating}
                    className="w-full h-10 text-sm font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        生成爆文
                      </>
                    )}
                  </Button>
                </div>
                <Button variant="outline" onClick={handleReset} size="sm" className="px-4 h-10 mt-6">
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 生成结果区域 */}
        <div
          className={`transition-all duration-700 ease-in-out ${
            hasResults ? "w-3/5 opacity-100" : "w-0 opacity-0 overflow-hidden"
          }`}
        >
          {hasResults && (
            <div className="h-full grid grid-cols-2 gap-4">
              {isGenerating ? (
                // 加载状态显示
                <>
                  {[0, 1].map((index) => (
                    <Card
                      key={`loading-${index}`}
                      className="border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex flex-col"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              index === 0
                                ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                : "bg-gradient-to-r from-purple-500 to-purple-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className={index === 0 ? "text-blue-600" : "text-purple-600"}>
                            {index === 0 ? "情感共鸣版" : "干货分享版"}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1">
                        {/* 加载动画 - 鱼骨纹效果 */}
                        <div className="flex-1 space-y-3 animate-pulse">
                          {/* 标题骨架 */}
                          <div className="space-y-2">
                            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded animate-shimmer bg-[length:400%_100%]"></div>
                            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-3/4 animate-shimmer bg-[length:400%_100%]"></div>
                          </div>
                          
                          {/* 内容骨架 */}
                          <div className="space-y-2">
                            {[...Array(8)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded animate-shimmer bg-[length:400%_100%] ${
                                  i === 3 || i === 7 ? 'w-1/2' : i === 5 ? 'w-2/3' : 'w-full'
                                }`}
                                style={{ animationDelay: `${i * 0.2}s` }}
                              ></div>
                            ))}
                          </div>
                          
                          {/* 按钮骨架 */}
                          <div className="mt-auto">
                            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded animate-shimmer bg-[length:400%_100%]"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                // 实际内容显示
                generatedContents.map((content, index) => (
                <Card
                  key={content.id}
                  className="border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex flex-col"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          index === 0
                            ? "bg-gradient-to-r from-blue-500 to-blue-600"
                            : "bg-gradient-to-r from-purple-500 to-purple-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className={index === 0 ? "text-blue-600" : "text-purple-600"}>
                        {index === 0 ? "情感共鸣版" : "干货分享版"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    {/* 标题区域 */}
                    <div className="mb-3">
                      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-700/50 dark:to-slate-600/50 p-3 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                          {content.title}
                        </p>
                      </div>
                    </div>

                    {/* 正文区域 */}
                    <div className="flex-1 bg-gradient-to-br from-gray-50 to-white dark:from-slate-700/50 dark:to-slate-600/50 p-3 rounded-lg mb-3 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                        {content.content}
                      </pre>
                    </div>

                    <Button
                      onClick={() => handleCopy(content.content, content.id, content.title)}
                      variant="outline"
                      size="sm"
                      className={`w-full h-8 text-xs transition-all ${
                        copiedId === content.id
                          ? "bg-green-50 border-green-500 text-green-700"
                          : `hover:bg-${index === 0 ? "blue" : "purple"}-50 hover:border-${index === 0 ? "blue" : "purple"}-500`
                      }`}
                    >
                      {copiedId === content.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          复制
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
                              ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 