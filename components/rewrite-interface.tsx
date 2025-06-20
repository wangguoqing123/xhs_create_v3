"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Link, FileText, Sparkles, Copy, Check, X, Plus, Wand2, User, Target, Info } from "lucide-react"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { AccountPositioning } from "@/components/account-positioning"

interface GeneratedContent {
  id: string
  title: string
  content: string
}

export function RewriteInterface() {
  // 获取认证上下文，用于检查登录状态和用户信息
  const { user, profile } = useMySQLAuth()
  
  const [linkInput, setLinkInput] = useState("")
  const [originalText, setOriginalText] = useState("")
  const [theme, setTheme] = useState("")
  const [persona, setPersona] = useState("")
  const [purpose, setPurpose] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isParsingLink, setIsParsingLink] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<"link" | "text" | null>(null)
  const [parseError, setParseError] = useState<string | null>(null) // 解析错误状态
  const [selectedPosition, setSelectedPosition] = useState<string>("") // 账号定位选择状态

  // 人设选项
  const personaOptions = [
    { value: "college-student", label: "大学生" },
    { value: "office-worker", label: "上班族" },
    { value: "stay-at-home-mom", label: "全职妈妈" },
    { value: "beauty-blogger", label: "美妆博主" },
    { value: "fitness-enthusiast", label: "健身达人" },
    { value: "food-lover", label: "美食爱好者" },
    { value: "travel-blogger", label: "旅行博主" },
    { value: "fashion-influencer", label: "时尚达人" },
    { value: "tech-geek", label: "数码达人" },
    { value: "lifestyle-blogger", label: "生活博主" },
  ]

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

    setIsGenerating(true)

    // 模拟生成过程
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // 模拟生成结果
    const mockResults: GeneratedContent[] = [
      {
        id: "1",
        title: "💕 姐妹们！我要分享一个让我皮肤变好的神仙方法！",
        content: `真的不是夸张，用了这个方法后，连男朋友都说我皮肤变嫩了 😍

方法超简单：
✨ 洗完脸不要完全擦干
💧 趁着脸上还有水珠，立刻拍爽肤水
🌟 然后马上涂精华，不要等！

为什么这样做？
因为湿润的皮肤更容易吸收护肤品，就像海绵一样！

我坚持了两周，皮肤真的变得水润透亮 ✨
摸起来像剥了壳的鸡蛋一样嫩滑！

${keywords.length > 0 ? `\n${keywords.map((k) => `#${k}`).join(" ")}` : ""}`,
      },
      {
        id: "2",
        title: "🔥 护肤干货分享！这个方法让我告别干燥肌！",
        content: `【核心技巧】湿敷护肤法
📍 适用人群：所有肌肤类型
⏰ 最佳时间：洁面后30秒内

【具体步骤】
1️⃣ 温和洁面，用毛巾轻拍至半干状态
2️⃣ 立即使用爽肤水，充分拍打至吸收
3️⃣ 趁皮肤湿润，涂抹精华液按摩吸收

【科学原理】
💡 湿润环境提高护肤品渗透率
💡 减少水分流失，增强保湿效果
💡 促进有效成分深层吸收

【效果反馈】
✅ 7天：皮肤明显水润
✅ 14天：细纹淡化，光泽度提升
✅ 30天：整体肌肤状态改善

${keywords.length > 0 ? `\n${keywords.map((k) => `#${k}`).join(" ")}` : ""}`,
      },
    ]

    setGeneratedContents(mockResults)
    setIsGenerating(false)
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
    setPersona("") // 清空人设
    setPurpose("") // 清空目的
    setKeywords([]) // 清空关键词列表
    setKeywordInput("") // 清空关键词输入
    setGeneratedContents([]) // 清空生成的内容
    setInputMode(null) // 重置输入模式
    setParseError(null) // 清除解析错误
          setSelectedPosition("") // 清空账号定位选择
  }

  const hasResults = generatedContents.length > 0

  return (
    <div className="container mx-auto px-4 h-[calc(100vh-4.5rem)] flex flex-col">
      {/* 页面标题 */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-2 shadow-md">
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
          爆文改写
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">基于爆款笔记智能生成高质量仿写内容</p>
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
                  placeholder="直接输入或粘贴原文内容..."
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

              {/* 主题和人设 - 一行显示 */}
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
                      改写主题、人设、笔记目的、SEO关键词均为可选项，可根据需要选择性填写。未填写的项目将基于原文内容进行智能仿写。
                    </p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!originalText.trim() || isGenerating}
                  className="flex-1 h-10 text-sm font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700"
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
                <Button variant="outline" onClick={handleReset} size="sm" className="px-4 h-10">
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
              {generatedContents.map((content, index) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 