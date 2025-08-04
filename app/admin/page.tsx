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
import { useCreditsContext } from '@/components/credits-context'

interface User {
  id: string
  email: string
  display_name: string | null
  credits: number
  is_active_member: boolean
  membership_type: string | null
  membership_status: string | null
  membership_end: string | null
  membership_level: string | null
  membership_duration: string | null
  monthly_credits: number | null
  next_credits_reset: string | null
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
  // 获取积分上下文，用于在操作后刷新导航栏积分显示
  const { refreshBalance } = useCreditsContext()
  
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
  
  // 分页相关状态
  const [contentPagination, setContentPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: true,
    total: 0
  })
  const [isLoadingMoreContent, setIsLoadingMoreContent] = useState(false)
  
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
  
  // 迁移相关状态
  const [isMigrating, setIsMigrating] = useState(false)

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

  // 迁移"其他"赛道ID从7到0
  const handleMigrateOtherTrack = async () => {
    if (!confirm('确定要将"其他"赛道的ID从7迁移到0吗？\n\n注意：这将同时更新所有相关的爆款内容数据。')) {
      return
    }

    setIsMigrating(true)
    try {
      const response = await fetch('/api/admin/note-tracks/migrate-other', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      if (data.success) {
        setMessage('成功将"其他"赛道ID从7迁移到0')
        loadTypeData() // 重新加载数据
      } else {
        setMessage(data.message || '迁移失败')
      }
    } catch (error) {
      setMessage('迁移失败')
    } finally {
      setIsMigrating(false)
    }
  }

  // 爆款内容相关函数
  const loadExplosiveContents = async (isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMoreContent(true)
    } else {
      setIsLoading(true)
    }
    
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
      
      // 添加分页参数
      const currentOffset = isLoadMore ? contentPagination.offset : 0
      params.append('limit', contentPagination.limit.toString())
      params.append('offset', currentOffset.toString())
      
      const response = await fetch(`/api/admin/explosive-contents?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        if (isLoadMore) {
          // 加载更多：追加数据，去重处理
          setExplosiveContents(prev => {
            const existingIds = new Set(prev.map((item: ExplosiveContent) => item.id))
            const newItems = data.data.filter((item: ExplosiveContent) => !existingIds.has(item.id))
            return [...prev, ...newItems]
          })
          setContentPagination(prev => ({
            ...prev,
            offset: prev.offset + prev.limit,
            hasMore: data.data.length === prev.limit,
            total: data.total || prev.total
          }))
        } else {
          // 首次加载或筛选：替换数据
          setExplosiveContents(data.data)
          setContentPagination(prev => ({
            ...prev,
            offset: prev.limit,
            hasMore: data.data.length === prev.limit,
            total: data.total || 0
          }))
        }
      } else {
        setMessage(data.message || '获取爆款内容失败')
      }
    } catch (error) {
      setMessage('获取爆款内容失败')
    } finally {
      if (isLoadMore) {
        setIsLoadingMoreContent(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  // 处理加载更多
  const handleLoadMoreContent = () => {
    if (!contentPagination.hasMore || isLoadingMoreContent) return
    loadExplosiveContents(true)
  }

  // 处理筛选条件改变
  const handleFilterChange = (newFilters: Partial<typeof contentFilters>) => {
    setContentFilters({ ...contentFilters, ...newFilters })
    setContentPagination(prev => ({ ...prev, offset: 0, hasMore: true }))
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
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchTerm)}`)
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

  // 用户管理相关状态
  const [showUserManagementModal, setShowUserManagementModal] = useState(false)
  const [selectedUserForManagement, setSelectedUserForManagement] = useState<User | null>(null)
  const [userManagementForm, setUserManagementForm] = useState({
    action: '',
    membershipLevel: 'lite',
    membershipDuration: 'monthly',
    creditsAmount: 0,
    reason: ''
  })

  // 积分使用记录相关状态
  const [showCreditsHistoryModal, setShowCreditsHistoryModal] = useState(false)
  const [selectedUserForCreditsHistory, setSelectedUserForCreditsHistory] = useState<User | null>(null)
  const [creditsHistory, setCreditsHistory] = useState<any[]>([])
  const [creditsHistoryPagination, setCreditsHistoryPagination] = useState({
    limit: 10,
    offset: 0,
    hasMore: true,
    loading: false
  })

  // 快速设置用户为标准会员
  const handleQuickSetMembership = async (userId: string, userEmail: string) => {
    if (!confirm(`确定要将用户 ${userEmail} 设置为标准会员(月付)吗？`)) {
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
          user_id: userId,
          membership_level: 'pro',
          membership_duration: 'monthly',
          reason: '管理员快速设置'
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage(`成功设置用户 ${userEmail} 为标准会员`)
        
        // 通知被操作用户的积分更新（快速设置会员涉及积分变更）
        console.log('🔄 [Admin] 快速设置会员成功，通知用户积分更新')
        
                 // 广播特定用户的积分更新消息
        if (typeof window !== 'undefined') {
          const updateMessage = { 
            type: 'USER_CREDITS_UPDATED', 
            userId: userId,
            action: 'set_membership'
          }
          
          // 优先使用 BroadcastChannel
          if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('credits-updates')
            channel.postMessage(updateMessage)
            channel.close()
            console.log('📢 [Admin] BroadcastChannel已广播用户积分更新消息:', userId)
          } else {
            // 备用方案：使用 PostMessage
            (window as any).postMessage(updateMessage, '*')
            console.log('📢 [Admin] PostMessage已广播用户积分更新消息:', userId)
          }
        }
        
        // 如果管理员也是被操作的用户，刷新管理员自己的积分
        try {
          await refreshBalance()
        } catch (error) {
          console.error('❌ [Admin] 管理员积分刷新失败:', error)
        }
        
        // 重新搜索以更新显示
        if (searchTerm) {
          await handleUserSearch()
        }
      } else {
        setMessage(data.message || '设置会员失败')
      }
    } catch (error) {
      setMessage('设置会员失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 打开用户管理弹窗
  const handleOpenUserManagement = (user: User) => {
    setSelectedUserForManagement(user)
    setUserManagementForm({
      action: '',
      membershipLevel: 'lite',
      membershipDuration: 'monthly',
      creditsAmount: 120, // 默认120积分包
      reason: ''
    })
    setShowUserManagementModal(true)
  }

  // 打开积分使用记录弹窗
  const handleOpenCreditsHistory = (user: User) => {
    setSelectedUserForCreditsHistory(user)
    setCreditsHistory([])
    setCreditsHistoryPagination({
      limit: 10,
      offset: 0,
      hasMore: true,
      loading: false
    })
    setShowCreditsHistoryModal(true)
    // 加载第一页数据
    loadCreditsHistory(user.id, 0)
  }

  // 加载积分使用记录
  const loadCreditsHistory = async (userId: string, offset: number = 0) => {
    setCreditsHistoryPagination(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits-history?limit=10&offset=${offset}`)
      const data = await response.json()
      
      if (data.success) {
        const newTransactions = data.data.transactions
        setCreditsHistory(prev => offset === 0 ? newTransactions : [...prev, ...newTransactions])
        setCreditsHistoryPagination(prev => ({
          ...prev,
          offset: offset + newTransactions.length,
          hasMore: data.data.hasMore,
          loading: false
        }))
      } else {
        setMessage(data.message || '加载积分记录失败')
        setCreditsHistoryPagination(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      setMessage('加载积分记录失败')
      setCreditsHistoryPagination(prev => ({ ...prev, loading: false }))
    }
  }

  // 加载更多积分记录
  const loadMoreCreditsHistory = () => {
    if (selectedUserForCreditsHistory && creditsHistoryPagination.hasMore && !creditsHistoryPagination.loading) {
      loadCreditsHistory(selectedUserForCreditsHistory.id, creditsHistoryPagination.offset)
    }
  }

  // 执行用户管理操作
  const handleUserManagementAction = async () => {
    if (!selectedUserForManagement || !userManagementForm.action) {
      setMessage('请选择操作类型')
      return
    }

    setIsLoading(true)
    try {
      let response
      let successMessage = ''

      switch (userManagementForm.action) {
        case 'cancel_membership':
          response = await fetch('/api/admin/operations/cancel-membership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: selectedUserForManagement.id,
              reason: userManagementForm.reason || '管理员取消会员'
            })
          })
          successMessage = '成功取消用户会员'
          break

        case 'set_membership':
          response = await fetch('/api/admin/operations/set-membership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: selectedUserForManagement.id,
              membership_level: userManagementForm.membershipLevel,
              membership_duration: userManagementForm.membershipDuration,
              reason: userManagementForm.reason || '管理员设置会员'
            })
          })
          const levelNames = { lite: '入门', pro: '标准', premium: '高级' }
          const durationNames = { monthly: '月', yearly: '年' }
          successMessage = `成功设置用户为${levelNames[userManagementForm.membershipLevel as keyof typeof levelNames]}会员(${durationNames[userManagementForm.membershipDuration as keyof typeof durationNames]})`
          break

        case 'grant_credits':
          response = await fetch('/api/admin/operations/grant-credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: selectedUserForManagement.id,
              credits_amount: userManagementForm.creditsAmount,
              reason: userManagementForm.reason || '管理员赠送积分'
            })
          })
          successMessage = `成功为用户赠送 ${userManagementForm.creditsAmount} 积分`
          break

        case 'grant_credit_package':
          response = await fetch('/api/admin/operations/gift-credit-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: selectedUserForManagement.id,
              credits_amount: 120, // 固定120积分包
              reason: userManagementForm.reason || '管理员赠送120积分包'
            })
          })
          successMessage = '成功为用户赠送120积分包'
          break

        default:
          setMessage('无效的操作类型')
          setIsLoading(false)
          return
      }

      const data = await response.json()
      if (data.success) {
        setMessage(successMessage)
        setShowUserManagementModal(false)
        
        // 通知被操作用户的积分更新（如果操作涉及积分变更）
        if (['grant_credits', 'grant_credit_package', 'set_membership', 'cancel_membership'].includes(userManagementForm.action)) {
          console.log('🔄 [Admin] 用户管理操作成功，通知用户积分更新')
          
          // 广播特定用户的积分更新消息
          if (typeof window !== 'undefined') {
            const updateMessage = { 
              type: 'USER_CREDITS_UPDATED', 
              userId: selectedUserForManagement.id,
              action: userManagementForm.action
            }
            
            // 优先使用 BroadcastChannel
            if ('BroadcastChannel' in window) {
              const channel = new BroadcastChannel('credits-updates')
              channel.postMessage(updateMessage)
              channel.close()
              console.log('📢 [Admin] BroadcastChannel已广播用户积分更新消息:', selectedUserForManagement.id)
            } else {
              // 备用方案：使用 PostMessage
              (window as any).postMessage(updateMessage, '*')
              console.log('📢 [Admin] PostMessage已广播用户积分更新消息:', selectedUserForManagement.id)
            }
          }
          
          // 如果管理员也是被操作的用户，刷新管理员自己的积分
          // 这种情况很少见，但为了完整性还是处理一下
          try {
            await refreshBalance()
          } catch (error) {
            console.error('❌ [Admin] 管理员积分刷新失败:', error)
          }
        }
        
        // 重新搜索以更新显示
        if (searchTerm) {
          await handleUserSearch()
        }
      } else {
        setMessage(data.message || '操作失败')
      }
    } catch (error) {
      setMessage('操作失败')
    } finally {
      setIsLoading(false)
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
                        onValueChange={(value) => handleFilterChange({ track_id: value })}
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
                        onValueChange={(value) => handleFilterChange({ type_id: value })}
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
                        onValueChange={(value) => handleFilterChange({ tone_id: value })}
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
                          onChange={(e) => handleFilterChange({ search: e.target.value })}
                        />
                        <Button onClick={() => loadExplosiveContents()} disabled={isLoading}>
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
                  
                  {/* 加载更多按钮 */}
                  {explosiveContents.length > 0 && contentPagination.hasMore && (
                    <div className="flex justify-center mt-6">
                      <Button
                        onClick={handleLoadMoreContent}
                        disabled={isLoadingMoreContent}
                        variant="outline"
                        className="px-8"
                      >
                        {isLoadingMoreContent ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            加载中...
                          </>
                        ) : (
                          '加载更多'
                        )}
                      </Button>
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

              {/* 分类列表 - 表格形式展示ID-名称映射 */}
              <div className="space-y-8">
                {/* 笔记赛道 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-blue-600">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        笔记赛道管理
                      </CardTitle>
                      {noteTrackList.some(track => track.id === 7 && track.name === '其他') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleMigrateOtherTrack}
                          disabled={isMigrating}
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          {isMigrating ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              迁移中...
                            </>
                          ) : (
                            '将"其他"赛道ID改为0'
                          )}
                        </Button>
                      )}
                    </div>
                    <CardDescription>管理笔记的内容赛道分类，每个赛道都有唯一的数字ID</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                              赛道名称
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                              描述
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                              状态
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-blue-800 uppercase tracking-wider">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {noteTrackList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                暂无赛道数据
                              </td>
                            </tr>
                          ) : (
                            noteTrackList.map((track) => (
                              <tr key={track.id} className="hover:bg-blue-25 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    {track.id}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{track.name}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-600 max-w-xs truncate">
                                    {track.description || '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge variant="outline" className="text-green-600 border-green-300">
                                    启用
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  {track.id === 0 ? (
                                    <Badge variant="secondary" className="text-xs text-gray-500">
                                      系统预设
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(track.id, 'track')}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* 笔记类型 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      笔记类型管理
                    </CardTitle>
                    <CardDescription>管理笔记的内容类型分类，每个类型都有唯一的数字ID</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                              类型名称
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                              描述
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                              状态
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-green-800 uppercase tracking-wider">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {noteTypeList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                暂无类型数据
                              </td>
                            </tr>
                          ) : (
                            noteTypeList.map((type) => (
                              <tr key={type.id} className="hover:bg-green-25 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    {type.id}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{type.name}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-600 max-w-xs truncate">
                                    {type.description || '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge variant="outline" className="text-green-600 border-green-300">
                                    启用
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(type.id, 'type')}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* 笔记口吻 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      笔记口吻管理
                    </CardTitle>
                    <CardDescription>管理笔记的表达口吻分类，每个口吻都有唯一的数字ID</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-purple-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">
                              口吻名称
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">
                              描述
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">
                              状态
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-purple-800 uppercase tracking-wider">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {noteToneList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                暂无口吻数据
                              </td>
                            </tr>
                          ) : (
                            noteToneList.map((tone) => (
                              <tr key={tone.id} className="hover:bg-purple-25 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                    {tone.id}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{tone.name}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-600 max-w-xs truncate">
                                    {tone.description || '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge variant="outline" className="text-green-600 border-green-300">
                                    启用
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(tone.id, 'tone')}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
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
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-2">
                        找到 {searchResults.length} 个用户
                      </div>
                      {searchResults.map(user => (
                        <div key={user.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-900 mb-1">
                                {user.email}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                昵称: {user.display_name || '未设置'}
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-600">积分:</span>
                                  <span className="font-semibold text-blue-600">{user.credits}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-600">注册时间:</span>
                                  <span className="text-gray-500">{new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              {/* 会员信息 */}
                              {user.is_active_member && user.membership_level && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="text-sm font-medium text-blue-800 mb-1">
                                    {user.membership_level === 'lite' ? '入门' : user.membership_level === 'pro' ? '标准' : '高级'}会员 
                                    ({user.membership_duration === 'monthly' ? '月付' : '年付'})
                                  </div>
                                  {user.monthly_credits && (
                                    <div className="text-sm text-blue-600">
                                      月额度: {user.monthly_credits} 积分
                                    </div>
                                  )}
                                  {user.membership_end && (
                                    <div className="text-sm text-blue-600 mt-1">
                                      到期时间: {new Date(user.membership_end).toLocaleString()}
                                    </div>
                                  )}
                                  {user.next_credits_reset && (
                                    <div className="text-xs text-blue-500 mt-1">
                                      下次积分重置: {new Date(user.next_credits_reset).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 ml-6">
                              <Badge 
                                variant={user.is_active_member ? "default" : "secondary"}
                                className="px-3 py-1"
                              >
                                {user.is_active_member ? '会员用户' : '普通用户'}
                              </Badge>
                              
                              <div className="flex flex-col gap-1">
                                {!user.is_active_member && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleQuickSetMembership(user.id, user.email)}
                                    className="text-xs px-3 py-1"
                                  >
                                    快速设为标准会员
                                  </Button>
                                )}
                                
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleOpenUserManagement(user)}
                                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700"
                                >
                                  管理用户
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleOpenCreditsHistory(user)}
                                  className="text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  积分记录
                                </Button>
                              </div>
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

          {/* 积分使用记录弹窗 */}
          {showCreditsHistoryModal && selectedUserForCreditsHistory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden m-4">
                <CardHeader>
                  <CardTitle>积分使用记录</CardTitle>
                  <CardDescription>
                    用户: {selectedUserForCreditsHistory.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-y-auto">
                  {creditsHistory.length === 0 && !creditsHistoryPagination.loading ? (
                    <div className="text-center py-8 text-gray-500">暂无积分使用记录</div>
                  ) : (
                    <div className="space-y-3">
                      {creditsHistory.map((transaction, index) => (
                        <div key={transaction.id || index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant={transaction.transaction_type === 'consume' ? 'destructive' : 'default'}
                                  className="text-xs"
                                >
                                  {transaction.transaction_type === 'consume' ? '消耗' : 
                                   transaction.transaction_type === 'reward' ? '获得' : 
                                   transaction.transaction_type === 'refund' ? '退还' : '其他'}
                                </Badge>
                                <span className={`font-semibold ${
                                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount} 积分
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                {transaction.reason}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(transaction.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* 加载更多按钮 */}
                      {creditsHistoryPagination.hasMore && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={loadMoreCreditsHistory}
                            disabled={creditsHistoryPagination.loading}
                            className="w-full"
                          >
                            {creditsHistoryPagination.loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                加载中...
                              </>
                            ) : (
                              '加载更多'
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {/* 加载中状态 */}
                      {creditsHistoryPagination.loading && creditsHistory.length === 0 && (
                        <div className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <div className="text-gray-500">加载积分记录中...</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <div className="flex justify-end gap-2 p-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreditsHistoryModal(false)
                      setSelectedUserForCreditsHistory(null)
                      setCreditsHistory([])
                    }}
                  >
                    关闭
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 用户管理弹窗 */}
          {showUserManagementModal && selectedUserForManagement && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
                <CardHeader>
                  <CardTitle>用户管理</CardTitle>
                  <CardDescription>
                    管理用户: {selectedUserForManagement.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 用户信息显示 */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div><strong>邮箱:</strong> {selectedUserForManagement.email}</div>
                      <div><strong>昵称:</strong> {selectedUserForManagement.display_name || '未设置'}</div>
                      <div><strong>当前积分:</strong> {selectedUserForManagement.credits}</div>
                      <div><strong>会员状态:</strong> {selectedUserForManagement.is_active_member ? '是会员' : '非会员'}</div>
                      {selectedUserForManagement.is_active_member && (
                        <div><strong>会员类型:</strong> {
                          selectedUserForManagement.membership_level === 'lite' ? '入门会员' :
                          selectedUserForManagement.membership_level === 'pro' ? '标准会员' :
                          selectedUserForManagement.membership_level === 'premium' ? '高级会员' : '未知'
                        } ({selectedUserForManagement.membership_duration === 'monthly' ? '月' : '年'})</div>
                      )}
                    </div>
                  </div>

                  {/* 操作类型选择 */}
                  <div>
                    <Label>操作类型</Label>
                    <Select
                      value={userManagementForm.action}
                      onValueChange={(value) => setUserManagementForm({ ...userManagementForm, action: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择操作类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedUserForManagement.is_active_member && (
                          <SelectItem value="cancel_membership">取消会员</SelectItem>
                        )}
                        <SelectItem value="set_membership">设置会员</SelectItem>
                        <SelectItem value="grant_credits">赠送任意积分</SelectItem>
                        <SelectItem value="grant_credit_package">赠送120积分包</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 设置会员选项 */}
                  {userManagementForm.action === 'set_membership' && (
                    <>
                      <div>
                        <Label>会员等级</Label>
                        <Select
                          value={userManagementForm.membershipLevel}
                          onValueChange={(value) => setUserManagementForm({ ...userManagementForm, membershipLevel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lite">入门会员 (100积分/月)</SelectItem>
                            <SelectItem value="pro">标准会员 (250积分/月)</SelectItem>
                            <SelectItem value="premium">高级会员 (600积分/月)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>会员时长</Label>
                        <Select
                          value={userManagementForm.membershipDuration}
                          onValueChange={(value) => setUserManagementForm({ ...userManagementForm, membershipDuration: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">月会员</SelectItem>
                            <SelectItem value="yearly">年会员</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* 赠送积分选项 */}
                  {userManagementForm.action === 'grant_credits' && (
                    <div>
                      <Label>积分数量</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10000"
                        value={userManagementForm.creditsAmount}
                        onChange={(e) => setUserManagementForm({ ...userManagementForm, creditsAmount: parseInt(e.target.value) || 0 })}
                        placeholder="请输入积分数量"
                      />
                    </div>
                  )}

                  {/* 操作原因 */}
                  {userManagementForm.action && (
                    <div>
                      <Label>操作原因 (可选)</Label>
                      <Textarea
                        value={userManagementForm.reason}
                        onChange={(e) => setUserManagementForm({ ...userManagementForm, reason: e.target.value })}
                        placeholder="请输入操作原因..."
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUserManagementModal(false)
                        setSelectedUserForManagement(null)
                      }}
                      disabled={isLoading}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleUserManagementAction}
                      disabled={isLoading || !userManagementForm.action}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          执行中...
                        </>
                      ) : (
                        '确认执行'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 