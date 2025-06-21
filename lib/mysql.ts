import mysql from 'mysql2/promise'
import type { Database, Profile, ProfileUpdate, UserCookie, AccountPositioning, AccountPositioningInsert, AccountPositioningUpdate, AccountPositioningListParams, RewriteRecord, RewriteRecordInsert, RewriteRecordUpdate, RewriteRecordListParams, RewriteGenerationConfig, RewriteGeneratedVersion, CreditHistoryParams } from './types'
import { sendVerificationEmail, isEmailConfigured } from './email'
import crypto from 'crypto'

// MySQL连接配置
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'xhs_create_v3',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  timezone: '+08:00',
  // 增加连接超时时间，处理网络延迟
  acquireTimeout: 120000, // 2分钟获取连接超时
  timeout: 120000, // 2分钟查询超时
  connectTimeout: 60000, // 1分钟连接超时
  // 启用自动重连
  reconnect: true,
  // 设置keep-alive以保持连接活跃
  keepAliveInitialDelay: 0,
  enableKeepAlive: true
}

// 检查环境变量是否已正确配置
const isMySQLConfigured = 
  process.env.DB_HOST && 
  process.env.DB_USER && 
  process.env.DB_PASSWORD && 
  process.env.DB_NAME

// 创建连接池 - 使用全局变量确保单例
let pool: mysql.Pool | null = null
// 连接池预热状态
let isPoolWarmed = false

// 获取连接池实例
export function getPool() {
  // 如果连接池不存在，创建新的连接池
  if (!pool) {
    console.log('🔗 [MySQL] 创建新的连接池')
    pool = mysql.createPool({
      ...mysqlConfig,
      // 等待连接队列，避免立即失败
      waitForConnections: true,
      // 连接池大小 - 适中的大小避免过多连接
      connectionLimit: 15,
      // 队列限制 - 0表示无限制
      queueLimit: 0,
      // 空闲连接超时 - 10分钟后释放空闲连接
      idleTimeout: 600000,
      // 连接最大生存时间 - 1小时后强制重新创建连接
      maxIdle: 10
    })
    
    // 注意：不在这里添加事件监听器，避免类型问题
  }
  
  return pool
}

// 预热连接池 - 在应用启动时建立初始连接
export async function warmupPool() {
  // 如果已经预热过，直接返回
  if (isPoolWarmed) {
    return { success: true, error: null }
  }
  
  // 如果MySQL未配置，跳过预热
  if (!isMySQLConfigured) {
    console.log('⚠️ [MySQL] 环境变量未配置，跳过连接池预热')
    return { success: false, error: '请先配置 MySQL 环境变量' }
  }
  
  try {
    console.log('🔥 [MySQL] 开始预热连接池...')
    const startTime = Date.now()
    
    // 获取连接池实例
    const poolInstance = getPool()
    
    // 尝试建立一个测试连接
    const connection = await poolInstance.getConnection()
    
    // 执行一个简单的查询来确保连接可用
    await connection.ping()
    
    // 立即释放连接回池中
    connection.release()
    
    const duration = Date.now() - startTime
    console.log(`✅ [MySQL] 连接池预热成功，耗时: ${duration}ms`)
    
    // 标记为已预热
    isPoolWarmed = true
    
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ [MySQL] 连接池预热失败:', error)
    
    // 预热失败时重置连接池
    if (pool) {
      try {
        await pool.end()
      } catch (endError) {
        console.error('❌ [MySQL] 关闭连接池时出错:', endError)
      }
      pool = null
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '连接池预热失败' 
    }
  }
}

// 安全获取数据库连接 - 带重试机制
async function getSafeConnection(retries = 3): Promise<mysql.PoolConnection> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 如果连接池未预热，先尝试预热
      if (!isPoolWarmed) {
        console.log(`🔥 [MySQL] 第${attempt}次尝试 - 连接池未预热，开始预热`)
        const warmupResult = await warmupPool()
        if (!warmupResult.success) {
          throw new Error(warmupResult.error || '连接池预热失败')
        }
      }
      
      console.log(`🔗 [MySQL] 第${attempt}次尝试获取数据库连接`)
      const connection = await getPool().getConnection()
      console.log(`✅ [MySQL] 第${attempt}次尝试成功获取连接`)
      return connection
    } catch (error) {
      console.error(`❌ [MySQL] 第${attempt}次获取连接失败:`, error)
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === retries) {
        throw error
      }
      
      // 重试前等待一段时间，递增延迟
      const delay = attempt * 1000
      console.log(`⏳ [MySQL] ${delay}ms后进行第${attempt + 1}次重试`)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // 如果连接池有问题，重置它
      if (pool) {
        try {
          // 不等待关闭完成，直接重置
          pool.end().catch(() => {})
          pool = null
          isPoolWarmed = false
        } catch (resetError) {
          console.error('❌ [MySQL] 重置连接池时出错:', resetError)
        }
      }
    }
  }
  
  // 这里不应该到达，但为了类型安全添加
  throw new Error('获取数据库连接失败，已达到最大重试次数')
}

// 认证相关类型定义
export interface AuthUser {
  id: string
  email: string
  display_name?: string
}

// 数据库连接测试
export const testConnection = async () => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 使用安全连接方法，带重试机制
    const connection = await getSafeConnection()
    // 执行ping测试确保连接可用
    await connection.ping()
    // 立即释放连接回池
    connection.release()
    return { success: true, error: null }
  } catch (error) {
    console.error('MySQL连接测试失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '连接失败' 
    }
  }
}

