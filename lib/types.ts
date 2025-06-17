// 数据库类型定义

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          user_cookie: string | null
          task_indices: number[]
          display_name: string | null
          avatar_url: string | null
          last_login_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          user_cookie?: string | null
          task_indices?: number[]
          display_name?: string | null
          avatar_url?: string | null
          last_login_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          user_cookie?: string | null
          task_indices?: number[]
          display_name?: string | null
          avatar_url?: string | null
          last_login_at?: string
        }
      }
    }
  }
}

// 用户Cookie类型
export type UserCookie = string | null

// Profile类型
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// 小红书笔记相关类型定义
export interface XiaohongshuNote {
  auther_avatar: string // 作者头像URL
  auther_home_page_url: string // 作者主页URL
  auther_nick_name: string // 作者昵称
  auther_user_id: string // 作者用户ID
  note_card_type: 'normal' | 'video' // 笔记卡片类型：普通图文或视频
  note_cover_height: string // 封面图高度
  note_cover_url_default: string // 默认封面图URL
  note_cover_url_pre: string // 预览封面图URL
  note_cover_width: string // 封面图宽度
  note_display_title: string | null // 笔记显示标题
  note_id: string // 笔记唯一ID
  note_liked: boolean // 是否已点赞
  note_liked_count: string // 点赞数量
  note_model_type: 'note' // 笔记模型类型
  note_url: string // 笔记详情页URL
  note_xsec_token: string // 安全访问token
}

// Coze API请求参数类型
export interface CozeSearchParams {
  cookieStr: string // 小红书cookie字符串
  keywords: string // 搜索关键词
  noteType: 0 | 1 | 2 // 笔记类型：0=全部，1=视频，2=图文
  sort: 0 | 1 | 2 // 排序方式：0=综合，1=最新，2=最热
  totalNumber: number // 获取数量
}

// Coze API响应类型
export interface CozeApiResponse {
  code: number // 响应状态码
  cost: string // 消耗成本
  data: string // JSON字符串格式的数据
  debug_url: string // 调试URL
  msg: string // 响应消息
  token: number // token消耗
}

// 解析后的数据类型
export interface CozeDataResponse {
  code: number // 内部状态码
  data: XiaohongshuNote[] // 小红书笔记列表
  msg: string // 内部消息
}

// 搜索配置类型
export interface SearchConfig {
  noteType: 0 | 1 | 2 // 笔记类型
  sort: 0 | 1 | 2 // 排序方式
  totalNumber: number // 获取数量
}

// 统一的笔记类型（兼容现有代码）
export interface Note {
  id: string
  title: string
  cover: string
  author: string
  likes: number
  views: number
  content: string
  tags: string[]
  publishTime: string
  // 新增字段，用于存储原始数据
  originalData?: XiaohongshuNote
} 