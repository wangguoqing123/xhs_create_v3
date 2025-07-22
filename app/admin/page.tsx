'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Users, CreditCard, Clock, FileText, Plus, Edit, Trash2, 
  ExternalLink, CheckCircle, XCircle, Upload, AlertCircle, RefreshCw, Loader2 
} from 'lucide-react'
import type { 
  ExplosiveContent, NoteTrack, NoteType, NoteTone,
  XhsLinkImportResponse
} from '@/lib/types'

interface User {
  id: string
  email: string
  display_name: string | null
  credits: number
  is_active_member: boolean
  membership_type: string | null
  membership_end: string | null
  created_at: string
}

interface AdminLog {
  id: string
  admin_user: string
  operation_type: string
  target_user_email: string
  operation_details: any
  created_at: string
}

export default function AdminPageNew() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // 登录表单
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  })
  
  // 用户管理相关状态（保留基本功能）
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  
  // 爆款内容管理 - 重构版本
  const [explosiveContents, setExplosiveContents] = useState<ExplosiveContent[]>([])
  const [contentFilters, setContentFilters] = useState({
    track_id: 'all',
    type_id: 'all', 
    tone_id: 'all',
    search: '',
    status: 'all'
  })
  
  // 类型数据
  const [noteTrackList, setNoteTrackList] = useState<NoteTrack[]>([])
  const [noteTypeList, setNoteTypeList] = useState<NoteType[]>([])
  const [noteToneList, setNoteToneList] = useState<NoteTone[]>([])
  
  // 链接导入相关状态
  const [showLinkImport, setShowLinkImport] = useState(false)
  const [linkImportText, setLinkImportText] = useState('')
  const [linkImportResult, setLinkImportResult] = useState<XhsLinkImportResponse | null>(null)
  const [linkImportLoading, setLinkImportLoading] = useState(false)

  // 分类管理相关状态
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [categoryType, setCategoryType] = useState<'track' | 'type' | 'tone'>('track')
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  })

  // 检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // 加载基础数据
  useEffect(() => {
    if (isAuthenticated) {
      loadExplosiveContents()
      loadTypeData()
      loadAdminLogs()
    }
  }, [isAuthenticated])
  
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/logs?limit=1')
      if (response.status === 401) {
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(true)
      }
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setMessage('请输入用户名和密码')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      
      const data = await response.json()
      if (data.success) {
        setIsAuthenticated(true)
        setMessage('登录成功')
        setLoginForm({ username: '', password: '' })
      } else {
        setMessage(data.message || '登录失败')
      }
    } catch (error) {
      setMessage('登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setIsAuthenticated(false)
      setMessage('已退出登录')
    } catch (error) {
      setMessage('退出登录失败')
    }
  }

  // 加载类型数据
  const loadTypeData = async () => {
    try {
      const [trackRes, typeRes, toneRes] = await Promise.all([
        fetch('/api/admin/note-tracks'),
        fetch('/api/admin/note-types'), 
        fetch('/api/admin/note-tones')
      ])

      if (trackRes.ok) {
        const trackData = await trackRes.json()
        if (trackData.success) setNoteTrackList(trackData.data)
      }

      if (typeRes.ok) {
        const typeData = await typeRes.json()
        if (typeData.success) setNoteTypeList(typeData.data)
      }

      if (toneRes.ok) {
        const toneData = await toneRes.json()
        if (toneData.success) setNoteToneList(toneData.data)
      }
    } catch (error) {
      console.error('加载类型数据失败:', error)
    }
  }

  // 分类管理功能函数
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      setMessage('分类名称不能为空')
      return
    }

    setIsLoading(true)
    try {
      const apiPath = categoryType === 'track' ? 'note-tracks' : 
                     categoryType === 'type' ? 'note-types' : 'note-tones'
      
      const response = await fetch(`/api/admin/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })

      const data = await response.json()
      if (data.success) {
        setMessage(data.message)
        setCategoryForm({ name: '', description: '' })
        setShowAddCategoryModal(false)
        loadTypeData() // 重新加载数据
      } else {
        setMessage(data.message || '添加失败')
      }
    } catch (error) {
      setMessage('添加失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = async (id: number, type: 'track' | 'type' | 'tone') => {
    const typeNames = { track: '赛道', type: '类型', tone: '口吻' }
    if (!confirm(`确定要删除这个${typeNames[type]}吗？`)) return

    setIsLoading(true)
    try {
      const apiPath = type === 'track' ? 'note-tracks' : 
                     type === 'type' ? 'note-types' : 'note-tones'
      
      const response = await fetch(`/api/admin/${apiPath}?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        setMessage(data.message)
        loadTypeData() // 重新加载数据
      } else {
        setMessage(data.message || '删除失败')
      }
    } catch (error) {
      setMessage('删除失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 爆款内容相关函数
  const loadExplosiveContents = async () => {
    try {
      const params = new URLSearchParams()
      if (contentFilters.track_id && contentFilters.track_id !== 'all') {
        params.append('track_id', contentFilters.track_id)
      }
      if (contentFilters.type_id && contentFilters.type_id !== 'all') {
        params.append('type_id', contentFilters.type_id)
      }
      if (contentFilters.tone_id && contentFilters.tone_id !== 'all') {
        params.append('tone_id', contentFilters.tone_id)
      }
      if (contentFilters.search) {
        params.append('search', contentFilters.search)
      }
      if (contentFilters.status !== 'all') {
        params.append('status', contentFilters.status)
      }
      
      const response = await fetch(`/api/admin/explosive-contents?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setExplosiveContents(data.data)
      } else {
        setMessage(data.message || '获取爆款内容失败')
      }
    } catch (error) {
      setMessage('获取爆款内容失败')
    }
  }

  const handleDeleteContent = async (id: string) => {
    if (!confirm('确定要删除这个爆款内容吗？')) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/explosive-contents/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage('爆款内容删除成功')
        loadExplosiveContents()
      } else {
        setMessage(data.message || '删除失败')
      }
    } catch (error) {
      setMessage('删除失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理链接批量导入
  const handleLinkImport = async () => {
    if (!linkImportText.trim()) {
      setMessage('请输入小红书链接')
      return
    }
    
    setLinkImportLoading(true)
    setMessage('')
    setLinkImportResult(null)
    
    try {
      // 解析链接（支持多行输入）
      const urls = linkImportText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && (line.includes('xiaohongshu.com') || line.includes('xhslink.com')))
      
      if (urls.length === 0) {
        setMessage('没有找到有效的小红书链接')
        setLinkImportLoading(false)
        return
      }
      
      console.log('🚀 [前端] 开始导入链接:', urls.length, '个')
      
      // 发送到后端处理
      const response = await fetch('/api/admin/explosive-contents/import-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls })
      })
      
      const result: XhsLinkImportResponse = await response.json()
      
      if (result.success) {
        setLinkImportResult(result)
        setMessage(result.message || `链接导入完成`)
        loadExplosiveContents() // 重新加载列表
      } else {
        setMessage(result.message || result.error || '链接导入失败')
      }
      
    } catch (error) {
      console.error('链接导入错误:', error)
      setMessage('链接导入失败，请重试')
    } finally {
      setLinkImportLoading(false)
    }
  }

  // 基础的用户搜索和管理日志功能（保留但简化）
  const handleUserSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage('请输入搜索内容')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/search?query=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      if (data.success) {
        setSearchResults(data.data)
      } else {
        setMessage(data.message || '搜索失败')
      }
    } catch (error) {
      setMessage('搜索失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAdminLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs?limit=10')
      const data = await response.json()
      if (data.success) {
        setAdminLogs(data.data)
      }
    } catch (error) {
      console.error('加载管理日志失败:', error)
    }
  }

  // 未登录状态显示登录表单
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">管理员登录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>用户名</Label>
              <Input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="请输入管理员用户名"
              />
            </div>
            <div>
              <Label>密码</Label>
              <Input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="请输入密码"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button 
              onClick={handleLogin} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
            {message && (
              <Alert className={message.includes('成功') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={message.includes('成功') ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 已登录状态显示管理界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-gray-800">小红书内容管理后台</h1>
          <Button variant="outline" onClick={handleLogout}>
            退出登录
          </Button>
        </div>

        <div className="py-8">
          {message && (
            <Alert className={`mb-6 ${message.includes('成功') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <AlertDescription className={message.includes('成功') ? 'text-green-800' : 'text-red-800'}>
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="contents" className="space-y-6">
            <TabsList>
              <TabsTrigger value="contents">
                <FileText className="w-4 h-4 mr-2" />
                爆款内容
              </TabsTrigger>
              <TabsTrigger value="categories">
                <Plus className="w-4 h-4 mr-2" />
                分类管理
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                用户管理
              </TabsTrigger>
              <TabsTrigger value="logs">
                <Clock className="w-4 h-4 mr-2" />
                操作日志
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="contents" className="space-y-6">
              {/* 爆款内容管理 */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">爆款内容管理</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowLinkImport(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    链接导入
                  </Button>
                </div>
              </div>

              {/* 筛选器 */}
              <Card>
                <CardHeader>
                  <CardTitle>筛选条件</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <Label>笔记赛道</Label>
                      <Select
                        value={contentFilters.track_id}
                        onValueChange={(value) => setContentFilters({ ...contentFilters, track_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择赛道" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部赛道</SelectItem>
                          {noteTrackList.map(track => (
                            <SelectItem key={track.id} value={track.id.toString()}>
                              {track.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>笔记类型</Label>
                      <Select
                        value={contentFilters.type_id}
                        onValueChange={(value) => setContentFilters({ ...contentFilters, type_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部类型</SelectItem>
                          {noteTypeList.map(type => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>笔记口吻</Label>
                      <Select
                        value={contentFilters.tone_id}
                        onValueChange={(value) => setContentFilters({ ...contentFilters, tone_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择口吻" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部口吻</SelectItem>
                          {noteToneList.map(tone => (
                            <SelectItem key={tone.id} value={tone.id.toString()}>
                              {tone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>搜索</Label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="搜索标题或内容..."
                          value={contentFilters.search}
                          onChange={(e) => setContentFilters({ ...contentFilters, search: e.target.value })}
                        />
                        <Button onClick={loadExplosiveContents} disabled={isLoading}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 内容列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>内容列表</span>
                    <Badge variant="outline">
                      总数: {explosiveContents.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {explosiveContents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      暂无爆款内容
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {explosiveContents.map((content) => (
                        <Card key={content.id} className="group hover:shadow-lg transition-shadow">
                          <div className="relative">
                            {content.cover_image && (
                              <img 
                                src={content.cover_image} 
                                alt={content.title}
                                className="w-full h-48 object-cover rounded-t-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.jpg'
                                }}
                              />
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-8 h-8 p-0 bg-red-500/90 hover:bg-red-500"
                                onClick={() => handleDeleteContent(content.id)}
                                title="删除"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <CardContent className="p-4">
                            <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 text-sm">
                              {content.title}
                            </h3>
                            
                            <div className="flex flex-wrap gap-1 mb-3">
                              <Badge variant="secondary" className="text-xs">
                                {(content as any).track_name || '未知赛道'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {(content as any).type_name || '未知类型'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {(content as any).tone_name || '未知口吻'}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                              <span>👍 {content.likes_count}</span>
                              <span>💾 {content.collects_count}</span>
                              <span>💬 {content.comments_count}</span>
                            </div>
                            
                            {content.note_url && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs"
                                  onClick={() => window.open(content.note_url!, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  查看原文
                                </Button>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400 mt-2">
                              {content.published_at ? new Date(content.published_at).toLocaleDateString() : '未知时间'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* 链接导入模态框 */}
              {showLinkImport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                    <CardHeader>
                      <CardTitle>小红书链接批量导入</CardTitle>
                      <CardDescription>
                        支持批量导入小红书笔记链接，每行一个链接，最多50个链接
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>小红书链接</Label>
                        <Textarea
                          value={linkImportText}
                          onChange={(e) => setLinkImportText(e.target.value)}
                          placeholder={`请输入小红书链接，每行一个：\nhttps://xiaohongshu.com/explore/...\nhttps://xhslink.com/...`}
                          rows={8}
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          支持 xiaohongshu.com 和 xhslink.com 域名的链接
                        </div>
                      </div>
                      
                      {linkImportResult && (
                        <div className="space-y-2">
                          <h4 className="font-medium">导入结果</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="font-medium text-blue-600">总数</div>
                              <div className="text-lg">{linkImportResult.data?.total || 0}</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-medium text-green-600">成功</div>
                              <div className="text-lg">{linkImportResult.data?.successful || 0}</div>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                              <div className="font-medium text-red-600">失败</div>
                              <div className="text-lg">{linkImportResult.data?.failed || 0}</div>
                            </div>
                          </div>
                          
                          {linkImportResult.data?.results && linkImportResult.data.results.length > 0 && (
                            <div className="max-h-40 overflow-y-auto border rounded p-2">
                              {linkImportResult.data.results.map((result, index) => (
                                <div key={index} className="flex items-center text-xs py-1">
                                  {result.success ? (
                                    <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500 mr-2" />
                                  )}
                                  <span className="flex-1 truncate">{result.url}</span>
                                  {!result.success && result.error && (
                                    <span className="text-red-500 ml-2">{result.error}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowLinkImport(false)
                            setLinkImportText('')
                            setLinkImportResult(null)
                          }}
                          disabled={linkImportLoading}
                        >
                          取消
                        </Button>
                        <Button
                          onClick={handleLinkImport}
                          disabled={linkImportLoading || !linkImportText.trim()}
                        >
                          {linkImportLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              导入中...
                            </>
                          ) : (
                            '开始导入'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              {/* 分类管理 */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">分类管理</h2>
                <Button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加分类
                </Button>
              </div>

              {/* 分类列表 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 笔记赛道 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">笔记赛道</CardTitle>
                    <CardDescription>管理笔记的内容赛道分类</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {noteTrackList.map((track) => (
                      <div key={track.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium">{track.name}</div>
                          {track.description && (
                            <div className="text-sm text-gray-600">{track.description}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(track.id, 'track')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 笔记类型 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">笔记类型</CardTitle>
                    <CardDescription>管理笔记的内容类型分类</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {noteTypeList.map((type) => (
                      <div key={type.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium">{type.name}</div>
                          {type.description && (
                            <div className="text-sm text-gray-600">{type.description}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(type.id, 'type')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 笔记口吻 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-600">笔记口吻</CardTitle>
                    <CardDescription>管理笔记的表达口吻分类</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {noteToneList.map((tone) => (
                      <div key={tone.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                        <div>
                          <div className="font-medium">{tone.name}</div>
                          {tone.description && (
                            <div className="text-sm text-gray-600">{tone.description}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(tone.id, 'tone')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* 添加分类模态框 */}
              {showAddCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-md mx-4">
                    <CardHeader>
                      <CardTitle>添加新分类</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>分类类型</Label>
                        <Select value={categoryType} onValueChange={(value: 'track' | 'type' | 'tone') => setCategoryType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="track">笔记赛道</SelectItem>
                            <SelectItem value="type">笔记类型</SelectItem>
                            <SelectItem value="tone">笔记口吻</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>分类名称</Label>
                        <Input
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          placeholder="请输入分类名称"
                        />
                      </div>
                      <div>
                        <Label>分类描述（可选）</Label>
                        <Textarea
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          placeholder="请输入分类描述"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddCategory}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          添加
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddCategoryModal(false)
                            setCategoryForm({ name: '', description: '' })
                          }}
                          className="flex-1"
                        >
                          取消
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              {/* 简化的用户管理功能 */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">用户管理</h2>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>用户搜索</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="搜索用户邮箱..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button onClick={handleUserSearch} disabled={isLoading}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-gray-500">
                              积分: {user.credits} | 会员: {user.is_active_member ? '是' : '否'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-6">
              {/* 操作日志 */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">操作日志</h2>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>最近操作记录</CardTitle>
                </CardHeader>
                <CardContent>
                  {adminLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">暂无操作记录</div>
                  ) : (
                    <div className="space-y-2">
                      {adminLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{log.operation_type}</div>
                            <div className="text-sm text-gray-500">
                              管理员: {log.admin_user} | 目标: {log.target_user_email}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 