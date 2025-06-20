"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMySQLAuth } from '@/components/mysql-auth-context'
import { User, Calendar, Settings, List } from 'lucide-react'

export function ProfileStatus() {
  const { user, profile, loading } = useMySQLAuth()

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            用户状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            未登录
          </Badge>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            请先登录查看用户资料
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          用户资料
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              已登录
            </Badge>
          </div>
          
          <div className="text-sm space-y-1">
            <p><strong>邮箱:</strong> {user.email}</p>
            {profile && (
              <>
                <p><strong>显示名称:</strong> {profile.display_name || '未设置'}</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>注册时间: {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <List className="h-3 w-3" />
                  <span>任务数量: {profile.task_indices?.length || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cookie状态 */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Cookie 状态</span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span>状态:</span>
              <Badge variant={profile?.user_cookie ? "default" : "secondary"} className="text-xs">
                {profile?.user_cookie ? '已设置' : '未设置'}
              </Badge>
            </div>
            {profile?.user_cookie && (
              <div className="flex items-center justify-between">
                <span>长度:</span>
                <span className="text-gray-500">{profile.user_cookie.length} 字符</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile数据状态 */}
        <div className="border-t pt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {profile ? (
              <div className="space-y-1">
                <p>✅ Profile 数据已加载</p>
                <p>📊 数据库表: profiles</p>
                <p>🔄 最后更新: {new Date(profile.updated_at).toLocaleString()}</p>
              </div>
            ) : (
              <p>⚠️ Profile 数据加载中或未配置数据库</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 