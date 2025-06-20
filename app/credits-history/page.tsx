'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'
import { useMySQLAuth } from '@/components/mysql-auth-context'
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import type { CreditTransaction } from '@/lib/types'

// 积分账单数据接口
interface CreditHistoryData {
  transactions: CreditTransaction[]
  total: number
  current_balance: number
  summary: {
    total_earned: number
    total_consumed: number
    total_refunded: number
  }
}

// 交易类型配置
const TRANSACTION_TYPES = {
  all: { label: '全部', icon: null },
  reward: { label: '获得积分', icon: TrendingUp, color: 'text-green-600' },
  consume: { label: '消费积分', icon: TrendingDown, color: 'text-red-600' },
  refund: { label: '退款积分', icon: RotateCcw, color: 'text-blue-600' }
}

export default function CreditsHistory() {
  // 获取认证上下文，用于检查登录状态和用户信息
  const { user, profile } = useMySQLAuth()
  
  // 状态管理
  const [data, setData] = useState<CreditHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 筛选条件状态
  const [filters, setFilters] = useState({
    transaction_type: 'all' as 'all' | 'reward' | 'consume' | 'refund',
    start_date: '',
    end_date: '',
    limit: 20,
    offset: 0
  })

  // 获取积分账单数据
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 构建查询参数
      const params = new URLSearchParams()
      if (filters.transaction_type !== 'all') {
        params.append('transaction_type', filters.transaction_type)
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date)
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date)
      }
      params.append('limit', filters.limit.toString())
      params.append('offset', filters.offset.toString())
      
      const response = await fetch(`/api/credits-history?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || '获取数据失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('获取积分账单失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 筛选条件变化时重新获取数据
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, filters.transaction_type, filters.start_date, filters.end_date, filters.offset])

  // 应用筛选
  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: key !== 'offset' ? 0 : (typeof value === 'number' ? value : 0) // 筛选条件变化时重置到第一页
    }))
  }

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      transaction_type: 'all',
      start_date: '',
      end_date: '',
      limit: 20,
      offset: 0
    })
  }

  // 分页处理
  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({ ...prev, offset: newOffset }))
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化积分数量
  const formatCredits = (amount: number) => {
    return amount.toLocaleString()
  }

  // 获取交易类型显示信息
  const getTransactionTypeInfo = (type: string) => {
    return TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES] || TRANSACTION_TYPES.all
  }

  // 未登录状态
  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center pt-20">
          <Card className="w-96 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">需要登录</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                请先登录后查看积分账单记录
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">积分账单</h1>
            <p className="text-gray-600 mt-1">查看您的积分获得、消费和退款记录</p>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <div className="text-red-600 mb-2">获取数据失败</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <Button onClick={fetchData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 数据展示 */}
          {data && (
            <>
              {/* 积分统计概览 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* 当前余额 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">当前余额</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCredits(data.current_balance)}
                        </p>
                      </div>
                      <Coins className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* 总获得积分 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总获得</p>
                        <p className="text-2xl font-bold text-green-600">
                          +{formatCredits(data.summary.total_earned)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* 总消费积分 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总消费</p>
                        <p className="text-2xl font-bold text-red-600">
                          -{formatCredits(data.summary.total_consumed)}
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* 总退款积分 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总退款</p>
                        <p className="text-2xl font-bold text-blue-600">
                          +{formatCredits(data.summary.total_refunded)}
                        </p>
                      </div>
                      <RotateCcw className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 筛选条件 */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    筛选条件
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* 交易类型筛选 */}
                    <div>
                      <Label htmlFor="transaction-type">交易类型</Label>
                      <Select
                        value={filters.transaction_type}
                        onValueChange={(value) => handleFilterChange('transaction_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择交易类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TRANSACTION_TYPES).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 开始日期 */}
                    <div>
                      <Label htmlFor="start-date">开始日期</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                      />
                    </div>

                    {/* 结束日期 */}
                    <div>
                      <Label htmlFor="end-date">结束日期</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                      />
                    </div>

                    {/* 重置按钮 */}
                    <div className="flex items-end">
                      <Button onClick={resetFilters} variant="outline" className="w-full">
                        重置筛选
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 交易记录列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>交易记录</span>
                    <Badge variant="outline">
                      共 {data.total} 条记录
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Coins className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">暂无交易记录</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.transactions.map((transaction) => {
                        const typeInfo = getTransactionTypeInfo(transaction.transaction_type)
                        const Icon = typeInfo.icon
                        
                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {Icon && (
                                <div className="p-2 rounded-full bg-gray-100">
                                  <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {transaction.reason}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(transaction.created_at)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className={`font-bold text-lg ${
                                transaction.transaction_type === 'consume' 
                                  ? 'text-red-600' 
                                  : 'text-green-600'
                              }`}>
                                {transaction.transaction_type === 'consume' ? '-' : '+'}
                                {formatCredits(transaction.amount)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {typeInfo.label}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 分页控制 */}
                  {data.total > filters.limit && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        显示 {filters.offset + 1} - {Math.min(filters.offset + filters.limit, data.total)} 条，
                        共 {data.total} 条记录
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                          disabled={filters.offset === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          上一页
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(filters.offset + filters.limit)}
                          disabled={filters.offset + filters.limit >= data.total}
                        >
                          下一页
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 