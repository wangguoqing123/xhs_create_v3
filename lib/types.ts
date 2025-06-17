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