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
          credits: number
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
          credits?: number
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
          credits?: number
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
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'reward' | 'consume' | 'refund'
          amount: number
          reason: string
          related_task_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: 'reward' | 'consume' | 'refund'
          amount: number
          reason: string
          related_task_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: 'reward' | 'consume' | 'refund'
          amount?: number
          reason?: string
          related_task_id?: string | null
          created_at?: string
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
  note_url: string | null // 笔记详情页URL
  note_xsec_token: string // 安全访问token
  backup_note_url?: string | null // 备用链接字段，用于批量生成时的原文链接获取
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
  // note-rewrite场景的分类ID
  track_id?: number
  type_id?: number
  tone_id?: number
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
  type: string // 内容类型："auto" | "article" | "video"  
  theme: string // 特定主题
  persona: string // 人设定位："default" | "expert" | "friend" | "humor" | "professional"
  purpose: string // 营销目的："default" | "brand" | "review" | "traffic" | "education"
  accountPositioning?: string // 账号定位信息（可选）
  keywords?: string[] // SEO关键词（可选）
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
  stream_options?: {
    include_usage?: boolean
  }
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
  usage?: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
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

// 积分相关类型定义
export type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row']
export type CreditTransactionInsert = Database['public']['Tables']['credit_transactions']['Insert']
export type CreditTransactionUpdate = Database['public']['Tables']['credit_transactions']['Update']

export type TransactionType = 'reward' | 'consume' | 'refund'

export interface CreditBalance {
  current: number
  total_earned: number
  total_consumed: number
}

export interface CreditCheck {
  sufficient: boolean
  current: number
  required: number
  shortage: number
}

// 积分账单相关类型定义
export interface CreditHistoryParams {
  user_id: string // 用户ID
  transaction_type?: 'reward' | 'consume' | 'refund' | 'all' // 交易类型筛选
  start_date?: string // 开始日期筛选
  end_date?: string // 结束日期筛选
  limit?: number // 每页数量，默认20
  offset?: number // 偏移量，默认0
}

export interface CreditHistoryResponse {
  success: boolean
  data?: {
    transactions: CreditTransaction[] // 交易记录列表
    total: number // 总记录数
    current_balance: number // 当前积分余额
    summary: {
      total_earned: number // 总获得积分
      total_consumed: number // 总消费积分
      total_refunded: number // 总退款积分
    }
  }
  error?: string
}

// 账号定位相关类型定义
export interface AccountPositioning {
  id: string // 账号定位ID
  user_id: string // 用户ID
  name: string // 账号定位命名
  one_line_description: string | null // 一句话定位
  core_value: string | null // 核心价值
  target_audience: string | null // 目标用户
  key_persona: string | null // 关键人设
  core_style: string | null // 核心风格
  created_at: string // 创建时间
  updated_at: string // 更新时间
}

// 创建账号定位的输入类型
export interface AccountPositioningInsert {
  user_id: string // 用户ID（必填）
  name: string // 账号定位命名（必填）
  one_line_description?: string | null // 一句话定位（可选）
  core_value?: string | null // 核心价值（可选）
  target_audience?: string | null // 目标用户（可选）
  key_persona?: string | null // 关键人设（可选）
  core_style?: string | null // 核心风格（可选）
}

// 更新账号定位的输入类型
export interface AccountPositioningUpdate {
  name?: string // 账号定位命名
  one_line_description?: string | null // 一句话定位
  core_value?: string | null // 核心价值
  target_audience?: string | null // 目标用户
  key_persona?: string | null // 关键人设
  core_style?: string | null // 核心风格
}

// API响应类型
export interface AccountPositioningResponse {
  success: boolean
  data?: AccountPositioning | AccountPositioning[] | null
  error?: string
}

// 账号定位列表查询参数
export interface AccountPositioningListParams {
  user_id: string // 用户ID
  limit?: number // 每页数量，默认20
  offset?: number // 偏移量，默认0
  search?: string // 搜索关键词（按名称搜索）
}