// 发送邮箱验证码
export const sendVerificationCode = async (email: string) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 使用安全连接方法获取数据库连接
    const connection = await getSafeConnection()
    
    // 调用存储过程生成验证码
    const [results] = await connection.execute(
      'CALL GenerateVerificationCode(?)',
      [email]
    ) as any[]
    
    // 立即释放连接回池
    connection.release()
    
    // 检查存储过程执行结果
    if (results && results[0] && results[0][0]) {
      const { code } = results[0][0]
      
      console.log(`📧 [验证码] 验证码已生成: ${email} -> ${code}`)
      
      // 检查邮件服务是否配置
      if (!isEmailConfigured()) {
        console.warn('⚠️ [验证码] 邮件服务未配置，返回验证码用于开发测试')
        return { 
          success: true, 
          code: process.env.NODE_ENV === 'development' ? code : undefined,
          error: null 
        }
      }
      
      // 发送邮件验证码
      const emailResult = await sendVerificationEmail(email, code)
      
      if (emailResult.success) {
        console.log('✅ [验证码] 邮件发送成功')
        return { 
          success: true, 
          // 开发环境返回验证码，生产环境不返回
          code: process.env.NODE_ENV === 'development' ? code : undefined,
          error: null 
        }
      } else {
        console.error('❌ [验证码] 邮件发送失败:', emailResult.error)
        return { 
          success: false, 
          error: emailResult.error || '发送邮件失败' 
        }
      }
    }
    
    return { success: false, error: '生成验证码失败' }
  } catch (error) {
    console.error('发送验证码失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '发送失败' 
    }
  }
}

// 验证邮箱验证码并登录/注册
export const verifyEmailCode = async (email: string, code: string) => {
  console.log('🔍 [MySQL] 开始验证邮箱验证码:', { email, code })
  
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    console.error('❌ [MySQL] 环境变量未配置')
    return { 
      user: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }
  
  try {
    // 使用安全连接方法获取数据库连接
    const connection = await getSafeConnection()
    
    // 调用存储过程验证验证码
    const [results] = await connection.execute(
      'CALL VerifyEmailCode(?, ?)',
      [email, code]
    ) as any[]
    
    // 立即释放连接回池
    connection.release()
    
    // 检查存储过程执行结果
    if (results && results[0] && results[0][0]) {
      const result = results[0][0]
      
      // 处理无效验证码情况
      if (result.action === 'invalid_code') {
        return { user: null, error: '验证码无效或已过期' }
      }
      
      // 处理验证成功情况
      if (result.id) {
        const user: AuthUser = {
          id: result.id,
          email: result.email,
          display_name: result.display_name
        }
        
        console.log('✅ [MySQL] 验证成功:', { 
          userId: user.id, 
          email: user.email,
          action: result.action 
        })
        
        return { user, error: null }
      }
    }
    
    return { user: null, error: '验证过程中发生错误' }
  } catch (error) {
    console.error('❌ [MySQL] 验证码验证异常:', error)
    return { 
      user: null, 
      error: error instanceof Error ? error.message : '验证过程中发生错误' 
    }
  }
}

// 获取用户资料
export const getProfile = async (userId: string) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 使用安全连接方法获取数据库连接
    const connection = await getSafeConnection()
    
    // 执行查询获取用户资料
    const [rows] = await connection.execute(
      'SELECT * FROM profiles WHERE id = ?',
      [userId]
    ) as any[]
    
    // 立即释放连接回池
    connection.release()
    
    // 处理查询结果
    if (rows.length > 0) {
      const profile = rows[0]
      // 安全解析JSON字段
      if (profile.task_indices && typeof profile.task_indices === 'string' && profile.task_indices.trim()) {
        try {
          profile.task_indices = JSON.parse(profile.task_indices)
        } catch (e) {
          console.warn('无法解析task_indices JSON:', profile.task_indices)
          profile.task_indices = []
        }
      } else {
        profile.task_indices = []
      }
      return { data: profile, error: null }
    }
    
    return { data: null, error: '用户不存在' }
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 更新用户资料
export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    // 构建更新字段
    const fields = []
    const values = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`)
        // 如果是JSON字段，需要序列化
        if (key === 'task_indices' && typeof value === 'object') {
          values.push(JSON.stringify(value))
        } else {
          values.push(value)
        }
      }
    }
    
    if (fields.length === 0) {
      connection.release()
      return { data: null, error: '没有要更新的字段' }
    }
    
    values.push(userId)
    
    await connection.execute(
      `UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    
    // 获取更新后的数据
    const [rows] = await connection.execute(
      'SELECT * FROM profiles WHERE id = ?',
      [userId]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      const profile = rows[0]
      // 安全解析JSON字段
      if (profile.task_indices && typeof profile.task_indices === 'string' && profile.task_indices.trim()) {
        try {
          profile.task_indices = JSON.parse(profile.task_indices)
        } catch (e) {
          console.warn('无法解析task_indices JSON:', profile.task_indices)
          profile.task_indices = []
        }
      } else {
        profile.task_indices = []
      }
      return { data: profile, error: null }
    }
    
    return { data: null, error: '更新失败' }
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '更新失败' 
    }
  }
}

// 更新用户Cookie
export const updateUserCookie = async (userId: string, userCookie: UserCookie) => {
  return updateProfile(userId, { user_cookie: userCookie })
}

// 积分操作
export const consumeCredits = async (userId: string, amount: number, reason: string, taskId?: string) => {
  console.log('💰 [MySQL] 开始扣除积分:', {
    userId,
    amount,
    reason,
    taskId: taskId || 'null'
  })

  if (!isMySQLConfigured) {
    console.error('❌ [MySQL] 环境变量未配置')
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    console.log('✅ [MySQL] 数据库连接获取成功')
    
    const [results] = await connection.execute(
      'CALL ConsumeCredits(?, ?, ?, ?)',
      [userId, amount, reason, taskId || null]
    ) as any[]
    
    connection.release()
    console.log('📊 [MySQL] 存储过程执行完成，结果:', results)
    
    if (results && results[0] && results[0][0]) {
      const result = results[0][0]
      console.log('📋 [MySQL] 积分扣除结果:', result)
      
      return { 
        success: result.success === 1, 
        remainingCredits: result.remaining_credits,
        error: result.success === 1 ? null : '积分不足'
      }
    }
    
    console.error('❌ [MySQL] 存储过程返回结果格式异常')
    return { success: false, error: '积分扣除失败' }
  } catch (error) {
    console.error('❌ [MySQL] 积分扣除异常:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '积分扣除失败' 
    }
  }
}

