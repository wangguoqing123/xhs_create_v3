import { createPool, type PoolConnection } from 'mysql2/promise'
import crypto from 'crypto'
import type { 
  ExplosiveContent, 
  ExplosiveContentInsert, 
  ExplosiveContentUpdate, 
  ExplosiveContentListParams,
  NoteTrack,
  NoteType,
  NoteTone,
  CozeNoteResponse
} from './types'

// MySQL配置检查
const isMySQLConfigured = !!(
  process.env.DATABASE_URL ||
  (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)
)

// 创建数据库连接池
const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'xhs_create_v3',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
})

// 获取安全连接
async function getSafeConnection(): Promise<PoolConnection> {
  try {
    const connection = await pool.getConnection()
    return connection
  } catch (error) {
    console.error('❌ [数据库连接] 获取连接失败:', error)
    throw new Error('数据库连接失败，请检查配置')
  }
}

// ============================================
// 类型维护表相关函数
// ============================================

/**
 * 获取所有笔记赛道
 */
export const getNoteTrackList = async (): Promise<{ data: NoteTrack[]; error: string | null }> => {
  if (!isMySQLConfigured) {
    return { data: [], error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    const [rows] = await connection.execute(
      'SELECT * FROM note_tracks WHERE status = ? ORDER BY id ASC',
      ['enabled']
    ) as any[]
    connection.release()

    return { data: rows as NoteTrack[], error: null }
  } catch (error) {
    console.error('❌ [获取笔记赛道列表] 查询失败:', error)
    return { data: [], error: error instanceof Error ? error.message : '查询失败' }
  }
}

/**
 * 获取所有笔记类型
 */
export const getNoteTypeList = async (): Promise<{ data: NoteType[]; error: string | null }> => {
  if (!isMySQLConfigured) {
    return { data: [], error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    const [rows] = await connection.execute(
      'SELECT * FROM note_types WHERE status = ? ORDER BY id ASC',
      ['enabled']
    ) as any[]
    connection.release()

    return { data: rows as NoteType[], error: null }
  } catch (error) {
    console.error('❌ [获取笔记类型列表] 查询失败:', error)
    return { data: [], error: error instanceof Error ? error.message : '查询失败' }
  }
}

/**
 * 获取所有笔记口吻
 */
export const getNoteToneList = async (): Promise<{ data: NoteTone[]; error: string | null }> => {
  if (!isMySQLConfigured) {
    return { data: [], error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    const [rows] = await connection.execute(
      'SELECT * FROM note_tones WHERE status = ? ORDER BY id ASC',
      ['enabled']
    ) as any[]
    connection.release()

    return { data: rows as NoteTone[], error: null }
  } catch (error) {
    console.error('❌ [获取笔记口吻列表] 查询失败:', error)
    return { data: [], error: error instanceof Error ? error.message : '查询失败' }
  }
}

// ============================================
// 爆款内容相关函数
// ============================================

/**
 * 获取爆款内容列表
 */
export const getNewExplosiveContentList = async (params: ExplosiveContentListParams) => {
  if (!isMySQLConfigured) {
    return { data: [], total: 0, error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    
    // 构建WHERE条件
    const whereConditions: string[] = ['1=1']
    const queryParams: any[] = []
    
    // 赛道筛选
    if (params.track_id && params.track_id.length > 0) {
      whereConditions.push(`ec.track_id IN (${params.track_id.map(() => '?').join(',')})`)
      queryParams.push(...params.track_id)
    }
    
    // 类型筛选
    if (params.type_id && params.type_id.length > 0) {
      whereConditions.push(`ec.type_id IN (${params.type_id.map(() => '?').join(',')})`)
      queryParams.push(...params.type_id)
    }
    
    // 口吻筛选
    if (params.tone_id && params.tone_id.length > 0) {
      whereConditions.push(`ec.tone_id IN (${params.tone_id.map(() => '?').join(',')})`)
      queryParams.push(...params.tone_id)
    }
    
    // 状态筛选
    if (params.status) {
      whereConditions.push('ec.status = ?')
      queryParams.push(params.status)
    }
    
    // 搜索关键词
    if (params.search) {
      whereConditions.push('(ec.title LIKE ? OR ec.content LIKE ?)')
      const searchPattern = `%${params.search}%`
      queryParams.push(searchPattern, searchPattern)
    }
    
    const whereClause = whereConditions.join(' AND ')
    const limit = params.limit || 20
    const offset = params.offset || 0
    
    // 构建完整的SQL查询
    const countSql = `SELECT COUNT(*) as total FROM explosive_contents ec WHERE ${whereClause}`
    const listSql = `SELECT 
        ec.*,
        nt.name as track_name,
        nty.name as type_name,
        nto.name as tone_name
      FROM explosive_contents ec
      LEFT JOIN note_tracks nt ON ec.track_id = nt.id
      LEFT JOIN note_types nty ON ec.type_id = nty.id  
      LEFT JOIN note_tones nto ON ec.tone_id = nto.id
      WHERE ${whereClause} 
      ORDER BY ec.created_at DESC 
      LIMIT ${limit} OFFSET ${offset}`
    
    // 获取总数
    const [countRows] = await connection.execute(countSql, queryParams) as any[]
    const total = countRows[0].total
    
    // 获取列表数据，联查类型表获取名称
    const [rows] = await connection.execute(listSql, queryParams) as any[]
    
    connection.release()
    
    // 解析JSON字段
    const contents = (rows as any[]).map(content => {
      try {
        content.tags = typeof content.tags === 'string' 
          ? JSON.parse(content.tags || '[]')
          : content.tags || []
      } catch (parseError) {
        console.error('❌ [获取爆款内容列表] JSON解析失败:', parseError)
        content.tags = []
      }
      return content
    })
    
    console.log('✅ [获取爆款内容列表] 查询成功:', contents.length, '条记录')
    return { data: contents, total, error: null }
  } catch (error) {
    console.error('❌ [获取爆款内容列表] 查询失败:', error)
    return { data: [], total: 0, error: error instanceof Error ? error.message : '查询失败' }
  }
}

/**
 * 通过ID获取爆款内容
 */
export const getNewExplosiveContentById = async (id: string) => {
  if (!isMySQLConfigured) {
    return { data: null, error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    
    const [rows] = await connection.execute(`
      SELECT 
        ec.*,
        nt.name as track_name,
        nty.name as type_name,
        nto.name as tone_name
      FROM explosive_contents ec
      LEFT JOIN note_tracks nt ON ec.track_id = nt.id
      LEFT JOIN note_types nty ON ec.type_id = nty.id
      LEFT JOIN note_tones nto ON ec.tone_id = nto.id
      WHERE ec.id = ?
    `, [id]) as any[]
    
    connection.release()
    
    if (rows.length === 0) {
      return { data: null, error: '爆款内容不存在' }
    }
    
    const content = rows[0]
    
    // 解析JSON字段
    try {
      content.tags = typeof content.tags === 'string' 
        ? JSON.parse(content.tags || '[]')
        : content.tags || []
    } catch (parseError) {
      console.error('❌ [获取爆款内容] JSON解析失败:', parseError)
      content.tags = []
    }
    
    console.log('✅ [获取爆款内容] 查询成功:', content.id)
    return { data: content, error: null }
  } catch (error) {
    console.error('❌ [获取爆款内容] 查询失败:', error)
    return { data: null, error: error instanceof Error ? error.message : '查询失败' }
  }
}

/**
 * 创建爆款内容
 */
export const createNewExplosiveContent = async (data: ExplosiveContentInsert) => {
  if (!isMySQLConfigured) {
    return { data: null, error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    const contentId = crypto.randomUUID()
    
    // 插入数据
    await connection.execute(`
      INSERT INTO explosive_contents (
        id, title, content, cover_image, original_cover_url,
        author_name, author_id, author_avatar,
        likes_count, collects_count, comments_count,
        track_id, tone_id, type_id,
        note_url, note_id, tags,
        published_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contentId,
      data.title,
      data.content,
      data.cover_image || null,
      data.original_cover_url || null,
      data.author_name || null,
      data.author_id || null,
      data.author_avatar || null,
      data.likes_count || 0,
      data.collects_count || 0,
      data.comments_count || 0,
      data.track_id,
      data.tone_id,
      data.type_id,
      data.note_url || null,
      data.note_id || null,
      JSON.stringify(data.tags || []),
      data.published_at || null,
      data.status || 'enabled'
    ])
    
    // 获取创建的内容
    const result = await getNewExplosiveContentById(contentId)
    connection.release()
    
    if (result.data) {
      console.log('✅ [创建爆款内容] 创建成功:', contentId)
    }
    
    return result
  } catch (error) {
    console.error('❌ [创建爆款内容] 创建失败:', error)
    return { data: null, error: error instanceof Error ? error.message : '创建失败' }
  }
}

/**
 * 更新爆款内容
 */
export const updateNewExplosiveContent = async (id: string, updates: ExplosiveContentUpdate) => {
  if (!isMySQLConfigured) {
    return { data: null, error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    
    // 构建更新字段
    const updateFields: string[] = []
    const updateParams: any[] = []
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'tags') {
          updateFields.push(`${key} = ?`)
          updateParams.push(JSON.stringify(value))
        } else {
          updateFields.push(`${key} = ?`)
          updateParams.push(value)
        }
      }
    })
    
    if (updateFields.length === 0) {
      return { data: null, error: '没有要更新的字段' }
    }
    
    updateParams.push(id)
    
    // 执行更新
    await connection.execute(
      `UPDATE explosive_contents SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    )
    
    // 获取更新后的数据
    const result = await getNewExplosiveContentById(id)
    connection.release()
    
    if (result.data) {
      console.log('✅ [更新爆款内容] 更新成功:', id)
    }
    
    return result
  } catch (error) {
    console.error('❌ [更新爆款内容] 更新失败:', error)
    return { data: null, error: error instanceof Error ? error.message : '更新失败' }
  }
}

/**
 * 删除爆款内容
 */
export const deleteNewExplosiveContent = async (id: string) => {
  if (!isMySQLConfigured) {
    return { success: false, error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    
    const [result] = await connection.execute(
      'DELETE FROM explosive_contents WHERE id = ?',
      [id]
    ) as any[]
    
    connection.release()
    
    if (result.affectedRows > 0) {
      console.log('✅ [删除爆款内容] 删除成功:', id)
      return { success: true, error: null }
    } else {
      return { success: false, error: '爆款内容不存在' }
    }
  } catch (error) {
    console.error('❌ [删除爆款内容] 删除失败:', error)
    return { success: false, error: error instanceof Error ? error.message : '删除失败' }
  }
}

/**
 * 将Coze接口返回的数据转换为数据库插入格式（不包含OSS上传）
 */
export function convertCozeNoteToInsert(cozeData: any, noteUrl: string): ExplosiveContentInsert {
  const noteDetail = cozeData.note_detail
  
  // 解析数字字符串，移除逗号
  const parseCount = (countStr: string): number => {
    return parseInt(countStr.replace(/,/g, '')) || 0
  }
  
  return {
    title: noteDetail.note_display_title || '未设置标题',
    content: noteDetail.note_desc || '',
    cover_image: null, // 先不设置，后续可通过OSS上传
    original_cover_url: noteDetail.note_image_list?.[0] || null,
    author_name: noteDetail.auther_nick_name || null,
    author_id: noteDetail.auther_user_id || null,
    author_avatar: noteDetail.auther_avatar || null,
    likes_count: parseCount(noteDetail.note_liked_count || '0'),
    collects_count: parseCount(noteDetail.collected_count || '0'),
    comments_count: parseCount(noteDetail.comment_count || '0'),
    track_id: cozeData.note_detail1 || 7, // 赛道ID，默认7（其他）
    tone_id: cozeData.kouwen || 0, // 口吻ID，默认0（其他）
    type_id: cozeData.note_type || 0, // 类型ID，默认0（其他）
    note_url: noteUrl,
    note_id: noteDetail.note_id || null,
    tags: noteDetail.note_tags || [],
    published_at: noteDetail.note_create_time || null,
    status: 'enabled'
  }
}

/**
 * 将Coze接口返回的数据转换为数据库插入格式（包含OSS上传）
 */
export async function convertCozeNoteToInsertWithOSS(cozeData: any, noteUrl: string): Promise<ExplosiveContentInsert> {
  const noteDetail = cozeData.note_detail
  
  // 解析数字字符串，移除逗号
  const parseCount = (countStr: string): number => {
    return parseInt(countStr.replace(/,/g, '')) || 0
  }
  
  // 上传封面图到OSS
  let coverImageUrl: string | null = null
  let originalCoverUrl: string | null = null
  
  if (noteDetail.note_image_list?.[0]) {
    originalCoverUrl = noteDetail.note_image_list[0]
    try {
      const { uploadImageToOSS } = await import('./oss')
      coverImageUrl = await uploadImageToOSS(originalCoverUrl!, noteDetail.note_id || 'unknown')
      console.log('✅ [转换笔记数据] 封面图OSS上传成功:', coverImageUrl)
    } catch (error) {
      console.error('❌ [转换笔记数据] 封面图OSS上传失败，使用原始链接:', error)
      coverImageUrl = originalCoverUrl
    }
  }
  
  return {
    title: noteDetail.note_display_title || '未设置标题',
    content: noteDetail.note_desc || '',
    cover_image: coverImageUrl,
    original_cover_url: originalCoverUrl,
    author_name: noteDetail.auther_nick_name || null,
    author_id: noteDetail.auther_user_id || null,
    author_avatar: noteDetail.auther_avatar || null,
    likes_count: parseCount(noteDetail.note_liked_count || '0'),
    collects_count: parseCount(noteDetail.collected_count || '0'),
    comments_count: parseCount(noteDetail.comment_count || '0'),
    track_id: cozeData.note_detail1 || 7, // 赛道ID，默认7（其他）
    tone_id: cozeData.kouwen || 0, // 口吻ID，默认0（其他）
    type_id: cozeData.note_type || 0, // 类型ID，默认0（其他）
    note_url: noteUrl,
    note_id: noteDetail.note_id || null,
    tags: noteDetail.note_tags || [],
    published_at: noteDetail.note_create_time || null,
    status: 'enabled'
  }
}

/**
 * 检查笔记是否已存在（根据note_id）
 */
export const checkNoteExists = async (noteId: string): Promise<{ exists: boolean; error: string | null }> => {
  if (!isMySQLConfigured) {
    return { exists: false, error: '请先配置 MySQL 环境变量' }
  }

  try {
    const connection = await getSafeConnection()
    
    const [rows] = await connection.execute(
      'SELECT id FROM explosive_contents WHERE note_id = ? LIMIT 1',
      [noteId]
    ) as any[]
    
    connection.release()
    
    return { exists: rows.length > 0, error: null }
  } catch (error) {
    console.error('❌ [检查笔记是否存在] 查询失败:', error)
    return { exists: false, error: error instanceof Error ? error.message : '查询失败' }
  }
} 