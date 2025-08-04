import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPool } from '@/lib/mysql'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// POST方法：将现有的"其他"赛道从ID=7迁移到ID=0
export async function POST(request: NextRequest) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    const connection = await getPool().getConnection()
    
    try {
      // 开始事务
      await connection.beginTransaction()

      // 1. 检查是否存在名为"其他"且ID为7的赛道
      const [existingOtherTrack] = await connection.execute(
        'SELECT * FROM note_tracks WHERE name = ? AND id = ?',
        ['其他', 7]
      ) as any[]

      if (existingOtherTrack.length === 0) {
        await connection.rollback()
        return NextResponse.json(
          { success: false, message: '未找到ID为7的"其他"赛道' },
          { status: 404 }
        )
      }

      // 2. 检查ID为0是否已被占用
      const [existingZeroId] = await connection.execute(
        'SELECT * FROM note_tracks WHERE id = 0'
      ) as any[]

      if (existingZeroId.length > 0) {
        await connection.rollback()
        return NextResponse.json(
          { success: false, message: 'ID为0已被占用，无法迁移' },
          { status: 400 }
        )
      }

      // 3. 更新所有关联的爆款内容，将track_id从7改为0
      await connection.execute(
        'UPDATE explosive_contents SET track_id = 0 WHERE track_id = 7'
      )

      // 4. 更新"其他"赛道的ID从7改为0
      await connection.execute(
        'UPDATE note_tracks SET id = 0 WHERE id = 7 AND name = ?',
        ['其他']
      )

      // 提交事务
      await connection.commit()

      return NextResponse.json({
        success: true,
        message: '成功将"其他"赛道ID从7迁移到0',
        data: {
          old_id: 7,
          new_id: 0,
          track_name: '其他'
        }
      })

    } catch (error) {
      // 回滚事务
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('迁移"其他"赛道ID错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}