// ============================================
// 爆文改写记录相关类型定义
// ============================================

// 爆文改写记录表结构
export interface RewriteRecord {
  id: string // 记录唯一标识
  user_id: string // 用户ID
  original_text: string // 要改写的原文内容
  source_url: string | null // 如果是链接解析的，保存原始链接
  source_type: 'link' | 'text' // 来源类型：link=链接解析，text=直接输入
  generation_config: RewriteGenerationConfig // 生成时的配置
  generated_content: RewriteGeneratedVersion[] // 改写后的结果（包含多个版本）
  status: 'generating' | 'completed' | 'failed' // 生成状态
  credits_consumed: number // 消耗的积分数
  error_message: string | null // 错误信息（如果生成失败）
  created_at: string // 创建时间
  completed_at: string | null // 完成时间
  updated_at: string // 更新时间
}

// 爆文改写记录插入类型
export interface RewriteRecordInsert {
  user_id: string // 用户ID（必填）
  original_text: string // 要改写的原文内容（必填）
  source_url?: string | null // 原始链接（可选）
  source_type: 'link' | 'text' // 来源类型（必填）
  generation_config: RewriteGenerationConfig // 生成配置（必填）
  credits_consumed: number // 消耗的积分数（必填）
}

// 爆文改写记录更新类型
export interface RewriteRecordUpdate {
  generated_content?: RewriteGeneratedVersion[] // 改写后的结果
  status?: 'generating' | 'completed' | 'failed' // 生成状态
  error_message?: string | null // 错误信息
  completed_at?: string | null // 完成时间
}

// 爆文改写生成配置
export interface RewriteGenerationConfig {
  theme: string // 改写主题
  persona: string // 人设定位
  purpose: string // 笔记目的
  keywords: string[] // SEO关键词
  account_positioning: string // 账号定位信息
  original_text_length: number // 原文长度
}

// 爆文改写生成版本
export interface RewriteGeneratedVersion {
  title: string // 生成的标题
  content: string // 生成的内容
  version_name: string // 版本名称（如：经典策略版、人设深耕版）
}

// 爆文改写记录响应类型
export interface RewriteRecordResponse {
  success: boolean
  data?: RewriteRecord | RewriteRecord[] | null
  error?: string
}

// 爆文改写记录列表查询参数
export interface RewriteRecordListParams {
  user_id: string // 用户ID
  limit?: number // 每页数量，默认20
  offset?: number // 偏移量，默认0
  status?: 'generating' | 'completed' | 'failed' // 状态筛选
  source_type?: 'link' | 'text' // 来源类型筛选
  start_date?: string // 开始日期筛选
  end_date?: string // 结束日期筛选
}

// ============================================
// 会员系统相关类型定义
// ============================================

// 会员等级类型
export type MembershipLevel = 'lite' | 'pro' | 'premium'
export type MembershipDuration = 'monthly' | 'yearly'
export type MembershipStatus = 'active' | 'expired' | 'cancelled'

// 完整会员类型（用于兼容性）
export type MembershipType = 'lite_monthly' | 'lite_yearly' | 'pro_monthly' | 'pro_yearly' | 'premium_monthly' | 'premium_yearly'

// 会员信息
export interface Membership {
  id: string
  user_id: string
  membership_level: MembershipLevel
  membership_duration: MembershipDuration
  status: MembershipStatus
  start_date: string
  end_date: string
  monthly_credits: number
  last_credits_reset: string | null
  auto_renew: boolean
  created_at: string
  updated_at: string
}

// 会员信息插入类型
export interface MembershipInsert {
  user_id: string
  membership_level: MembershipLevel
  membership_duration: MembershipDuration
  status?: MembershipStatus
  start_date: string
  end_date: string
  monthly_credits: number
  last_credits_reset?: string | null
  auto_renew?: boolean
}

