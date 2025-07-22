import { NextRequest, NextResponse } from 'next/server'
import { getNoteTypeList } from '@/lib/mysql-explosive-contents'
import { cookies } from 'next/headers'
import { getPool } from '@/lib/mysql'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// GET方法：获取笔记类型列表
export async function GET(request: NextRequest) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取类型列表
    const result = await getNoteTypeList()
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('获取笔记类型列表错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// POST方法：添加笔记类型
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

    const body = await request.json()
    const { name, description } = body
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: '类型名称不能为空' },
        { status: 400 }
      )
    }

    const connection = await getPool().getConnection()
    
    try {
      // 获取下一个可用的ID
      const [maxIdResult] = await connection.execute(
        'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM note_types'
      ) as any[]
      const nextId = maxIdResult[0].next_id

      // 插入新类型
      await connection.execute(
        'INSERT INTO note_types (id, name, description, status) VALUES (?, ?, ?, ?)',
        [nextId, name, description || null, 'enabled']
      )

      // 获取新创建的类型
      const [rows] = await connection.execute(
        'SELECT * FROM note_types WHERE id = ?',
        [nextId]
      ) as any[]

      return NextResponse.json({
        success: true,
        message: '类型添加成功',
        data: rows[0]
      })

    } finally {
      connection.release()
    }

  } catch (error: any) {
    console.error('添加笔记类型错误:', error)
    
    // 处理重复名称错误
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, message: '类型名称已存在' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// DELETE方法：删除笔记类型
export async function DELETE(request: NextRequest) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '类型ID不能为空' },
        { status: 400 }
      )
    }

    const connection = await getPool().getConnection()
    
    try {
      // 检查是否有关联的爆款内容
      const [contentRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM explosive_contents WHERE type_id = ?',
        [parseInt(id)]
      ) as any[]
      
      if (contentRows[0].count > 0) {
        return NextResponse.json(
          { success: false, message: '该类型下还有内容，无法删除' },
          { status: 400 }
        )
      }

      // 删除类型
      const [result] = await connection.execute(
        'DELETE FROM note_types WHERE id = ?',
        [parseInt(id)]
      ) as any[]

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { success: false, message: '类型不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '类型删除成功'
      })

    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('删除笔记类型错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 