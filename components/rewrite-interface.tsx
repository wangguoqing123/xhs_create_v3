"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Link, FileText, Sparkles, Copy, Check, X, Plus, Wand2, User, Target, Info, History, Edit3, Save } from "lucide-react"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { AccountPositioning } from "@/components/account-positioning"
import Image from "next/image"
import { getProxiedImageUrl } from "@/lib/image-utils"

interface GeneratedContent {
  id: string
  title: string
  content: string
  editedTitle?: string
  editedContent?: string
}

interface ParsedNoteData {
  title: string
  content: string
  coverImage?: string
  tags?: string[]
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
  const [parsedNoteData, setParsedNoteData] = useState<ParsedNoteData | null>(null) // 解析后的笔记数据

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

      // 保存解析后的笔记数据，包括封面图片
      setParsedNoteData({
        title: noteDetail.title || '',
        content: noteDetail.content || '',
        coverImage: noteDetail.images?.[0] || noteDetail.cover_image || '',
        tags: noteDetail.tags || []
      })

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

      // 解析完成后智能切换显示区域：如果当前显示的是生成结果，则切换到配置选项
      if (showResults) {
        console.log('解析成功后检测到当前显示生成结果，切换到配置选项')
        setShowResults(false) // 切换到配置选项界面
        setGeneratedContents([]) // 清空之前的生成结果
      }

