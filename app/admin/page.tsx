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
import { Search, Users, CreditCard, Gift, LogOut, Shield, Clock, FileText, Plus, Edit, Trash2, Upload } from 'lucide-react'
import type { ExplosiveContent, ExplosiveContentInsert, IndustryType, ContentFormType } from '@/lib/types'
import { INDUSTRY_OPTIONS, CONTENT_TYPE_OPTIONS } from '@/lib/types'

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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // 登录表单
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  })
  
  // 用户搜索
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // 操作表单
  const [operationForm, setOperationForm] = useState({
    credits_amount: '',
    membership_type: '',
    reason: ''
  })
  
  // 操作日志
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  
  // 爆款内容管理
  const [explosiveContents, setExplosiveContents] = useState<ExplosiveContent[]>([])
  const [contentFilters, setContentFilters] = useState({
    industry: 'all',
    content_type: 'all',
    search: ''
  })
  const [showContentForm, setShowContentForm] = useState(false)
  const [editingContent, setEditingContent] = useState<ExplosiveContent | null>(null)
  const [contentForm, setContentForm] = useState<ExplosiveContentInsert>({
    title: '',
    content: '',
    tags: [],
    industry: 'decoration' as IndustryType,
    content_type: 'note' as ContentFormType,
    source_urls: [],
    cover_image: null,
    likes: 0,
    views: 0,
    author: null,
    status: 'enabled'
  })
  
  // 检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])
  
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/logs?limit=1')
      if (response.status === 401) {
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(true)
        loadAdminLogs()
      }
    } catch (error) {
      setIsAuthenticated(false)
    }
  }
  
  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsAuthenticated(true)
        setMessage('登录成功')
        loadAdminLogs()
      } else {
        setMessage(data.message || '登录失败')
      }
    } catch (error) {
      setMessage('网络错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 登出
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setIsAuthenticated(false)
      setSearchResults([])
      setSelectedUser(null)
      setAdminLogs([])
      setMessage('已登出')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }
  
  // 搜索用户
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage('请输入搜索关键词')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.data)
        setMessage(`找到 ${data.data.length} 个用户`)
      } else {
        setMessage(data.message || '搜索失败')
        setSearchResults([])
      }
    } catch (error) {
      setMessage('搜索失败，请重试')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // 赠送积分
  const handleGrantCredits = async () => {
    if (!selectedUser || !operationForm.credits_amount) {
      setMessage('请选择用户并输入积分数量')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/operations/grant-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          credits_amount: parseInt(operationForm.credits_amount),
          reason: operationForm.reason || '管理员赠送积分'
        }),
      })
      
      const data = await response.json()
      setMessage(data.message)
      
      if (data.success) {
        setOperationForm({ credits_amount: '', membership_type: '', reason: '' })
        loadAdminLogs()
        // 重新搜索以更新用户信息
        if (searchTerm) {
          handleSearch()
        }
      }
    } catch (error) {
      setMessage('操作失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 设置会员
  const handleSetMembership = async () => {
    if (!selectedUser || !operationForm.membership_type) {
      setMessage('请选择用户和会员类型')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/operations/set-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          membership_type: operationForm.membership_type,
          reason: operationForm.reason || '管理员设置会员'
        }),
      })
      
      const data = await response.json()
      setMessage(data.message)
      
      if (data.success) {
        setOperationForm({ credits_amount: '', membership_type: '', reason: '' })
        loadAdminLogs()
        // 重新搜索以更新用户信息
        if (searchTerm) {
          handleSearch()
        }
      }
    } catch (error) {
      setMessage('操作失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 赠送积分包
  const handleGiftCreditPackage = async () => {
    if (!selectedUser || !operationForm.credits_amount) {
      setMessage('请选择用户并输入积分数量')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/operations/gift-credit-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          credits_amount: parseInt(operationForm.credits_amount),
          reason: operationForm.reason || '管理员赠送积分包'
        }),
      })
      
      const data = await response.json()
      setMessage(data.message)
      
      if (data.success) {
        setOperationForm({ credits_amount: '', membership_type: '', reason: '' })
        loadAdminLogs()
        // 重新搜索以更新用户信息
        if (searchTerm) {
          handleSearch()
        }
      }
    } catch (error) {
      setMessage('操作失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 加载操作日志
  const loadAdminLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs?limit=20')
      const data = await response.json()
      
      if (data.success) {
        setAdminLogs(data.data)
      }
    } catch (error) {
      console.error('加载日志失败:', error)
    }
  }
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }
  
  // 获取操作类型显示名称
  const getOperationTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'grant_credits': '赠送积分',
      'set_membership': '设置会员',
      'gift_credit_package': '赠送积分包'
    }
    return typeMap[type] || type
  }
  
  // 爆款内容相关函数
  const loadExplosiveContents = async () => {
    try {
      const params = new URLSearchParams()
      if (contentFilters.industry && contentFilters.industry !== 'all') params.append('industry', contentFilters.industry)
      if (contentFilters.content_type && contentFilters.content_type !== 'all') params.append('content_type', contentFilters.content_type)
      if (contentFilters.search) params.append('search', contentFilters.search)
      
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
  
  const handleCreateContent = async () => {
    if (!contentForm.title || !contentForm.content) {
      setMessage('标题和内容不能为空')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/explosive-contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentForm)
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage('爆款内容创建成功')
        setShowContentForm(false)
        resetContentForm()
        loadExplosiveContents()
      } else {
        setMessage(data.message || '创建失败')
      }
    } catch (error) {
      setMessage('创建失败')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleUpdateContent = async () => {
    if (!editingContent) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/explosive-contents/${editingContent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentForm)
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage('爆款内容更新成功')
        setShowContentForm(false)
        setEditingContent(null)
        resetContentForm()
        loadExplosiveContents()
      } else {
        setMessage(data.message || '更新失败')
      }
    } catch (error) {
      setMessage('更新失败')
    } finally {
      setIsLoading(false)
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
  
  const handleEditContent = (content: ExplosiveContent) => {
    setEditingContent(content)
    setContentForm({
      title: content.title,
      content: content.content,
      tags: content.tags,
      industry: content.industry,
      content_type: content.content_type,
      source_urls: content.source_urls,
      cover_image: content.cover_image,
      likes: content.likes,
      views: content.views,
      author: content.author,
      status: content.status
    })
    setShowContentForm(true)
  }
  
  const resetContentForm = () => {
    setContentForm({
      title: '',
      content: '',
      tags: [],
      industry: 'decoration' as IndustryType,
      content_type: 'note' as ContentFormType,
      source_urls: [],
      cover_image: null,
      likes: 0,
      views: 0,
      author: null,
      status: 'enabled'
    })
  }
  
  // 如果未认证，显示登录表单
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>管理后台登录</CardTitle>
            <CardDescription>请输入管理员账号和密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="admin"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="请输入密码"
                  required
                />
              </div>
              {message && (
                <Alert className={message.includes('成功') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertDescription className={message.includes('成功') ? 'text-green-800' : 'text-red-800'}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // 已认证，显示管理界面
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">管理后台</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </div>
      
      <div className="py-8">
        {message && (
          <Alert className={`mb-6 ${message.includes('成功') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <AlertDescription className={message.includes('成功') ? 'text-green-800' : 'text-red-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="contents">
              <FileText className="w-4 h-4 mr-2" />
              爆款内容
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Clock className="w-4 h-4 mr-2" />
              操作日志
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
            {/* 用户搜索 */}
            <Card>
              <CardHeader>
                <CardTitle>搜索用户</CardTitle>
                <CardDescription>输入用户邮箱或昵称进行搜索</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    placeholder="输入邮箱或昵称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isLoading}>
                    <Search className="w-4 h-4 mr-2" />
                    搜索
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>搜索结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedUser?.id === user.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{user.display_name || '未设置昵称'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{user.credits} 积分</Badge>
                            {user.is_active_member && (
                              <Badge variant="default">
                                {user.membership_type === 'yearly' ? '年会员' : '月会员'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 操作面板 */}
            {selectedUser && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 赠送积分 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      赠送积分
                    </CardTitle>
                    <CardDescription>直接为用户增加积分</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>积分数量</Label>
                      <Input
                        type="number"
                        placeholder="输入积分数量"
                        value={operationForm.credits_amount}
                        onChange={(e) => setOperationForm({ ...operationForm, credits_amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>操作原因</Label>
                      <Textarea
                        placeholder="可选，记录操作原因"
                        value={operationForm.reason}
                        onChange={(e) => setOperationForm({ ...operationForm, reason: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleGrantCredits} disabled={isLoading} className="w-full">
                      确认赠送
                    </Button>
                  </CardContent>
                </Card>
                
                {/* 设置会员 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      设置会员
                    </CardTitle>
                    <CardDescription>设置用户会员身份</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>会员类型</Label>
                      <Select value={operationForm.membership_type} onValueChange={(value) => setOperationForm({ ...operationForm, membership_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择会员类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">月会员 (+500积分)</SelectItem>
                          <SelectItem value="yearly">年会员 (+800积分/月)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>操作原因</Label>
                      <Textarea
                        placeholder="可选，记录操作原因"
                        value={operationForm.reason}
                        onChange={(e) => setOperationForm({ ...operationForm, reason: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleSetMembership} disabled={isLoading} className="w-full">
                      确认设置
                    </Button>
                  </CardContent>
                </Card>
                
                {/* 赠送积分包 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Gift className="w-5 h-5 mr-2" />
                      赠送积分包
                    </CardTitle>
                    <CardDescription>为会员用户赠送积分包</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>积分包数量</Label>
                      <Input
                        type="number"
                        placeholder="输入积分数量"
                        value={operationForm.credits_amount}
                        onChange={(e) => setOperationForm({ ...operationForm, credits_amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>操作原因</Label>
                      <Textarea
                        placeholder="可选，记录操作原因"
                        value={operationForm.reason}
                        onChange={(e) => setOperationForm({ ...operationForm, reason: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleGiftCreditPackage} disabled={isLoading} className="w-full">
                      确认赠送
                    </Button>
                    <div className="text-xs text-gray-500">
                      注意：只有会员才能获得积分包
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="contents" className="space-y-6">
            {/* 爆款内容管理 */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">爆款内容管理</h2>
              <Button onClick={() => {
                setEditingContent(null)
                resetContentForm()
                setShowContentForm(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                添加内容
              </Button>
            </div>

            {/* 筛选器 */}
            <Card>
              <CardHeader>
                <CardTitle>筛选条件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>行业</Label>
                    <Select
                      value={contentFilters.industry}
                      onValueChange={(value) => setContentFilters({ ...contentFilters, industry: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择行业" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部行业</SelectItem>
                        {Object.entries(INDUSTRY_OPTIONS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>内容形式</Label>
                    <Select
                      value={contentFilters.content_type}
                      onValueChange={(value) => setContentFilters({ ...contentFilters, content_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择内容形式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部形式</SelectItem>
                        {Object.entries(CONTENT_TYPE_OPTIONS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
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
                <CardTitle>内容列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {explosiveContents.map((content) => (
                    <div key={content.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{content.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {INDUSTRY_OPTIONS[content.industry as keyof typeof INDUSTRY_OPTIONS]}
                            </Badge>
                            <Badge variant="outline">
                              {CONTENT_TYPE_OPTIONS[content.content_type as keyof typeof CONTENT_TYPE_OPTIONS]}
                            </Badge>
                            <Badge variant={content.status === 'enabled' ? 'default' : 'secondary'}>
                              {content.status === 'enabled' ? '启用' : '禁用'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditContent(content)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteContent(content.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-2 mb-2">{content.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>作者: {content.author || '未知'}</span>
                        <div className="flex items-center gap-4">
                          <span>👍 {content.likes}</span>
                          <span>👁️ {content.views}</span>
                          <span>{new Date(content.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {explosiveContents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      暂无爆款内容
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 内容表单模态框 */}
            {showContentForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                  <CardHeader>
                    <CardTitle>{editingContent ? '编辑爆款内容' : '添加爆款内容'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>标题 *</Label>
                      <Input
                        value={contentForm.title}
                        onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                        placeholder="请输入标题"
                      />
                    </div>
                    <div>
                      <Label>内容 *</Label>
                      <Textarea
                        value={contentForm.content}
                        onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                        placeholder="请输入内容"
                        rows={6}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>行业 *</Label>
                        <Select
                          value={contentForm.industry}
                          onValueChange={(value) => setContentForm({ ...contentForm, industry: value as IndustryType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INDUSTRY_OPTIONS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>内容形式 *</Label>
                        <Select
                          value={contentForm.content_type}
                          onValueChange={(value) => setContentForm({ ...contentForm, content_type: value as ContentFormType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CONTENT_TYPE_OPTIONS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>作者</Label>
                      <Input
                        value={contentForm.author || ''}
                        onChange={(e) => setContentForm({ ...contentForm, author: e.target.value || null })}
                        placeholder="请输入作者"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>点赞数</Label>
                        <Input
                          type="number"
                          value={contentForm.likes}
                          onChange={(e) => setContentForm({ ...contentForm, likes: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>浏览数</Label>
                        <Input
                          type="number"
                          value={contentForm.views}
                          onChange={(e) => setContentForm({ ...contentForm, views: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>来源链接</Label>
                      <Textarea
                        value={(contentForm.source_urls || []).join('\n')}
                        onChange={(e) => setContentForm({ 
                          ...contentForm, 
                          source_urls: e.target.value.split('\n').filter(url => url.trim()) 
                        })}
                        placeholder="每行一个链接"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>标签</Label>
                      <Input
                        value={(contentForm.tags || []).join(', ')}
                        onChange={(e) => setContentForm({ 
                          ...contentForm, 
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                        })}
                        placeholder="用逗号分隔多个标签"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowContentForm(false)
                          setEditingContent(null)
                          resetContentForm()
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={editingContent ? handleUpdateContent : handleCreateContent}
                        disabled={isLoading}
                      >
                        {isLoading ? '保存中...' : '保存'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>操作日志</CardTitle>
                <CardDescription>管理员操作记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge>{getOperationTypeName(log.operation_type)}</Badge>
                          <span className="font-medium">{log.target_user_email}</span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(log.created_at)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        操作者: {log.admin_user}
                      </div>
                      {log.operation_details && (
                        <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.operation_details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                  {adminLogs.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      暂无操作记录
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 