export const refundCredits = async (userId: string, amount: number, reason: string, taskId?: string) => {
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    const [results] = await connection.execute(
      'CALL RefundCredits(?, ?, ?, ?)',
      [userId, amount, reason, taskId || null]
    ) as any[]
    
    connection.release()
    
    if (results && results[0] && results[0][0]) {
      const result = results[0][0]
      return { 
        success: true, 
        currentCredits: result.current_credits,
        error: null
      }
    }
    
    return { success: false, error: '积分返还失败' }
  } catch (error) {
    console.error('积分返还失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '积分返还失败' 
    }
  }
}

// 获取积分交易记录
export const getCreditTransactions = async (userId: string, limit: number = 50, offset: number = 0) => {
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    // 使用字符串拼接而不是参数绑定来处理LIMIT和OFFSET
    const [rows] = await connection.execute(
      `SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      [userId]
    ) as any[]
    
    connection.release()
    
    return { data: rows, error: null }
  } catch (error) {
    console.error('获取积分记录失败:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 获取积分账单详细信息（支持筛选）
export const getCreditHistory = async (params: CreditHistoryParams) => {
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    const { user_id, transaction_type, start_date, end_date, limit = 20, offset = 0 } = params
    
    // 构建WHERE条件
    let whereConditions = ['user_id = ?']
    let queryParams: any[] = [user_id]
    
    // 交易类型筛选
    if (transaction_type && transaction_type !== 'all') {
      whereConditions.push('transaction_type = ?')
      queryParams.push(transaction_type)
    }
    
    // 时间范围筛选
    if (start_date) {
      whereConditions.push('created_at >= ?')
      queryParams.push(start_date)
    }
    
    if (end_date) {
      whereConditions.push('created_at <= ?')
      queryParams.push(end_date)
    }
    
    const whereClause = whereConditions.join(' AND ')
    
    // 获取交易记录
    const [transactions] = await connection.execute(
      `SELECT * FROM credit_transactions WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      queryParams
    ) as any[]
    
    // 获取总记录数
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM credit_transactions WHERE ${whereClause}`,
      queryParams
    ) as any[]
    
    const total = countResult[0]?.total || 0
    
    // 获取用户当前积分余额
    const profileResult = await getProfile(user_id)
    const currentBalance = profileResult.data?.credits || 0
    
    // 获取积分统计
    const [summaryResult] = await connection.execute(
      `SELECT 
        SUM(CASE WHEN transaction_type = 'reward' THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN transaction_type = 'consume' THEN ABS(amount) ELSE 0 END) as total_consumed,
        SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END) as total_refunded
      FROM credit_transactions WHERE user_id = ?`,
      [user_id]
    ) as any[]
    
    const summary = summaryResult[0] || {
      total_earned: 0,
      total_consumed: 0,
      total_refunded: 0
    }
    
    connection.release()
    
    return {
      data: {
        transactions,
        total,
        current_balance: currentBalance,
        summary: {
          total_earned: summary.total_earned || 0,
          total_consumed: summary.total_consumed || 0,
          total_refunded: summary.total_refunded || 0
        }
      },
      error: null
    }
  } catch (error) {
    console.error('获取积分账单失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '获取积分账单失败' 
    }
  }
}

// 检查配置状态
export const isMySQLReady = () => isMySQLConfigured



// 批量改写系统相关函数

// 创建批量任务
export const createBatchTask = async (userId: string, taskName: string, config: any) => {
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    const taskId = crypto.randomUUID()
    
    await connection.execute(
      'INSERT INTO batch_tasks (id, user_id, task_name, config, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [taskId, userId, taskName, JSON.stringify(config), 'pending']
    )
    
    // 获取创建的任务
    const [rows] = await connection.execute(
      'SELECT * FROM batch_tasks WHERE id = ?',
      [taskId]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      const task = rows[0]
      // 解析JSON字段
      if (task.config && typeof task.config === 'string') {
        try {
          task.config = JSON.parse(task.config)
        } catch (e) {
          console.warn('无法解析config JSON:', task.config)
          task.config = {}
        }
      }
      return { data: task, error: null }
    }
    
    return { data: null, error: '创建任务失败' }
  } catch (error) {
    console.error('创建批量任务失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '创建失败' 
    }
  }
}

// 创建任务笔记关联
export const createTaskNotes = async (taskNotes: Array<{
  task_id: string
  note_id: string
  note_data: any
  status: string
}>) => {
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    const createdNotes = []
    
    for (const noteData of taskNotes) {
      const noteId = crypto.randomUUID()
      
      await connection.execute(
        'INSERT INTO task_notes (id, task_id, note_id, note_data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [noteId, noteData.task_id, noteData.note_id, JSON.stringify(noteData.note_data), noteData.status]
      )
      
      createdNotes.push({
        id: noteId,
        ...noteData
      })
    }
    
    connection.release()
    
    return { data: createdNotes, error: null }
  } catch (error) {
    console.error('创建任务笔记关联失败:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : '创建失败' 
    }
  }
}

// 获取用户的批量任务列表
export const getBatchTasks = async (userId: string, limit: number = 50, offset: number = 0) => {
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    // 使用字符串拼接而不是参数绑定来处理LIMIT和OFFSET
    const [rows] = await connection.execute(
      `SELECT * FROM batch_tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      [userId]
    ) as any[]
    
    connection.release()
    
    // 解析JSON字段
    const tasks = rows.map((task: any) => {
      if (task.config && typeof task.config === 'string') {
        try {
          task.config = JSON.parse(task.config)
        } catch (e) {
          console.warn('无法解析config JSON:', task.config)
          task.config = {}
        }
      }
      return task
    })
    
    return { data: tasks, error: null }
  } catch (error) {
    console.error('获取批量任务列表失败:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 获取任务详情（包含笔记）
export const getBatchTaskWithNotes = async (taskId: string, userId: string) => {
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    // 获取任务信息
    const [taskRows] = await connection.execute(
      'SELECT * FROM batch_tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    ) as any[]
    
    if (taskRows.length === 0) {
      connection.release()
      return { data: null, error: '任务不存在' }
    }
    
    const task = taskRows[0]
    
    // 解析任务配置
    if (task.config && typeof task.config === 'string') {
      try {
        task.config = JSON.parse(task.config)
      } catch (e) {
        console.warn('无法解析config JSON:', task.config)
        task.config = {}
      }
    }
    
    // 获取任务相关的笔记
    const [noteRows] = await connection.execute(
      'SELECT * FROM task_notes WHERE task_id = ? ORDER BY created_at',
      [taskId]
    ) as any[]
    
    // 解析笔记数据
    const notes = noteRows.map((note: any) => {
      if (note.note_data && typeof note.note_data === 'string') {
        try {
          note.note_data = JSON.parse(note.note_data)
        } catch (e) {
          console.warn('无法解析note_data JSON:', note.note_data)
          note.note_data = {}
        }
      }
      return note
    })
    
    connection.release()
    
    return { 
      data: {
        ...task,
        notes
      }, 
      error: null 
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 更新任务状态
export const updateBatchTaskStatus = async (taskId: string, status: string, errorMessage?: string) => {
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    const updateFields = ['status = ?', 'updated_at = NOW()']
    const updateValues = [status]
    
    if (status === 'completed') {
      updateFields.push('completed_at = NOW()')
    }
    
    if (errorMessage) {
      updateFields.push('error_message = ?')
      updateValues.push(errorMessage)
    }
    
    updateValues.push(taskId)
    
    await connection.execute(
      `UPDATE batch_tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    connection.release()
    
    return { success: true, error: null }
  } catch (error) {
    console.error('更新任务状态失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '更新失败' 
    }
  }
}

// 获取任务笔记列表
export const getTaskNotes = async (taskId: string, status?: string) => {
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    let query = 'SELECT * FROM task_notes WHERE task_id = ?'
    const params = [taskId]
    
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    
    query += ' ORDER BY created_at'
    
    const [rows] = await connection.execute(query, params) as any[]
    
    connection.release()
    
    // 解析JSON字段
    const notes = rows.map((note: any) => {
      if (note.note_data && typeof note.note_data === 'string') {
        try {
          note.note_data = JSON.parse(note.note_data)
        } catch (e) {
          console.warn('无法解析note_data JSON:', note.note_data)
          note.note_data = {}
        }
      }
      return note
    })
    
    return { data: notes, error: null }
  } catch (error) {
    console.error('获取任务笔记失败:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 更新任务笔记状态
export const updateTaskNoteStatus = async (noteId: string, status: string, errorMessage?: string) => {
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    const updateFields = ['status = ?', 'updated_at = NOW()']
    const updateValues = [status]
    
    if (errorMessage) {
      updateFields.push('error_message = ?')
      updateValues.push(errorMessage)
    }
    
    updateValues.push(noteId)
    
    await connection.execute(
      `UPDATE task_notes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    connection.release()
    
    return { success: true, error: null }
  } catch (error) {
    console.error('更新任务笔记状态失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '更新失败' 
    }
  }
}

// 创建生成内容记录
export const createGeneratedContent = async (taskNoteId: string, contentType: string, config: any) => {
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    const contentId = crypto.randomUUID()
    
    await connection.execute(
      'INSERT INTO generated_contents (id, task_note_id, content_type, generation_config, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [contentId, taskNoteId, contentType, JSON.stringify(config), 'generating']
    )
    
    // 获取创建的内容记录
    const [rows] = await connection.execute(
      'SELECT * FROM generated_contents WHERE id = ?',
      [contentId]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      const content = rows[0]
      // 解析JSON字段
      if (content.generation_config && typeof content.generation_config === 'string') {
        try {
          content.generation_config = JSON.parse(content.generation_config)
        } catch (e) {
          console.warn('无法解析generation_config JSON:', content.generation_config)
          content.generation_config = {}
        }
      }
      return { data: content, error: null }
    }
    
    return { data: null, error: '创建生成内容记录失败' }
  } catch (error) {
    console.error('创建生成内容记录失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '创建失败' 
    }
  }
}

// 更新生成内容
export const updateGeneratedContent = async (contentId: string, updates: {
  title?: string
  content?: string
  status?: string
  error_message?: string
  completed_at?: string
}) => {
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    const updateFields = ['updated_at = NOW()']
    const updateValues = []
    
    if (updates.title !== undefined) {
      updateFields.push('title = ?')
      updateValues.push(updates.title)
    }
    
    if (updates.content !== undefined) {
      updateFields.push('content = ?')
      updateValues.push(updates.content)
    }
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(updates.status)
    }
    
    if (updates.error_message !== undefined) {
      updateFields.push('error_message = ?')
      updateValues.push(updates.error_message)
    }
    
    if (updates.completed_at !== undefined) {
      updateFields.push('completed_at = ?')
      // 将ISO 8601格式转换为MySQL datetime格式
      const mysqlDateTime = new Date(updates.completed_at).toISOString().slice(0, 19).replace('T', ' ')
      updateValues.push(mysqlDateTime)
    }
    
    updateValues.push(contentId)
    
    await connection.execute(
      `UPDATE generated_contents SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    connection.release()
    
    return { success: true, error: null }
  } catch (error) {
    console.error('更新生成内容失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '更新失败' 
    }
  }
}

// 获取任务笔记和生成内容（用于状态查询）
export const getTaskNotesWithContents = async (taskId: string) => {
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    const connection = await getPool().getConnection()
    
    // 获取任务笔记
    const [noteRows] = await connection.execute(
      'SELECT * FROM task_notes WHERE task_id = ? ORDER BY created_at',
      [taskId]
    ) as any[]
    
    // 为每个笔记获取生成内容
    const notesWithContents = []
    
    for (const note of noteRows) {
      // 解析笔记数据
      if (note.note_data && typeof note.note_data === 'string') {
        try {
          note.note_data = JSON.parse(note.note_data)
        } catch (e) {
          console.warn('无法解析note_data JSON:', note.note_data)
          note.note_data = {}
        }
      }
      
      // 获取该笔记的生成内容
      const [contentRows] = await connection.execute(
        'SELECT * FROM generated_contents WHERE task_note_id = ? ORDER BY created_at',
        [note.id]
      ) as any[]
      
      // 解析生成内容配置
      const contents = contentRows.map((content: any) => {
        if (content.generation_config && typeof content.generation_config === 'string') {
          try {
            content.generation_config = JSON.parse(content.generation_config)
          } catch (e) {
            console.warn('无法解析generation_config JSON:', content.generation_config)
            content.generation_config = {}
          }
        }
        return content
      })
      
      notesWithContents.push({
        ...note,
        generated_contents: contents
      })
    }
    
    connection.release()
    
    return { data: notesWithContents, error: null }
  } catch (error) {
    console.error('获取任务笔记和生成内容失败:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// ==================== 账号定位相关函数 ====================

// 创建账号定位
export const createAccountPositioning = async (data: AccountPositioningInsert) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 生成UUID作为主键
    const id = crypto.randomUUID()
    
    // 插入账号定位记录
    await connection.execute(
      `INSERT INTO account_positioning 
       (id, user_id, name, one_line_description, core_value, target_audience, key_persona, core_style) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.user_id,
        data.name,
        data.one_line_description || null,
        data.core_value || null,
        data.target_audience || null,
        data.key_persona || null,
        data.core_style || null
      ]
    )
    
    // 查询创建的记录
    const [rows] = await connection.execute(
      'SELECT * FROM account_positioning WHERE id = ?',
      [id]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      return { data: rows[0] as AccountPositioning, error: null }
    }
    
    return { data: null, error: '创建账号定位失败' }
  } catch (error) {
    console.error('创建账号定位失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '创建失败' 
    }
  }
}

// 获取用户的账号定位列表
export const getAccountPositioningList = async (params: AccountPositioningListParams) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 设置默认值
    const limit = params.limit || 20
    const offset = params.offset || 0
    
    // 构建查询条件
    let whereClause = 'WHERE user_id = ?'
    const queryParams: any[] = [params.user_id]
    
    // 如果有搜索关键词，添加搜索条件
    if (params.search && params.search.trim()) {
      whereClause += ' AND name LIKE ?'
      queryParams.push(`%${params.search.trim()}%`)
    }
    
    // 执行查询，按创建时间倒序排列
    const [rows] = await connection.execute(
      `SELECT * FROM account_positioning ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      queryParams
    ) as any[]
    
    // 查询总数
    const [countRows] = await connection.execute(
      `SELECT COUNT(*) as total FROM account_positioning ${whereClause}`,
      queryParams
    ) as any[]
    
    connection.release()
    
    const total = countRows[0]?.total || 0
    
    return { 
      data: rows as AccountPositioning[], 
      total,
      error: null 
    }
  } catch (error) {
    console.error('获取账号定位列表失败:', error)
    return { 
      data: [], 
      total: 0,
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 根据ID获取单个账号定位
export const getAccountPositioningById = async (id: string, userId: string) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 查询指定ID和用户ID的账号定位（确保用户只能访问自己的数据）
    const [rows] = await connection.execute(
      'SELECT * FROM account_positioning WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      return { data: rows[0] as AccountPositioning, error: null }
    }
    
    return { data: null, error: '账号定位不存在或无权限访问' }
  } catch (error) {
    console.error('获取账号定位失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 更新账号定位
export const updateAccountPositioning = async (id: string, userId: string, updates: AccountPositioningUpdate) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 构建更新字段
    const updateFields = []
    const updateValues = []
    
    // 检查每个字段是否需要更新
    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(updates.name)
    }
    
    if (updates.one_line_description !== undefined) {
      updateFields.push('one_line_description = ?')
      updateValues.push(updates.one_line_description)
    }
    
    if (updates.core_value !== undefined) {
      updateFields.push('core_value = ?')
      updateValues.push(updates.core_value)
    }
    
    if (updates.target_audience !== undefined) {
      updateFields.push('target_audience = ?')
      updateValues.push(updates.target_audience)
    }
    
    if (updates.key_persona !== undefined) {
      updateFields.push('key_persona = ?')
      updateValues.push(updates.key_persona)
    }
    
    if (updates.core_style !== undefined) {
      updateFields.push('core_style = ?')
      updateValues.push(updates.core_style)
    }
    
    // 如果没有要更新的字段，返回错误
    if (updateFields.length === 0) {
      connection.release()
      return { data: null, error: '没有要更新的字段' }
    }
    
    // 添加WHERE条件的参数
    updateValues.push(id, userId)
    
    // 执行更新（确保用户只能更新自己的数据）
    const [result] = await connection.execute(
      `UPDATE account_positioning SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    ) as any[]
    
    // 检查是否有记录被更新
    if (result.affectedRows === 0) {
      connection.release()
      return { data: null, error: '账号定位不存在或无权限修改' }
    }
    
    // 查询更新后的记录
    const [rows] = await connection.execute(
      'SELECT * FROM account_positioning WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      return { data: rows[0] as AccountPositioning, error: null }
    }
    
    return { data: null, error: '更新后查询失败' }
  } catch (error) {
    console.error('更新账号定位失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '更新失败' 
    }
  }
}