// 会员配置信息
export interface MembershipConfig {
  level: MembershipLevel
  duration: MembershipDuration
  credits: number
  price: number
  originalPrice?: number
  discount?: number
}

// 积分包记录
export interface CreditPackage {
  id: string
  user_id: string
  package_type: 'purchase' | 'gift'
  credits_amount: number
  granted_by: string | null
  reason: string | null
  created_at: string
}

// 积分包记录插入类型
export interface CreditPackageInsert {
  user_id: string
  package_type: 'purchase' | 'gift'
  credits_amount: number
  granted_by?: string | null
  reason?: string | null
}

// 年会员积分发放记录
export interface YearlyMemberCredit {
  id: string
  user_id: string
  membership_id: string
  credits_amount: number
  grant_month: string
  granted_at: string
}

// 管理员操作类型
export type AdminOperationType = 'grant_credits' | 'set_membership' | 'gift_credit_package'

// 管理员操作日志
export interface AdminOperationLog {
  id: string
  admin_user: string
  operation_type: AdminOperationType
  target_user_id: string
  target_user_email: string
  operation_details: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// 管理员操作日志插入类型
export interface AdminOperationLogInsert {
  admin_user: string
  operation_type: AdminOperationType
  target_user_id: string
  target_user_email: string
  operation_details: any
  ip_address?: string | null
  user_agent?: string | null
}

// 用户会员状态视图
export interface UserMembershipStatus {
  user_id: string
  email: string
  display_name: string | null
  credits: number
  membership_type: string | null // 格式：'lite_monthly', 'pro_yearly' 等
  membership_level: MembershipLevel | null
  membership_duration: MembershipDuration | null
  membership_status: MembershipStatus | null
  membership_start: string | null
  membership_end: string | null
  monthly_credits: number | null
  last_credits_reset: string | null
  next_credits_reset: string | null
  is_active_member: boolean
  is_lite_member: boolean
  is_pro_member: boolean
  is_premium_member: boolean
}

// 管理后台相关类型
export interface AdminUser {
  username: string
  authenticated: boolean
}

// 管理后台操作请求类型
export interface AdminGrantCreditsRequest {
  user_id: string
  credits_amount: number
  reason?: string
}

export interface AdminSetMembershipRequest {
  user_id: string
  membership_type: MembershipType
  reason?: string
}

export interface AdminGiftCreditPackageRequest {
  user_id: string
  credits_amount: number
  reason?: string
}

// 管理后台响应类型
export interface AdminResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

// 用户搜索结果类型
export interface UserSearchResult {
  id: string
  email: string
  display_name: string | null
  credits: number
  is_active_member: boolean
  membership_type: MembershipType | null
  membership_end: string | null
  created_at: string
}

// 作者信息类型定义
export interface AuthorInfo {
  avatar: string // 作者头像URL
  desc: string // 作者描述
  fans: string // 粉丝数
  follows: string // 关注数
  gender: string // 性别
  interaction: string // 互动数
  ip_location: string // IP位置
  nick_name: string // 昵称
  red_id: string // 小红书ID
  tags: string[] // 标签列表
  user_id: string // 用户ID
  user_link_url: string // 用户链接URL
}

// 作者笔记获取请求参数
export interface CozeAuthorNotesParams {
  cookieStr: string // 小红书cookie字符串
  userProfileUrl: string // 作者主页链接
}

// 新的笔记格式类型定义
export interface NewFormatNote {
  exposed: boolean
  id: string
  index: number
  noteCard: {
    cover: {
      fileId: string
      height: number
      infoList: Array<{
        imageScene: string
        url: string
      }>
      traceId: string
      url: string
      urlDefault: string
      urlPre: string
      width: number
    }
    displayTitle: string
    interactInfo: {
      liked: boolean
      likedCount: string
      sticky: boolean
    }
    noteId: string
    type: string
    user: {
      avatar: string
      nickName: string
      nickname: string
      userId: string
    }
    xsecToken: string
  }
  ssrRendered: boolean
  xsecToken: string
}

// 新的用户信息格式
export interface NewFormatUserInfo {
  basicInfo: {
    desc: string
    gender: number
    imageb: string
    images: string
    ipLocation: string
    nickname: string
    redId: string
  }
  extraInfo: {
    blockType: string
    fstatus: string
  }
  interactions: Array<{
    count: string
    name: string
    type: string
  }>
  result: {
    code: number
    message: string
    success: boolean
  }
  tabPublic: {
    collection: boolean
    collectionBoard: {
      count: number
      display: boolean
      lock: boolean
    }
    collectionNote: {
      count: number
      display: boolean
      lock: boolean
    }
  }
  tags: any[]
}

// 新格式的作者笔记获取响应
export interface NewFormatAuthorNotesResponse {
  notes: NewFormatNote[]
  user: NewFormatUserInfo
}

// 作者笔记获取结果
export interface AuthorNotesResult {
  auther_info: AuthorInfo
  notes: XiaohongshuNote[]
}

// ============================================
// 爆款内容相关类型定义
// ============================================

// 笔记赛道类型
export interface NoteTrack {
  id: number
  name: string
  description: string | null
  status: 'enabled' | 'disabled'
  created_at: string
  updated_at: string
}

// 笔记类型
export interface NoteType {
  id: number
  name: string
  description: string | null
  status: 'enabled' | 'disabled'
  created_at: string
  updated_at: string
}

// 笔记口吻
export interface NoteTone {
  id: number
  name: string
  description: string | null
  status: 'enabled' | 'disabled'
  created_at: string
  updated_at: string
}

// 爆款内容状态枚举
export type ExplosiveContentStatus = 'enabled' | 'disabled'

// 新的爆款内容接口（适配coze接口返回数据）
export interface ExplosiveContent {
  id: string // 爆款内容ID
  title: string // 笔记标题
  content: string // 笔记正文内容
  cover_image: string | null // 笔记封面图片URL（存储到OSS后的URL）
  original_cover_url: string | null // 原始封面图片URL
  
