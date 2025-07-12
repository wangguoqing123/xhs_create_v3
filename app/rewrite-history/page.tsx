"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Link, FileText, Copy, ExternalLink, Clock, Loader2, AlertCircle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import type { RewriteRecord } from "@/lib/types"

export default function RewriteHistoryPage() {
  // 获取认证上下文，用于检查登录状态和用户信息
  const { user, profile } = useMySQLAuth()
  
  // 状态管理
  const [rewriteHistory, setRewriteHistory] = useState<RewriteRecord[]>([]) // 改写记录列表
  const [selectedRecord, setSelectedRecord] = useState<RewriteRecord | null>(null) // 选中的记录
  const [isLoading, setIsLoading] = useState(true) // 加载状态
  const [error, setError] = useState<string | null>(null) // 错误信息
  const [copiedId, setCopiedId] = useState<string | null>(null) // 复制状态

  // 获取改写历史记录
  const fetchRewriteHistory = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔍 [改写历史] 开始获取改写记录列表')
      
      // 调用API获取改写历史
      const response = await fetch('/api/rewrite-history', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '获取改写历史失败')
      }

      console.log('✅ [改写历史] 改写记录获取成功:', result.data.length, '条记录')
      
      setRewriteHistory(result.data || [])
      
      // 如果有记录且没有选中的记录，默认选中第一个
      if (result.data && result.data.length > 0 && !selectedRecord) {
        setSelectedRecord(result.data[0])
      }
      
    } catch (error) {
      console.error('❌ [改写历史] 获取改写记录失败:', error)
      setError(error instanceof Error ? error.message : '获取改写历史失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchRewriteHistory()
  }, [user])

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">已完成</Badge>
      case "generating":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">生成中</Badge>
        )
      case "failed":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">失败</Badge>
      default:
        return <Badge>未知</Badge>
    }
  }

  // 复制内容到剪贴板
  const copyContent = async (title: string, content: string, versionId: string) => {
    try {
      const fullContent = `${title}\n\n${content}`
      await navigator.clipboard.writeText(fullContent)
      setCopiedId(versionId)
      setTimeout(() => setCopiedId(null), 2000) // 2秒后重置复制状态
      console.log('✅ [改写历史] 内容复制成功')
    } catch (err) {
      console.error('❌ [改写历史] 复制失败:', err)
    }
  }

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

  // 如果用户未登录，显示登录提示
  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center pt-20">
          <Card className="w-96 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">需要登录</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                请先登录后查看改写历史记录
              </p>
              <Button onClick={() => window.location.href = '/'}>
                返回首页
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-8">
        <div className="px-4 py-8">
          {/* 页面标题 */}
          {/* <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              改写记录
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">查看您的所有爆文改写历史记录</p>
          </div> */}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ height: 'calc(100vh - 120px)' }}>
            {/* 左侧：改写记录列表 */}
            <div className="lg:col-span-1">
              <Card className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    改写记录
                    {rewriteHistory.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {rewriteHistory.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto" style={{ height: 'calc(100vh - 220px)' }}>
                    <div className="space-y-3 p-6 pt-0">
                      {/* 加载状态 */}
                      {isLoading && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
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
                            onClick={fetchRewriteHistory}
                            className="mt-2"
                          >
                            重试
                          </Button>
                        </div>
                      )}

                      {/* 空状态 */}
                      {!isLoading && !error && rewriteHistory.length === 0 && (
                        <div className="text-center py-8">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">暂无改写记录</p>
                          <Button 
                            size="sm" 
                            onClick={() => window.location.href = '/rewrite'}
                            className="mt-2"
                          >
                            开始改写
                          </Button>
                        </div>
                      )}

                      {/* 记录列表 */}
                      {rewriteHistory.map((record) => (
                        <Card
                          key={record.id}
                          className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-md",
                            selectedRecord?.id === record.id
                              ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                              : "hover:bg-gray-50/50 dark:hover:bg-gray-700/50",
                          )}
                          onClick={() => setSelectedRecord(record)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {record.source_type === "link" ? (
                                  <Link className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                ) : (
                                  <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                )}
                                <h3 className="font-medium text-sm truncate">
                                  {/* 从原文中提取标题或显示原文开头 */}
                                  {record.original_text.includes('【标题】') 
                                    ? record.original_text.split('【标题】')[1]?.split('\n')[0]?.trim() || '改写记录'
                                    : record.original_text.substring(0, 20) + '...'
                                  }
                                </h3>
                              </div>
                              {getStatusBadge(record.status)}
                            </div>

                            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(record.created_at)}</span>
                                </span>
                                {record.generated_content.length > 0 && (
                                  <span>{record.generated_content.length} 个版本</span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {/* 主题配置 */}
                                <Badge variant="outline" className="text-xs px-2 py-0">
                                  {(record.generation_config.theme && record.generation_config.theme !== 'default') 
                                    ? record.generation_config.theme 
                                    : '默认'}
                                </Badge>
                                
                                {/* 人设配置 */}
                                <Badge variant="outline" className="text-xs px-2 py-0">
                                  {(record.generation_config.persona && record.generation_config.persona !== 'default') 
                                    ? record.generation_config.persona 
                                    : '默认'}
                                </Badge>
                                
                                {/* 账号定位显示 */}
                                {record.generation_config.account_positioning && record.generation_config.account_positioning !== 'default' && (
                                  <Badge variant="outline" className="text-xs px-2 py-0">
                                    账号定位
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：改写详情 */}
            <div className="lg:col-span-4">
              <Card className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
                {selectedRecord ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                          {selectedRecord.source_type === "link" ? (
                            <Link className="h-5 w-5 text-blue-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-purple-500" />
                          )}
                          <span>
                            {/* 显示提取的标题或原文开头 */}
                            {selectedRecord.original_text.includes('【标题】') 
                              ? selectedRecord.original_text.split('【标题】')[1]?.split('\n')[0]?.trim() || '改写记录'
                              : '改写记录'
                            }
                          </span>
                        </CardTitle>
                        {getStatusBadge(selectedRecord.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 260px)' }}>
                        <div className="space-y-4">
                          {/* 记录信息 - 紧凑并列显示 */}
                          <div className="space-y-2">
                            {/* 基本信息行 */}
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 rounded-md">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  {selectedRecord.source_type === "link" ? (
                                    <Link className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <FileText className="h-3 w-3 text-purple-500" />
                                  )}
                                  {selectedRecord.source_type === "link" ? "链接解析" : "文本输入"}
                                </span>
                                <span>{formatTime(selectedRecord.created_at)}</span>
                                <span className="text-orange-600 dark:text-orange-400 font-medium">{selectedRecord.credits_consumed} 积分</span>
                              </div>
                              {selectedRecord.source_type === "link" && selectedRecord.source_url && (
                                <a
                                  href={selectedRecord.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>

                            {/* 配置信息行 - 显示所有4个配置项 */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {/* 主题配置 */}
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                主题: {(selectedRecord.generation_config.theme && selectedRecord.generation_config.theme !== 'default') 
                                  ? selectedRecord.generation_config.theme 
                                  : '默认'}
                              </span>
                              
                              {/* 人设配置 */}
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                人设: {(selectedRecord.generation_config.persona && selectedRecord.generation_config.persona !== 'default') 
                                  ? selectedRecord.generation_config.persona 
                                  : '默认'}
                              </span>
                              
                              {/* 目的配置 */}
                              <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                目的: {(selectedRecord.generation_config.purpose && selectedRecord.generation_config.purpose !== 'default') 
                                  ? selectedRecord.generation_config.purpose 
                                  : '默认'}
                              </span>
                              
                              {/* 关键词配置 */}
                              <span className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                                关键词: {(selectedRecord.generation_config.keywords && selectedRecord.generation_config.keywords.length > 0) 
                                  ? selectedRecord.generation_config.keywords.join(', ') 
                                  : '默认'}
                              </span>
                            </div>

                            {/* 原文内容 - 折叠显示 */}
                            <details className="group">
                              <summary className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1">
                                <span>查看原文</span>
                                <div className="ml-auto">▼</div>
                              </summary>
                              <div className="mt-1 p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded border border-gray-200/50 dark:border-gray-700/50">
                                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line max-h-24 overflow-y-auto">
                                  {selectedRecord.original_text}
                                </div>
                              </div>
                            </details>
                          </div>

                          {/* 生成结果 */}
                          {selectedRecord.generated_content.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-5 w-5 rounded bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                                  <span className="text-white text-xs">✨</span>
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">生成结果</h3>
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                  {selectedRecord.generated_content.length} 个版本
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedRecord.generated_content.map((result, index) => (
                                  <Card key={index} className="border-0 shadow-lg bg-white dark:bg-gray-800">
                                    <CardContent className="p-0">
                                      {/* 版本标题 */}
                                      <div
                                        className={cn(
                                          "p-2 rounded-t-lg flex items-center gap-2",
                                          index === 0
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                            : "bg-gradient-to-r from-purple-500 to-purple-600",
                                        )}
                                      >
                                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                          <span
                                            className={cn(
                                              "text-xs font-bold",
                                              index === 0 ? "text-blue-600" : "text-purple-600",
                                            )}
                                          >
                                            {index + 1}
                                          </span>
                                        </div>
                                        <span className="text-white font-medium text-xs">
                                          {result.version_name || `版本${index + 1}`}
                                        </span>
                                      </div>

                                      {/* 内容区域 */}
                                      <div className="p-3">
                                        {/* 标题 */}
                                        <div className="mb-3">
                                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug text-sm">
                                            {result.title}
                                          </h4>
                                        </div>

                                        {/* 正文内容 */}
                                        <div className="mb-3">
                                          <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 p-2 rounded border">
                                            {result.content}
                                          </div>
                                        </div>

                                        {/* 复制按钮 */}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => copyContent(result.title, result.content, `${selectedRecord.id}-${index}`)}
                                          className="w-full flex items-center justify-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 h-8 text-xs"
                                        >
                                          {copiedId === `${selectedRecord.id}-${index}` ? (
                                            <>
                                              <Check className="h-3 w-3 text-green-600" />
                                              <span className="text-green-600">已复制</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="h-3 w-3" />
                                              <span>复制内容</span>
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 生成中状态 */}
                          {selectedRecord.status === "generating" && (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                              <p className="text-gray-600 dark:text-gray-400">正在生成改写内容...</p>
                            </div>
                          )}

                          {/* 失败状态 */}
                          {selectedRecord.status === "failed" && (
                            <div className="text-center py-8">
                              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                              <p className="text-red-600 dark:text-red-400 mb-2">生成失败</p>
                              {selectedRecord.error_message && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {selectedRecord.error_message}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">请选择一个改写记录查看详情</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