// 删除账号定位
export const deleteAccountPositioning = async (id: string, userId: string) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 执行删除（确保用户只能删除自己的数据）
    const [result] = await connection.execute(
      'DELETE FROM account_positioning WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as any[]
    
    connection.release()
    
    // 检查是否有记录被删除
    if (result.affectedRows === 0) {
      return { success: false, error: '账号定位不存在或无权限删除' }
    }
    
    return { success: true, error: null }
  } catch (error) {
    console.error('删除账号定位失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '删除失败' 
    }
  }
}

// ============================================
// 爆文改写记录相关函数
// ============================================

// 创建爆文改写记录
export const createRewriteRecord = async (data: RewriteRecordInsert) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    console.log('🚀 [创建爆文改写记录] 开始创建记录:', {
      userId: data.user_id,
      originalTextLength: data.original_text.length,
      sourceType: data.source_type,
      creditsConsumed: data.credits_consumed
    })
    
    // 生成UUID作为记录ID
    const recordId = crypto.randomUUID()
    
    // 插入新记录（显式指定ID）
    const [result] = await connection.execute(
      `INSERT INTO rewrite_records 
       (id, user_id, original_text, source_url, source_type, generation_config, credits_consumed) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        data.user_id,
        data.original_text,
        data.source_url || null,
        data.source_type,
        JSON.stringify(data.generation_config), // 将配置对象转换为JSON字符串
        data.credits_consumed
      ]
    ) as any[]
    
    // 查询刚插入的完整记录
    const [rows] = await connection.execute(
      'SELECT * FROM rewrite_records WHERE id = ?',
      [recordId]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      const record = rows[0]
      
      // 安全解析JSON字段，处理可能的对象类型
      try {
        // 如果已经是对象，直接使用；如果是字符串，则解析
        record.generation_config = typeof record.generation_config === 'string' 
          ? JSON.parse(record.generation_config || '{}')
          : record.generation_config || {}
          
        record.generated_content = typeof record.generated_content === 'string'
          ? JSON.parse(record.generated_content || '[]')
          : record.generated_content || []
      } catch (parseError) {
        console.error('❌ [创建爆文改写记录] JSON解析失败:', parseError)
        console.error('❌ [创建爆文改写记录] 原始数据类型:', {
          generationConfigType: typeof record.generation_config,
          generationConfigValue: record.generation_config,
          generatedContentType: typeof record.generated_content,
          generatedContentValue: record.generated_content
        })
        // 使用默认值
        record.generation_config = {}
        record.generated_content = []
      }
      
      console.log('✅ [创建爆文改写记录] 记录创建成功:', record.id)
      return { data: record as RewriteRecord, error: null }
    }
    
    return { data: null, error: '创建后查询失败' }
  } catch (error) {
    console.error('❌ [创建爆文改写记录] 创建失败:', error)
    console.error('❌ [创建爆文改写记录] 详细错误信息:', {
      errorMessage: error instanceof Error ? error.message : '未知错误',
      errorStack: error instanceof Error ? error.stack : '无堆栈信息',
      insertData: {
        userId: data.user_id,
        originalTextLength: data.original_text.length,
        sourceType: data.source_type,
        generationConfig: data.generation_config,
        creditsConsumed: data.credits_consumed
      }
    })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '创建失败' 
    }
  }
}

// 更新爆文改写记录
export const updateRewriteRecord = async (recordId: string, updates: RewriteRecordUpdate) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    console.log('🔄 [更新爆文改写记录] 开始更新记录:', {
      recordId,
      status: updates.status,
      hasGeneratedContent: !!updates.generated_content
    })
    
    // 构建更新字段
    const updateFields = []
    const updateValues = []
    
    // 检查每个字段是否需要更新
    if (updates.generated_content !== undefined) {
      updateFields.push('generated_content = ?')
      updateValues.push(JSON.stringify(updates.generated_content)) // 将数组转换为JSON字符串
    }
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(updates.status)
    }
    
    if (updates.error_message !== undefined) {
      updateFields.push('error_message = ?')
      updateValues.push(updates.error_message)
    }
    
    if (updates.completed_at !== undefined) {
      updateFields.push('completed_at = ?')
      // 将ISO字符串转换为MySQL DATETIME格式
      const mysqlDateTime = updates.completed_at ? new Date(updates.completed_at).toISOString().slice(0, 19).replace('T', ' ') : null
      console.log('🕐 [更新爆文改写记录] 日期时间转换:', {
        original: updates.completed_at,
        converted: mysqlDateTime
      })
      updateValues.push(mysqlDateTime)
    }
    
    // 如果没有要更新的字段，返回错误
    if (updateFields.length === 0) {
      connection.release()
      return { data: null, error: '没有要更新的字段' }
    }
    
    // 添加WHERE条件的参数
    updateValues.push(recordId)
    
    // 执行更新
    const [result] = await connection.execute(
      `UPDATE rewrite_records SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    ) as any[]
    
    // 检查是否有记录被更新
    if (result.affectedRows === 0) {
      connection.release()
      return { data: null, error: '记录不存在' }
    }
    
    // 查询更新后的记录
    const [rows] = await connection.execute(
      'SELECT * FROM rewrite_records WHERE id = ?',
      [recordId]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      const record = rows[0]
      
      // 安全解析JSON字段，处理可能的对象类型
      try {
        // 如果已经是对象，直接使用；如果是字符串，则解析
        record.generation_config = typeof record.generation_config === 'string' 
          ? JSON.parse(record.generation_config || '{}')
          : record.generation_config || {}
          
        record.generated_content = typeof record.generated_content === 'string'
          ? JSON.parse(record.generated_content || '[]')
          : record.generated_content || []
      } catch (parseError) {
        console.error('❌ [更新爆文改写记录] JSON解析失败:', parseError)
        // 使用默认值
        record.generation_config = {}
        record.generated_content = []
      }
      
      console.log('✅ [更新爆文改写记录] 记录更新成功:', record.id)
      return { data: record as RewriteRecord, error: null }
    }
    
    return { data: null, error: '更新后查询失败' }
  } catch (error) {
    console.error('❌ [更新爆文改写记录] 更新失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '更新失败' 
    }
  }
}