  // 作者信息
  author_name: string | null // 笔记作者昵称
  author_id: string | null // 作者用户ID
  author_avatar: string | null // 作者头像URL
  
  // 互动数据
  likes_count: number // 点赞数
  collects_count: number // 收藏数
  comments_count: number // 评论数
  
  // 分类信息（使用ID关联类型表）
  track_id: number // 笔记赛道ID
  tone_id: number // 笔记口吻ID
  type_id: number // 笔记类型ID
  
  // 元数据
  note_url: string | null // 原始笔记链接
  note_id: string | null // 小红书笔记ID
  tags: string[] // 笔记标签列表
  
  // 时间信息
  published_at: string | null // 笔记发布时间
  created_at: string // 添加时间
  updated_at: string // 更新时间
  
  // 状态
  status: ExplosiveContentStatus // 状态
}

// 爆款内容插入接口
export interface ExplosiveContentInsert {
  title: string // 笔记标题（必填）
  content: string // 笔记正文内容（必填）
  cover_image?: string | null // 笔记封面图片URL（可选）
  original_cover_url?: string | null // 原始封面图片URL（可选）
  
  // 作者信息
  author_name?: string | null // 笔记作者昵称（可选）
  author_id?: string | null // 作者用户ID（可选）
  author_avatar?: string | null // 作者头像URL（可选）
  
  // 互动数据
  likes_count?: number // 点赞数（可选）
  collects_count?: number // 收藏数（可选）
  comments_count?: number // 评论数（可选）
  
  // 分类信息
  track_id: number // 笔记赛道ID（必填）
  tone_id: number // 笔记口吻ID（必填）
  type_id: number // 笔记类型ID（必填）
  
  // 元数据
  note_url?: string | null // 原始笔记链接（可选）
  note_id?: string | null // 小红书笔记ID（可选）
  tags?: string[] // 笔记标签列表（可选）
  
  // 时间信息
  published_at?: string | null // 笔记发布时间（可选）
  