      // 记录解析成功的日志
      console.log('链接解析成功:', {
        title: noteDetail.title,
        contentLength: noteDetail.content?.length || 0,
        tagsCount: noteDetail.tags?.length || 0,
        hasCoverImage: !!noteDetail.images?.[0]
      })

    } catch (error) {
      // 捕获并处理解析过程中的错误
      console.error('链接解析失败:', error)
      const errorMessage = error instanceof Error ? error.message : '链接解析失败，请稍后重试'
      
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

      // 转换API返回的数据格式为组件需要的格式，并清理Markdown格式
      const generatedResults: GeneratedContent[] = result.data.versions.map((version: any, index: number) => ({
        id: `version-${index + 1}`,
        title: cleanMarkdownFormat(version.title || `版本${index + 1}`),
        content: cleanMarkdownFormat(version.content || ''),
        editedTitle: cleanMarkdownFormat(version.title || `版本${index + 1}`),
        editedContent: cleanMarkdownFormat(version.content || '')
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

  // 清理Markdown格式符号
  const cleanMarkdownFormat = (text: string) => {
    if (!text) return text
    
    return text
      // 移除粗体标记 **text** -> text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // 移除斜体标记 *text* -> text
      .replace(/\*(.*?)\*/g, '$1')
      // 移除代码标记 `text` -> text
      .replace(/`(.*?)`/g, '$1')
      // 移除标题标记 # text -> text
      .replace(/^#{1,6}\s+/gm, '')
      // 移除链接标记 [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 移除图片标记 ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // 移除列表标记 - text -> text
      .replace(/^[-*+]\s+/gm, '')
      // 移除数字列表标记 1. text -> text
      .replace(/^\d+\.\s+/gm, '')
      // 移除引用标记 > text -> text
      .replace(/^>\s+/gm, '')
      // 移除水平分割线
      .replace(/^[-*_]{3,}$/gm, '')
      // 移除表格标记
      .replace(/\|/g, ' ')
      // 清理多余的空行
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // 清理行首行尾空白
      .trim()
  }

  // 计算文本区域高度
  const calculateTextAreaHeight = (text: string) => {
    if (!text) return 350 // 默认最小高度
    
    const lineCount = text.split('\n').length
    const charPerLine = 50 // 假设每行50个字符
    const estimatedLines = Math.max(lineCount, Math.ceil(text.length / charPerLine))
    
    // 每行大约20px高度，最小350px，最大800px
    const height = Math.max(350, Math.min(800, estimatedLines * 30 + 100))
    return height
  }

  // 获取最大内容高度
  const getMaxContentHeight = () => {
    if (!generatedContents.length) return 600
    
    const maxHeight = generatedContents.reduce((max, content) => {
      const contentHeight = calculateTextAreaHeight(content.editedContent || content.content)
      const cardHeight = contentHeight + 120 // 120px用于标题、按钮等
      console.log(`内容ID: ${content.id}, 内容高度: ${contentHeight}, 卡片高度: ${cardHeight}`)
      return Math.max(max, cardHeight)
    }, 600)
    
    const finalHeight = Math.max(600, maxHeight + 100) // 额外100px用于间距
    console.log(`计算出的最大高度: ${finalHeight}`)
    return finalHeight
  }

  // 处理编辑内容变化
  const handleEditChange = (id: string, field: 'title' | 'content', value: string) => {
    setGeneratedContents(prev => prev.map(content => {
      if (content.id === id) {
        return {
          ...content,
          [field === 'title' ? 'editedTitle' : 'editedContent']: cleanMarkdownFormat(value)
        }
      }
      return content
    }))
  }

  // 重置表单
  const handleReset = () => {
    setLinkInput("") // 清空链接输入
    setOriginalText("") // 清空原文输入
    setTheme("") // 清空主题
    setPurpose("") // 清空目的
    setKeywords([]) // 清空关键词列表
    setKeywordInput("") // 清空关键词输入
    setGeneratedContents([]) // 清空生成的内容
    setShowResults(false) // 隐藏结果区域
    setInputMode(null) // 重置输入模式
    setParseError(null) // 清除解析错误
    setSelectedPosition("") // 清空账号定位选择
    setSourceUrl("") // 清空原始链接
    setParsedNoteData(null) // 清空解析的笔记数据
  }

  const hasResults = showResults // 改为基于showResults状态

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 页面标题 - 苹果风格 */}
        <div className="relative text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-xl">
            <Wand2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-3">
            爆文改写
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
            基于爆款笔记智能生成高质量仿写内容，让您的创作更上一层楼
          </p>
          
          {/* 历史记录按钮 - 仅登录用户可见 */}
          {user && (
            <Button
              onClick={() => window.location.href = '/rewrite-history'}
              variant="outline"
              size="sm"
              className="absolute top-0 right-0 flex items-center gap-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-200 dark:border-gray-700"
            >
              <History className="h-4 w-4" />
              改写记录
            </Button>
          )}
        </div>

        {/* 主要内容区域 - 响应式布局 */}
        <div 
          className="flex flex-col lg:flex-row gap-6 lg:gap-8" 
          style={{ 
            minHeight: hasResults ? getMaxContentHeight() : 600,
            height: hasResults ? getMaxContentHeight() : 600
          }}
        >
          {/* 左侧：链接输入和原文展示 - 移动端占全宽，桌面端占40% */}
          <div className="w-full lg:w-2/5 space-y-4 lg:space-y-6">
            {/* 链接输入卡片 */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Link className="h-4 w-4 text-white" />
                  </div>
                  链接解析
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="粘贴爆款笔记链接..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    disabled={inputMode === "text" || isParsingLink}
                    className="flex-1 h-10 text-sm border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button
                    onClick={handleLinkParse}
                    disabled={!linkInput.trim() || inputMode === "text" || isParsingLink}
                    size="sm"
                    className="h-10 px-3 sm:px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-sm"
                  >
                    {isParsingLink ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        解析
                      </>
                    ) : (
                      "解析"
                    )}
                  </Button>
                </div>

                {/* 错误提示 */}
                {parseError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
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
              </CardContent>
            </Card>

            {/* 原文输入卡片 - 占据剩余空间 */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  原文内容
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <textarea
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
                  className="w-full h-[300px] lg:h-[450px] p-3 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm leading-relaxed"
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：生成配置或生成结果 - 移动端占全宽，桌面端占60% */}
          <div className="w-full lg:w-3/5 h-full">
            {!hasResults ? (
              // 生成配置区域
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base font-semibold">
                    <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    改写配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 h-[calc(100%-3.5rem)] overflow-y-auto">
                  {/* 主题和账号定位 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        改写主题
                      </Label>
                      <Input
                        placeholder="护肤技巧、美食分享..."
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="h-10 text-sm border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <AccountPositioning 
                      selectedPosition={selectedPosition}
                      onSelectionChange={setSelectedPosition}
                      placeholder="选择账号定位"
                    />
                  </div>

                  {/* 笔记目的和关键词 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        笔记目的
                      </Label>
                      <Select value={purpose} onValueChange={setPurpose}>
                        <SelectTrigger className="h-10 text-sm border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500">
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

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        SEO关键词
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="输入关键词后按回车"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyPress={handleKeywordKeyPress}
                          className="flex-1 h-10 text-sm border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddKeyword}
                          disabled={!keywordInput.trim()}
                          className="h-10 w-10 p-0 border-gray-200 dark:border-gray-700"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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

                  {/* 提示信息 */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
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
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>消耗积分</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">1积分</span>
                    </div>
                    <Button
                      onClick={handleGenerate}
                      disabled={!originalText.trim() || isGenerating}
                      className="w-full h-12 lg:h-12 text-base font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          生成爆文
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleReset} 
                      size="sm" 
                      className="w-full h-10 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      重置
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // 生成结果区域 - 重新设计布局
              <div className="h-full flex flex-col" style={{ 
                minHeight: getMaxContentHeight(),
                height: getMaxContentHeight()
              }}>
                {/* 顶部操作栏 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">生成结果</h3>
                  <Button
                    onClick={handleGenerate}
                    disabled={!originalText.trim() || isGenerating}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        重新生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        重新生成
                      </>
                    )}
                  </Button>
                </div>

                {/* 结果内容区域 - 占据剩余空间 */}
                <div className="flex-1 space-y-4 overflow-y-auto h-full">
                  {isGenerating ? (
                    // 加载状态显示
                    <>
                      {[0, 1].map((index) => (
                        <Card
                          key={`loading-${index}`}
                          className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex flex-col rounded-2xl overflow-hidden"
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
                                {index === 0 ? "经典策略版" : "人设深耕版"}
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col flex-1 p-4 pt-0">
                            {/* 加载动画 - 苹果风格 */}
                            <div className="flex-1 space-y-3 animate-pulse">
                              {/* 标题骨架 */}
                              <div className="space-y-2">
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded animate-shimmer bg-[length:400%_100%]"></div>
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-3/4 animate-shimmer bg-[length:400%_100%]"></div>
                              </div>
                              
                              {/* 内容骨架 */}
                              <div className="space-y-2">
                                {[...Array(12)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded animate-shimmer bg-[length:400%_100%] ${
                                      i === 3 || i === 7 ? 'w-1/2' : i === 5 ? 'w-2/3' : 'w-full'
                                    }`}
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    // 实际内容显示 - 重新设计布局
                    generatedContents.map((content, index) => (
                      <Card
                        key={content.id}
                        className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex flex-col rounded-2xl overflow-hidden h-full"
                        style={{
                          minHeight: calculateTextAreaHeight(content.editedContent || content.content) + 120
                        }}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
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
                                {index === 0 ? "经典策略版" : "人设深耕版"}
                              </span>
                            </div>
                            
                            {/* 操作按钮 */}
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => handleCopy(content.editedContent || content.content, content.id, content.editedTitle || content.title)}
                                variant="outline"
                                size="sm"
                                className={`h-6 px-2 text-xs transition-all ${
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
                              <Button
                                onClick={handleGenerate}
                                disabled={!originalText.trim() || isGenerating}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                {isGenerating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 space-y-3 p-4 pt-0 h-full">
                          {/* 标题区域 - 紧凑设计 */}
                          <div className="flex-shrink-0">
                            <textarea
                              value={content.editedTitle || content.title}
                              onChange={(e) => handleEditChange(content.id, 'title', e.target.value)}
                              className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed bg-gradient-to-br from-gray-50 to-white dark:from-slate-700/50 dark:to-slate-600/50"
                              rows={1}
                              placeholder="输入标题..."
                            />
                          </div>

                          {/* 正文区域 - 动态高度 */}
                          <div className="flex-1 h-full">
                            <textarea
                              value={content.editedContent || content.content}
                              onChange={(e) => handleEditChange(content.id, 'content', e.target.value)}
                              className="w-full h-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed bg-gradient-to-br from-gray-50 to-white dark:from-slate-700/50 dark:to-slate-600/50"
                              style={{
                                height: calculateTextAreaHeight(content.editedContent || content.content)
                              }}
                              placeholder="输入正文内容..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 