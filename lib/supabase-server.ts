import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// 服务端单例 Supabase 客户端
let supabaseServerInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseServer() {
  if (!supabaseServerInstance) {
    supabaseServerInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseServerInstance
}

// 导出单例实例
export const supabaseServer = getSupabaseServer() 