  // 状态
  status?: ExplosiveContentStatus // 状态（可选）
}

// 爆款内容更新接口
export interface ExplosiveContentUpdate {
  title?: string // 笔记标题
  content?: string // 笔记正文内容
  cover_image?: string | null // 笔记封面图片URL
  original_cover_url?: string | null // 原始封面图片URL
  
  // 作者信息
  author_name?: string | null // 笔记作者昵称
  author_id?: string | null // 作者用户ID
  author_avatar?: string | null // 作者头像URL
  
  // 互动数据
  likes_count?: number // 点赞数
  collects_count?: number // 收藏数
  comments_count?: number // 评论数
  
  // 分类信息
  track_id?: number // 笔记赛道ID
  tone_id?: number // 笔记口吻ID
  type_id?: number // 笔记类型ID
  
  // 元数据
  note_url?: string | null // 原始笔记链接
  note_id?: string | null // 小红书笔记ID
  tags?: string[] // 笔记标签列表
  
  // 时间信息
  published_at?: string | null // 笔记发布时间
  
  // 状态
  status?: ExplosiveContentStatus // 状态
}

// 爆款内容响应接口
export interface ExplosiveContentResponse {
  success: boolean
  data?: ExplosiveContent | ExplosiveContent[] | null
  error?: string
}

// 爆款内容列表查询参数
export interface ExplosiveContentListParams {
  track_id?: number[] // 赛道筛选（支持多选）
  type_id?: number[] // 类型筛选（支持多选）
  tone_id?: number[] // 口吻筛选（支持多选）
  status?: ExplosiveContentStatus // 状态筛选
  limit?: number // 每页数量，默认20
  offset?: number // 偏移量，默认0
  search?: string // 搜索关键词（按标题搜索）
}

// 爆款内容统计信息
export interface ExplosiveContentStats {
  total_count: number // 总数量
  enabled_count: number // 启用数量
  disabled_count: number // 禁用数量
  track_stats: Array<{
    track_id: number
    track_name: string
    count: number
    enabled_count: number
    disabled_count: number
  }>
  type_stats: Array<{
    type_id: number
    type_name: string
    count: number
    enabled_count: number
    disabled_count: number
  }>
  tone_stats: Array<{
    tone_id: number
    tone_name: string
    count: number
    enabled_count: number
    disabled_count: number
  }>
}

// Coze接口返回的笔记数据格式
export interface CozeNoteResponse {
  kouwen: number // 口吻ID
  note_detail: {
    auther_avatar: string
    auther_home_page_url: string 
    auther_nick_name: string
    auther_user_id: string
    collected: boolean
    collected_count: string
    comment_count: string
    note_card_type: string
    note_create_time: string
    note_desc: string
    note_display_title: string
    note_duration: string | null
    note_id: string
    note_image_list: string[]
    note_last_update_time: string
    note_liked: boolean
    note_liked_count: string
    note_model_type: string
    note_tags: string[]
    note_url: string
    share_count: string
    video_a1_url: string | null
    video_h264_url: string | null
    video_h265_url: string | null
    video_h266_url: string | null
    video_id: string | null
  }
  note_detail1: number // 赛道ID
  note_type: number // 笔记类型ID
}

// 小红书链接导入请求
export interface XhsLinkImportRequest {
  urls: string[] // 小红书链接数组
}

// 小红书链接导入响应
export interface XhsLinkImportResponse {
  success: boolean
  data?: {
    total: number // 总链接数
    successful: number // 成功数量
    failed: number // 失败数量
    results: Array<{
      url: string
      success: boolean
      note_id?: string
      error?: string
    }>
  }
  message?: string
  error?: string
}

// 爆款内容批量导入响应
export interface BatchImportExplosiveContentResponse {
  success: boolean
  data?: {
    total_processed: number
    successful_count: number
    failed_count: number
    failed_items: Array<{
      index: number
      error: string
      title: string
    }>
  }
  error?: string
}