// 根据ID获取单个爆文改写记录
export const getRewriteRecordById = async (recordId: string, userId: string) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 查询指定ID和用户ID的记录（确保用户只能访问自己的数据）
    const [rows] = await connection.execute(
      'SELECT * FROM rewrite_records WHERE id = ? AND user_id = ?',
      [recordId, userId]
    ) as any[]
    
    connection.release()
    
    if (rows.length > 0) {
      const record = rows[0]
      
      // 安全解析JSON字段，处理可能的对象类型
      try {
        // 如果已经是对象，直接使用；如果是字符串，则解析
        record.generation_config = typeof record.generation_config === 'string' 
          ? JSON.parse(record.generation_config || '{}')
          : record.generation_config || {}
          
        record.generated_content = typeof record.generated_content === 'string'
          ? JSON.parse(record.generated_content || '[]')
          : record.generated_content || []
      } catch (parseError) {
        console.error('❌ [获取爆文改写记录] JSON解析失败:', parseError)
        // 使用默认值
        record.generation_config = {}
        record.generated_content = []
      }
      
      return { data: record as RewriteRecord, error: null }
    }
    
    return { data: null, error: '记录不存在或无权限访问' }
  } catch (error) {
    console.error('❌ [获取爆文改写记录] 获取失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 获取爆文改写记录列表
export const getRewriteRecordList = async (params: RewriteRecordListParams) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      total: 0,
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 设置默认值并确保类型正确
    const limit = Number(params.limit) || 20
    const offset = Number(params.offset) || 0
    const userId = String(params.user_id)
    
    console.log('🔍 [获取爆文改写记录列表] 开始查询:', {
      userId,
      limit,
      offset,
      limitType: typeof limit,
      offsetType: typeof offset,
      userIdType: typeof userId,
      isLimitNaN: isNaN(limit),
      isOffsetNaN: isNaN(offset)
    })
    
    // 验证参数
    if (isNaN(limit) || isNaN(offset) || limit < 0 || offset < 0) {
      console.error('❌ [获取爆文改写记录列表] 参数验证失败:', { limit, offset })
      return { 
        data: [], 
        total: 0,
        error: '分页参数无效' 
      }
    }
    
    // 先尝试最简单的查询
    const [countRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM rewrite_records WHERE user_id = ?',
      [userId]
    ) as any[]
    
    const total = countRows[0].total
    console.log('📊 [获取爆文改写记录列表] 总记录数:', total)
    
    // 查询记录列表 - 先尝试不带分页的查询
    console.log('🔍 [获取爆文改写记录列表] 执行查询，参数:', [userId])
    const [rows] = await connection.execute(
      'SELECT * FROM rewrite_records WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    ) as any[]
    
    // 手动应用分页
    const paginatedRows = rows.slice(offset, offset + limit)
    
    console.log('📋 [获取爆文改写记录列表] 查询到记录数:', rows.length)
    console.log('📋 [获取爆文改写记录列表] 分页后记录数:', paginatedRows.length)
    
    connection.release()
    
    // 安全解析JSON字段
    const records = paginatedRows.map((record: any) => {
      try {
        // 如果已经是对象，直接使用；如果是字符串，则解析
        record.generation_config = typeof record.generation_config === 'string' 
          ? JSON.parse(record.generation_config || '{}')
          : record.generation_config || {}
          
        record.generated_content = typeof record.generated_content === 'string'
          ? JSON.parse(record.generated_content || '[]')
          : record.generated_content || []
      } catch (parseError) {
        console.error('❌ [获取爆文改写记录列表] JSON解析失败:', parseError)
        // 使用默认值
        record.generation_config = {}
        record.generated_content = []
      }
      return record as RewriteRecord
    })
    
    console.log('✅ [获取爆文改写记录列表] 查询成功:', records.length, '条记录')
    return { data: records, total, error: null }
  } catch (error) {
    console.error('❌ [获取爆文改写记录列表] 获取失败:', error)
    return { 
      data: [], 
      total: 0,
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// ============================================
// 会员管理相关函数
// ============================================

// 管理员认证
export const authenticateAdmin = async (username: string, password: string) => {
  // 简单的硬编码认证
  if (username === 'admin' && password === '520120') {
    return { success: true, error: null }
  }
  return { success: false, error: '用户名或密码错误' }
}

// 搜索用户（管理后台使用）
export const searchUsers = async (searchTerm: string, limit: number = 20) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 查询用户基本信息和积分
    const query = `
      SELECT 
        u.id,
        u.email,
        COALESCE(p.display_name, '') as display_name,
        COALESCE(p.credits, 0) as credits,
        u.created_at,
        NULL as membership_type,
        NULL as membership_status,
        NULL as membership_end,
        FALSE as is_active_member
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.email LIKE ? OR (p.display_name IS NOT NULL AND p.display_name LIKE ?)
      ORDER BY u.created_at DESC
      LIMIT ${limit}
    `
    
    const searchPattern = `%${searchTerm}%`
    console.log('🔍 [搜索用户] 查询参数:', { searchPattern, limit })
    
    // 搜索用户
    const [rows] = await connection.execute(query, [searchPattern, searchPattern])
    
    connection.release()
    
    console.log('✅ [搜索用户] 搜索成功:', (rows as any[]).length, '条记录')
    return { data: rows as any[], error: null }
  } catch (error) {
    console.error('❌ [搜索用户] 搜索失败:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : '搜索失败' 
    }
  }
}

// 获取用户会员状态
export const getUserMembershipStatus = async (userId: string) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: null, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 使用视图查询用户会员状态
    const [rows] = await connection.execute(
      'SELECT * FROM user_membership_status WHERE user_id = ?',
      [userId]
    )
    
    connection.release()
    
    if ((rows as any[]).length > 0) {
      return { data: (rows as any[])[0], error: null }
    }
    
    return { data: null, error: '用户不存在' }
  } catch (error) {
    console.error('❌ [获取用户会员状态] 获取失败:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 管理员直接赠送积分
export const adminGrantCredits = async (
  userId: string, 
  creditsAmount: number, 
  adminUser: string, 
  reason?: string,
  ipAddress?: string,
  userAgent?: string
) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 调用存储过程
    const [result] = await connection.execute(
      'CALL GrantCredits(?, ?, ?, ?)',
      [userId, creditsAmount, adminUser, reason || '管理员直接赠送积分']
    )
    
    connection.release()
    
    console.log('✅ [管理员赠送积分] 操作成功:', { userId, creditsAmount, adminUser })
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ [管理员赠送积分] 操作失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '操作失败' 
    }
  }
}

