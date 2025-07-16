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
import { Search, Users, CreditCard, Gift, LogOut, Shield, Clock, FileText, Plus, Edit, Trash2, Upload, User, Heart, Eye, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import type { ExplosiveContent, ExplosiveContentInsert, IndustryType, ContentFormType } from '@/lib/types'
import { INDUSTRY_OPTIONS, CONTENT_TYPE_OPTIONS } from '@/lib/types'
import CSVImportModal from '@/components/csv-import-modal'

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
    search: '',
    review_status: 'all' // 添加审核状态筛选
  })
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([])
  const [showContentForm, setShowContentForm] = useState(false)
  const [editingContent, setEditingContent] = useState<ExplosiveContent | null>(null)
  const [contentForm, setContentForm] = useState<ExplosiveContentInsert>({
    title: '',
    content: '',
    tags: [],
    industry: '',
    content_type: 'note' as ContentFormType,
    source_urls: [],
    cover_image: null,
    likes: 0,
    views: 0,
    author: null,
    status: 'enabled'
  })
  
  // 批量导入相关状态
  const [showBatchImport, setShowBatchImport] = useState(false)
  const [batchImportFile, setBatchImportFile] = useState<File | null>(null)
  const [batchImportResult, setBatchImportResult] = useState<any>(null)
  const [batchImportLoading, setBatchImportLoading] = useState(false)
  
  // 链接批量导入相关状态
  const [showLinkImport, setShowLinkImport] = useState(false)
  const [linkImportText, setLinkImportText] = useState('')
  const [linkImportResult, setLinkImportResult] = useState<any>(null)
  const [linkImportLoading, setLinkImportLoading] = useState(false)
  
  // 检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // 加载爆款内容
  useEffect(() => {
    if (isAuthenticated) {
      loadExplosiveContents()
    }
  }, [isAuthenticated])
  
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
        
        // 提取所有已使用的行业
        const industries = [...new Set(data.data.map((content: ExplosiveContent) => content.industry))].filter(Boolean) as string[]
        setAvailableIndustries(industries)
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

  // 审核内容（启用/禁用）
  const handleReviewContent = async (id: string, action: 'approve' | 'disable') => {
    const actionText = action === 'approve' ? '审核通过' : '禁用'
    if (!confirm(`确定要${actionText}这个爆款内容吗？`)) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/explosive-contents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage(data.message || `${actionText}成功`)
        loadExplosiveContents() // 重新加载列表
      } else {
        setMessage(data.error || `${actionText}失败`)
      }
    } catch (error) {
      setMessage(`${actionText}失败`)
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
      industry: '',
      content_type: 'note' as ContentFormType,
      source_urls: [],
      cover_image: null,
      likes: 0,
      views: 0,
      author: null,
      status: 'enabled'
    })
  }

  // 批量导入处理函数
  const handleBatchImport = async () => {
    if (!batchImportFile) {
      setMessage('请选择要导入的文件')
      return
    }

    setBatchImportLoading(true)
    setBatchImportResult(null)

    try {
      // 读取CSV文件
      const text = await batchImportFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setMessage('文件格式错误或没有数据')
        setBatchImportLoading(false)
        return
      }

      // 解析CSV数据
      const headers = lines[0].split(',').map(h => h.trim())
      const contents = []

      for (let i = 1; i < lines.length; i++) {
        const values = []
        let currentValue = ''
        let inQuotes = false
        
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j]
          
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim())
            currentValue = ''
          } else {
            currentValue += char
          }
        }
        values.push(currentValue.trim()) // 添加最后一个值

        if (values.length >= 4) { // 至少需要标题、内容、行业、内容形式
          const content = {
            title: values[0] || '',
            content: values[1] || '',
            tags: values[2] ? values[2].split(',').map(t => t.trim()) : [],
            industry: values[3] || '其他',
            content_type: values[4] || 'note',
            source_urls: values[5] ? [values[5]] : [],
            cover_image: values[6] || null,
            likes: parseInt(values[7]) || 0,
            views: parseInt(values[8]) || 0,
            author: values[9] || null,
            status: values[10] || 'enabled'
          }
          contents.push(content)
        }
      }

      if (contents.length === 0) {
        setMessage('没有找到有效的数据行')
        setBatchImportLoading(false)
        return
      }

      // 发送到后端
      const response = await fetch('/api/admin/explosive-contents/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents })
      })

      const result = await response.json()
      
      if (result.success) {
        setBatchImportResult(result.data)
        setMessage(`批量导入完成：成功 ${result.data.success_count} 条，失败 ${result.data.failed_count} 条`)
        loadExplosiveContents() // 重新加载列表
      } else {
        setMessage(result.message || '批量导入失败')
      }

    } catch (error) {
      console.error('批量导入错误:', error)
      setMessage('批量导入失败，请检查文件格式')
    } finally {
      setBatchImportLoading(false)
    }
  }
  
  // 检查爆文是否需要审核
  const needsReview = (content: ExplosiveContent) => {
    const missingFields = []
    if (!content.industry || content.industry === 'other') missingFields.push('industry')
    if (!content.title || content.title === '需要补充标题') missingFields.push('title')
    if (!content.content || content.content === '需要补充内容') missingFields.push('content')
    
    return {
      needsReview: missingFields.length > 0 || content.status === 'disabled',
      missingFields
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
    
    try {
      // 解析链接（支持多行输入）
      const urls = linkImportText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('xiaohongshu.com'))
      
      if (urls.length === 0) {
        setMessage('没有找到有效的小红书链接')
        setLinkImportLoading(false)
        return
      }
      
      // 发送到后端处理（后端会自动获取用户保存的Cookie）
      const response = await fetch('/api/admin/explosive-contents/batch-import-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          urls
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setLinkImportResult(result.data)
        setMessage(`链接导入完成：成功 ${result.data.successful} 个，失败 ${result.data.failed} 个`)
        loadExplosiveContents() // 重新加载列表
      } else {
        setMessage(result.message || '链接导入失败')
      }
      
    } catch (error) {
      console.error('链接导入错误:', error)
      setMessage('链接导入失败，请重试')
    } finally {
      setLinkImportLoading(false)
    }
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = '/explosive-content-template.csv'
                    link.download = '爆文数据模板.csv'
                    link.click()
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  下载模板
                </Button>
                <CSVImportModal />
                <Button
                  variant="outline"
                  onClick={() => setShowBatchImport(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  批量导入
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLinkImport(true)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  链接导入
                </Button>
                <Button onClick={() => {
                  setEditingContent(null)
                  resetContentForm()
                  setShowContentForm(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加内容
                </Button>
              </div>
            </div>

            {/* 筛选器 */}
            <Card>
              <CardHeader>
                <CardTitle>筛选条件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        {availableIndustries.map((industry) => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
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
                    <Label>审核状态</Label>
                    <Select
                      value={contentFilters.review_status}
                      onValueChange={(value) => setContentFilters({ ...contentFilters, review_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择审核状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="needs_review">需要审核</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
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
                  <div className="flex gap-2 text-sm">
                    <Badge variant="outline">
                      总数: {explosiveContents.length}
                    </Badge>
                    <Badge variant="destructive">
                      需审核: {explosiveContents.filter(content => needsReview(content).needsReview).length}
                    </Badge>
                    <Badge variant="default">
                      已完成: {explosiveContents.filter(content => !needsReview(content).needsReview).length}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {explosiveContents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无爆款内容
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {explosiveContents
                      .filter((content) => {
                        const reviewStatus = needsReview(content)
                        if (contentFilters.review_status === 'needs_review') {
                          return reviewStatus.needsReview
                        } else if (contentFilters.review_status === 'completed') {
                          return !reviewStatus.needsReview
                        }
                        return true // 'all' 显示全部
                      })
                      .map((content) => {
                        const reviewStatus = needsReview(content)
                        return (
                        <Card
                          key={content.id}
                          className={`group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 rounded-2xl shadow-md ${
                            reviewStatus.needsReview 
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800' 
                              : 'bg-white dark:bg-slate-800'
                          }`}
                        >
                        <div className="relative">
                          {/* 封面图片 */}
                          <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-700 rounded-t-2xl overflow-hidden">
                            {content.cover_image ? (
                              <img
                                src={content.cover_image}
                                alt={content.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* 状态标识 */}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Badge variant={content.status === 'enabled' ? 'default' : 'secondary'} className="text-xs">
                              {content.status === 'enabled' ? '启用' : '禁用'}
                            </Badge>
                            {reviewStatus.needsReview && (
                              <Badge variant="destructive" className="text-xs">
                                需审核
                              </Badge>
                            )}
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="flex gap-1">
                              {/* 审核按钮 */}
                              {content.status === 'disabled' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-8 h-8 p-0 bg-green-500/90 hover:bg-green-500 text-white"
                                  onClick={() => handleReviewContent(content.id, 'approve')}
                                  title="审核通过"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-8 h-8 p-0 bg-orange-500/90 hover:bg-orange-500 text-white"
                                  onClick={() => handleReviewContent(content.id, 'disable')}
                                  title="禁用"
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                                onClick={() => handleEditContent(content)}
                                title="编辑"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
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
                        </div>
                        
                        <CardContent className="p-4">
                          {/* 标题 */}
                          <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 text-sm leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {content.title}
                          </h3>
                          
                          {/* 内容预览 */}
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {content.content}
                          </p>
                          
                          {/* 标签 */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {content.industry || '未设置行业'}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {CONTENT_TYPE_OPTIONS[content.content_type as keyof typeof CONTENT_TYPE_OPTIONS]}
                            </Badge>
                          </div>
                          
                          {/* 缺失字段提示 */}
                          {reviewStatus.missingFields.length > 0 && (
                            <div className="mb-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
                              <div className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">
                                需要补充信息：
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {reviewStatus.missingFields.map((field) => (
                                  <Badge key={field} variant="destructive" className="text-xs">
                                    {field === 'industry' ? '行业' : field === 'title' ? '标题' : field === 'content' ? '内容' : field}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* 作者和数据 */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="truncate">{content.author || '未知'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" />
                                <span>{content.likes > 999 ? `${(content.likes/1000).toFixed(1)}k` : content.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3 text-blue-500" />
                                <span>{content.views > 999 ? `${(content.views/1000).toFixed(1)}k` : content.views}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* 来源链接 */}
                          {content.source_urls && content.source_urls.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs h-6"
                                onClick={() => {
                                  const url = content.source_urls[0]
                                  if (url) {
                                    window.open(url, '_blank')
                                  }
                                }}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                查看原文
                              </Button>
                            </div>
                          )}
                          
                          {/* 发布时间 */}
                          <div className="text-xs text-gray-400 mt-2">
                            发布: {content.published_at ? new Date(content.published_at).toLocaleDateString() : '未设置'}
                          </div>
                        </CardContent>
                      </Card>
                      )
                    })}
                  </div>
                )}
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
                        <Input
                          value={contentForm.industry}
                          onChange={(e) => setContentForm({ ...contentForm, industry: e.target.value })}
                          placeholder="请输入行业分类，如：家装装修、美妆护肤等"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          常用选项：装修、美妆、母婴、美食、旅游、时尚、科技、教育、生活、健身
                        </div>
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

            {/* 批量导入模态框 */}
            {showBatchImport && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-2xl m-4">
                  <CardHeader>
                    <CardTitle>批量导入爆款内容</CardTitle>
                    <CardDescription>
                      支持CSV格式文件，请先下载模板文件，按照格式填写数据后上传
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>选择文件</Label>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setBatchImportFile(e.target.files?.[0] || null)}
                      />
                      <div className="text-sm text-gray-500">
                        请选择CSV格式文件，文件大小不超过10MB
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">字段说明：</h4>
                      <div className="text-sm space-y-1 text-gray-600">
                        <div><strong>标题</strong>：必填，爆文标题</div>
                        <div><strong>内容</strong>：必填，爆文正文内容</div>
                        <div><strong>标签</strong>：可选，多个标签用逗号分隔</div>
                        <div><strong>行业</strong>：必填，可自定义输入，如：家装装修、美妆护肤、母婴育儿等</div>
                        <div><strong>内容形式</strong>：必填，可选值：note, review, guide, case</div>
                        <div><strong>来源链接</strong>：可选，小红书笔记链接</div>
                        <div><strong>封面图片</strong>：可选，图片URL</div>
                        <div><strong>点赞数/浏览数</strong>：可选，数字</div>
                        <div><strong>作者</strong>：可选，作者名称</div>
                        <div><strong>状态</strong>：可选，enabled 或 disabled，默认 enabled</div>
                      </div>
                    </div>

                    {batchImportResult && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">导入结果：</h4>
                        <div className="text-sm space-y-1">
                          <div className="text-green-600">成功导入：{batchImportResult.success_count} 条</div>
                          <div className="text-red-600">导入失败：{batchImportResult.failed_count} 条</div>
                          {batchImportResult.failed_items && batchImportResult.failed_items.length > 0 && (
                            <div className="mt-2">
                              <div className="text-red-600 font-medium">失败详情：</div>
                              <div className="max-h-32 overflow-y-auto text-xs">
                                {batchImportResult.failed_items.map((item: any, index: number) => (
                                  <div key={index} className="text-red-600">
                                    第{item.index + 1}行：{item.error}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowBatchImport(false)
                          setBatchImportFile(null)
                          setBatchImportResult(null)
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleBatchImport}
                        disabled={!batchImportFile || batchImportLoading}
                      >
                        {batchImportLoading ? '导入中...' : '开始导入'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 链接批量导入模态框 */}
            {showLinkImport && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-2xl m-4">
                  <CardHeader>
                    <CardTitle>小红书链接批量导入</CardTitle>
                    <CardDescription>
                      输入小红书链接，系统将自动获取笔记详情并保存到爆文库
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>小红书链接</Label>
                      <Textarea
                        placeholder="请输入小红书链接，每行一个链接&#10;例如：&#10;https://xiaohongshu.com/note/abc123&#10;https://xiaohongshu.com/note/def456"
                        value={linkImportText}
                        onChange={(e) => setLinkImportText(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <div className="text-sm text-gray-500">
                        支持单个或多个链接，每行一个链接
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <h4 className="font-medium mb-2 text-amber-800">重要说明：</h4>
                      <div className="text-sm space-y-1 text-amber-700">
                        <div>• 导入的爆文默认为<strong>禁用状态</strong>，需要管理员审核后手动启用</div>
                        <div>• 部分字段可能需要手动补充，如：<strong>行业分类</strong></div>
                        <div>• 系统会自动获取：标题、内容、标签、作者、点赞数、封面图等</div>
                        <div>• 系统会自动使用您保存的小红书Cookie获取笔记详情</div>
                        <div>• 如果Cookie未配置，请先在个人设置中配置小红书Cookie</div>
                      </div>
                    </div>

                    {linkImportResult && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">导入结果：</h4>
                        <div className="text-sm space-y-1">
                          <div className="text-green-600">成功导入：{linkImportResult.successful} 个</div>
                          <div className="text-red-600">导入失败：{linkImportResult.failed} 个</div>
                          {linkImportResult.items && linkImportResult.items.length > 0 && (
                            <div className="mt-2">
                              <div className="font-medium">详细结果：</div>
                              <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                                {linkImportResult.items.map((item: any, index: number) => (
                                  <div key={index} className={item.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                                    {item.status === 'success' ? (
                                      <div>
                                        ✓ {item.title}
                                        {item.missingFields && item.missingFields.length > 0 && (
                                          <span className="text-amber-600 ml-2">
                                            (需补充: {item.missingFields.join(', ')})
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div>✗ {item.url} - {item.error}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleLinkImport}
                        disabled={!linkImportText.trim() || linkImportLoading}
                      >
                        {linkImportLoading ? '导入中...' : '开始导入'}
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