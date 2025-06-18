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
      batch_tasks: {
        Row: {
          id: string
          user_id: string
          task_name: string
          search_keywords: string | null
          config: any // JSONB类型
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          task_name: string
          search_keywords?: string | null
          config?: any
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          task_name?: string
          search_keywords?: string | null
          config?: any
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      task_notes: {
        Row: {
          id: string
          task_id: string
          note_id: string
          note_data: any // JSONB类型
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          note_id: string
          note_data?: any
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          note_id?: string
          note_data?: any
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generated_contents: {
        Row: {
          id: string
          task_note_id: string
          title: string | null
          content: string | null
          content_type: string
          generation_config: any // JSONB类型
          status: 'generating' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          task_note_id: string
          title?: string | null
          content?: string | null
          content_type?: string
          generation_config?: any
          status?: 'generating' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          task_note_id?: string
          title?: string | null
          content?: string | null
          content_type?: string
          generation_config?: any
          status?: 'generating' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
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

// 小红书笔记详情数据类型
export interface XiaohongshuNoteDetail {
  auther_avatar: string // 作者头像URL
  auther_home_page_url: string // 作者主页URL
  auther_nick_name: string // 作者昵称
  auther_user_id: string // 作者用户ID
  collected: boolean // 是否已收藏
  collected_count: string // 收藏数量
  comment_count: string // 评论数量
  note_card_type: 'normal' | 'video' // 笔记卡片类型
  note_create_time: string // 笔记创建时间
  note_desc: string // 笔记描述内容
  note_display_title: string // 笔记显示标题
  note_duration: string | null // 视频时长(视频笔记)
  note_id: string // 笔记唯一ID
  note_image_list: string[] // 笔记图片列表
  note_last_update_time: string // 笔记最后更新时间
  note_liked: boolean // 是否已点赞
  note_liked_count: string // 点赞数量
  note_model_type: 'note' // 笔记模型类型
  note_tags: string[] // 笔记标签列表
  note_url: string // 笔记详情页URL
  share_count: string // 分享数量
  video_a1_url: string | null // 视频A1格式URL
  video_h264_url: string | null // 视频H264格式URL
  video_h265_url: string | null // 视频H265格式URL
  video_h266_url: string | null // 视频H266格式URL
  video_id: string | null // 视频ID
}

// Coze API搜索请求参数类型
export interface CozeSearchParams {
  cookieStr: string // 小红书cookie字符串
  keywords: string // 搜索关键词
  noteType: 0 | 1 | 2 // 笔记类型：0=全部，1=视频，2=图文
  sort: 0 | 1 | 2 // 排序方式：0=综合，1=最新，2=最热
  totalNumber: number // 获取数量
}

// Coze API笔记详情请求参数类型
export interface CozeNoteDetailParams {
  cookieStr: string // 小红书cookie字符串
  noteUrl: string // 笔记URL
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

// 解析后的搜索数据类型
export interface CozeDataResponse {
  code: number // 内部状态码
  data: XiaohongshuNote[] // 小红书笔记列表
  msg: string // 内部消息
}

// 解析后的笔记详情数据类型
export interface CozeNoteDetailResponse {
  code: number // 内部状态码
  data: {
    note: XiaohongshuNoteDetail // 小红书笔记详情
  }
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

// 笔记详情类型
export interface NoteDetail {
  id: string // 笔记ID
  title: string // 笔记标题
  author: string // 作者昵称
  authorAvatar: string // 作者头像
  authorId: string // 作者ID
  content: string // 笔记正文内容
  tags: string[] // 标签列表
  images: string[] // 图片列表
  createTime: string // 创建时间
  likeCount: number // 点赞数
  collectCount: number // 收藏数
  commentCount: number // 评论数
  shareCount: number // 分享数
  isLiked: boolean // 是否已点赞
  isCollected: boolean // 是否已收藏
  noteUrl: string // 笔记链接
  // 视频相关字段
  isVideo: boolean // 是否为视频笔记
  videoDuration?: string // 视频时长
  videoUrls?: {
    h264?: string // H264格式视频URL
    h265?: string // H265格式视频URL
  }
}

// 批量改写相关类型定义

// 数据库表类型别名
export type BatchTask = Database['public']['Tables']['batch_tasks']['Row']
export type BatchTaskInsert = Database['public']['Tables']['batch_tasks']['Insert']
export type BatchTaskUpdate = Database['public']['Tables']['batch_tasks']['Update']

export type TaskNote = Database['public']['Tables']['task_notes']['Row']
export type TaskNoteInsert = Database['public']['Tables']['task_notes']['Insert']
export type TaskNoteUpdate = Database['public']['Tables']['task_notes']['Update']

export type GeneratedContent = Database['public']['Tables']['generated_contents']['Row']
export type GeneratedContentInsert = Database['public']['Tables']['generated_contents']['Insert']
export type GeneratedContentUpdate = Database['public']['Tables']['generated_contents']['Update']

// 批量配置类型
export interface BatchConfig {
  count: string // 每篇笔记生成数量："1" | "3"
  type: string // 内容类型："auto" | "article" | "video"  
  theme: string // 特定主题
  persona: string // 人设定位："default" | "expert" | "friend" | "humor" | "professional"
  purpose: string // 营销目的："default" | "brand" | "review" | "traffic" | "education"
}

// ARK API相关类型

// ARK API消息类型
export interface ARKMessage {
  content: string
  role: 'system' | 'user' | 'assistant'
}

// ARK API请求参数
export interface ARKChatRequest {
  messages: ARKMessage[]
  model: string
  stream: boolean
  temperature?: number
  max_tokens?: number
}

// ARK API流式响应类型
export interface ARKStreamChunk {
  choices: Array<{
    delta: {
      content: string
      role?: string
    }
    index: number
    finish_reason?: string | null
  }>
  created: number
  id: string
  model: string
  service_tier: string
  object: string
  usage?: any
}

// 改写任务状态类型
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ContentStatus = 'generating' | 'completed' | 'failed'

// 前端展示用的任务类型
export interface Task {
  id: string
  noteTitle: string
  noteCover: string
  status: TaskStatus
  results: GeneratedContent[]
}

// 用于Results页面的扩展任务类型
export interface TaskWithDetails extends Task {
  taskName: string
  searchKeywords: string | null
  config: BatchConfig
  createdAt: string
  noteData: any // 笔记原始数据
} 