// 管理员设置用户为月会员
export const adminSetMonthlyMembership = async (
  userId: string, 
  adminUser: string, 
  reason?: string,
  ipAddress?: string,
  userAgent?: string
) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 调用存储过程
    const [result] = await connection.execute(
      'CALL SetMonthlyMembership(?, ?, ?)',
      [userId, adminUser, reason || '管理员设置月会员']
    )
    
    connection.release()
    
    console.log('✅ [管理员设置月会员] 操作成功:', { userId, adminUser })
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ [管理员设置月会员] 操作失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '操作失败' 
    }
  }
}

// 管理员设置用户为年会员
export const adminSetYearlyMembership = async (
  userId: string, 
  adminUser: string, 
  reason?: string,
  ipAddress?: string,
  userAgent?: string
) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 调用存储过程
    const [result] = await connection.execute(
      'CALL SetYearlyMembership(?, ?, ?)',
      [userId, adminUser, reason || '管理员设置年会员']
    )
    
    connection.release()
    
    console.log('✅ [管理员设置年会员] 操作成功:', { userId, adminUser })
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ [管理员设置年会员] 操作失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '操作失败' 
    }
  }
}

// 管理员赠送积分包
export const adminGrantCreditPackage = async (
  userId: string, 
  creditsAmount: number, 
  adminUser: string, 
  reason?: string,
  ipAddress?: string,
  userAgent?: string
) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 调用存储过程
    const [result] = await connection.execute(
      'CALL GrantCreditPackage(?, ?, ?, ?)',
      [userId, creditsAmount, adminUser, reason || '管理员赠送积分包']
    )
    
    connection.release()
    
    console.log('✅ [管理员赠送积分包] 操作成功:', { userId, creditsAmount, adminUser })
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ [管理员赠送积分包] 操作失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '操作失败' 
    }
  }
}

