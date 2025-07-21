"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  RefreshCw, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Image as ImageIcon,
  ExternalLink,
  Settings
} from 'lucide-react'

interface CoverUpdateContent {
  id: string
  title: string
  source_urls: string[]
  cover_image: string | null
  author: string | null
  likes: number
  views: number
}

interface UpdateResult {
  id: string
  title: string
  status: 'success' | 'failed'
  error?: string
  oldCover?: string
  newCover?: string
  sourceUrl?: string
}

export default function CoverUpdatePage() {
  // 状态管理
  const [contents, setContents] = useState<CoverUpdateContent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [cookieStr, setCookieStr] = useState('')
  const [batchSize, setBatchSize] = useState(50)

  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([])
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0 })

  // 获取待更新内容列表
  const fetchContents = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/explosive-contents/batch-update-covers?limit=${batchSize}`)
      const result = await response.json()
      
      if (result.success) {
        setContents(result.data.contents)
        console.log('📋 [封面更新页面] 获取待更新内容:', result.data.total)
      } else {
        console.error('❌ 获取待更新内容失败:', result.message)
        alert(result.message)
      }
    } catch (error) {
      console.error('❌ 获取待更新内容错误:', error)
      alert('获取数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 开始批量更新
  const startBatchUpdate = async () => {
    if (!cookieStr.trim()) {
      alert('请先输入小红书Cookie')
      return
    }

    setIsUpdating(true)
    setUpdateResults([])
    setCurrentProgress({ current: 0, total: contents.length })

    try {
      const response = await fetch('/api/admin/explosive-contents/batch-update-covers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize,
          cookieStr: cookieStr.trim()
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setUpdateResults(result.data.details)
        setCurrentProgress({ current: result.data.total, total: result.data.total })
        
        // 更新完成后重新获取列表
        await fetchContents()
        
        // 通知父窗口刷新数据
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({ type: 'COVER_UPDATE_COMPLETED' }, '*')
            console.log('📢 [封面更新页面] 已通知父窗口刷新数据')
          } catch (error) {
            console.log('⚠️ [封面更新页面] 通知父窗口失败:', error)
          }
        }
        
        console.log('🎉 [封面更新页面] 批量更新完成:', result.data)
      } else {
        console.error('❌ 批量更新失败:', result.message)
        alert(result.message)
      }
    } catch (error) {
      console.error('❌ 批量更新错误:', error)
      alert('更新失败')
    } finally {
      setIsUpdating(false)
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchContents()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          封面批量更新
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          批量更新爆款内容的封面图片，从小红书链接获取最新封面
        </p>
      </div>

      {/* 配置区域 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            更新配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cookie输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              小红书Cookie <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={cookieStr}
              onChange={(e) => setCookieStr(e.target.value)}
              placeholder="请输入小红书Cookie..."
              className="min-h-[100px] font-mono text-sm"
            />
          </div>

          {/* 批量设置 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                批处理数量
              </label>
              <Input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                min={1}
                max={200}
                className="w-full"
              />
            </div>

          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              onClick={fetchContents}
              disabled={isLoading || isUpdating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? '获取中...' : '刷新列表'}
            </Button>
            
            <Button
              onClick={startBatchUpdate}
              disabled={isUpdating || contents.length === 0 || !cookieStr.trim()}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isUpdating ? '更新中...' : '开始更新'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 进度显示 */}
      {isUpdating && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">更新进度</span>
              <span className="text-sm text-gray-600">
                {currentProgress.current} / {currentProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${currentProgress.total > 0 ? (currentProgress.current / currentProgress.total) * 100 : 0}%` 
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 结果展示 */}
      {updateResults.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              更新结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {updateResults.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600">成功</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {updateResults.filter(r => r.status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">失败</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {updateResults.length}
                </div>
                <div className="text-sm text-gray-600">总计</div>
              </div>
            </div>

            {/* 详细结果列表 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {updateResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.title}</div>
                    {result.status === 'success' && result.newCover && (
                      <div className="text-xs text-gray-500 truncate">
                        新封面: {result.newCover}
                      </div>
                    )}
                    {result.status === 'failed' && result.error && (
                      <div className="text-xs text-red-500">{result.error}</div>
                    )}
                  </div>
                  
                  {result.sourceUrl && (
                    <a 
                      href={result.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 待更新内容列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              待更新内容 ({contents.length})
            </div>
            <Badge variant="outline">
              {contents.length} 个需要更新
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isLoading ? '加载中...' : '暂无需要更新封面的内容'}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {contents.map((content) => (
                <div key={content.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {/* 当前封面 */}
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    {content.cover_image && content.cover_image !== '/placeholder.jpg' ? (
                      <img 
                        src={content.cover_image} 
                        alt="封面" 
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  {/* 内容信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{content.title}</div>
                    <div className="text-xs text-gray-500 space-x-2">
                      <span>作者: {content.author || '未知'}</span>
                      <span>点赞: {content.likes}</span>
                      <span>浏览: {content.views}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      源链接: {content.source_urls.length} 个
                    </div>
                  </div>
                  
                  {/* 源链接 */}
                  {content.source_urls.length > 0 && (
                    <a 
                      href={content.source_urls[0]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 