// 获取管理员操作日志
export const getAdminOperationLogs = async (limit: number = 50, offset: number = 0) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      data: [], 
      total: 0,
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 获取总数
    const [countRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM admin_operation_logs'
    ) as any[]
    
    const total = countRows[0].total
    
    // 获取日志列表
    const [rows] = await connection.execute(`
      SELECT 
        aol.*,
        u.email as target_user_email_current
      FROM admin_operation_logs aol
      LEFT JOIN users u ON aol.target_user_id = u.id
      ORDER BY aol.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])
    
    connection.release()
    
    // 解析JSON字段
    const logs = (rows as any[]).map(log => {
      try {
        log.operation_details = typeof log.operation_details === 'string' 
          ? JSON.parse(log.operation_details || '{}')
          : log.operation_details || {}
      } catch (parseError) {
        console.error('❌ [获取管理员操作日志] JSON解析失败:', parseError)
        log.operation_details = {}
      }
      return log
    })
    
    console.log('✅ [获取管理员操作日志] 查询成功:', logs.length, '条记录')
    return { data: logs, total, error: null }
  } catch (error) {
    console.error('❌ [获取管理员操作日志] 获取失败:', error)
    return { 
      data: [], 
      total: 0,
      error: error instanceof Error ? error.message : '获取失败' 
    }
  }
}

// 执行年会员每月积分发放（定时任务使用）
export const grantYearlyMemberMonthlyCredits = async () => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      success: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 调用存储过程
    const [result] = await connection.execute('CALL GrantYearlyMemberMonthlyCredits()')
    
    connection.release()
    
    console.log('✅ [年会员每月积分发放] 执行成功:', result)
    return { success: true, error: null, result }
  } catch (error) {
    console.error('❌ [年会员每月积分发放] 执行失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '执行失败' 
    }
  }
}

// 检查用户是否为会员（用于积分包购买限制）
export const checkUserMembership = async (userId: string) => {
  // 检查MySQL配置
  if (!isMySQLConfigured) {
    return { 
      isMember: false, 
      error: '请先配置 MySQL 环境变量' 
    }
  }

  try {
    // 获取安全连接
    const connection = await getSafeConnection()
    
    // 检查用户是否有活跃的会员身份
    const [rows] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM memberships 
      WHERE user_id = ? AND status = 'active' AND end_date > CURRENT_TIMESTAMP
    `, [userId])
    
    connection.release()
    
    const isMember = (rows as any[])[0].count > 0
    
    return { isMember, error: null }
  } catch (error) {
    console.error('❌ [检查用户会员身份] 检查失败:', error)
    return { 
      isMember: false, 
      error: error instanceof Error ? error.message : '检查失败' 
    }
  }
}

export default {
  testConnection,
  sendVerificationCode,
  verifyEmailCode,
  getProfile,
  updateProfile,
  updateUserCookie,
  consumeCredits,
  refundCredits,
  getCreditTransactions,
  isMySQLReady,
  createBatchTask,
  createTaskNotes,
  getBatchTasks,
  getBatchTaskWithNotes,
  updateBatchTaskStatus,
  getTaskNotes,
  updateTaskNoteStatus,
  createGeneratedContent,
  updateGeneratedContent,
  getTaskNotesWithContents,
  // 账号定位相关函数
  createAccountPositioning,
  getAccountPositioningList,
  getAccountPositioningById,
  updateAccountPositioning,
  deleteAccountPositioning,
  // 爆文改写记录相关函数
  createRewriteRecord,
  updateRewriteRecord,
  getRewriteRecordById,
  getRewriteRecordList,
  // 会员管理相关函数
  authenticateAdmin,
  searchUsers,
  getUserMembershipStatus,
  adminGrantCredits,
  adminSetMonthlyMembership,
  adminSetYearlyMembership,
  adminGrantCreditPackage,
  getAdminOperationLogs,
  grantYearlyMemberMonthlyCredits,
  checkUserMembership
} 