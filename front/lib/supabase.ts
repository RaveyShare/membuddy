import { createClient } from "@supabase/supabase-js"

// Supabase 客户端需要在浏览器中访问这些环境变量
// 这些是公开的配置，不是敏感信息（ANON_KEY 是公开的匿名密钥）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

/**
 * 当本地预览或环境变量缺失时，构造一个"空客户端"。
 * 调用任意方法都会抛错，提示开发者补充环境变量，而不会在
 * `import` 阶段就导致整个应用崩溃。
 */
function createStubClient() {
  const err = () =>
    Promise.reject(
      new Error(
        "[Supabase] 缺少 NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY，" +
          "请在 .env.local 中配置后重启项目。",
      ),
    )
  // 仅实现当前项目用到的最小 API，其他属性按需补充
  return {
    auth: {
      signInWithPassword: err,
      signUp: err,
      signOut: err,
      refreshSession: err,
      resetPasswordForEmail: err,
      updateUser: err,
    },
    from() {
      return {
        select: () => ({ data: null, error: err() }),
        insert: () => ({ data: null, error: err() }),
        update: () => ({ data: null, error: err() }),
        eq: () => this,
        single: () => ({ data: null, error: err() }),
      }
    },
  } as unknown as ReturnType<typeof createClient>
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (() => {
        if (typeof window !== "undefined") {
          console.warn("%c[Supabase] 环境变量缺失，已启用 stub 客户端，Supabase 功能不可用。", "color: #fbbf24;")
        }
        return createStubClient()
      })()

// Types for our database tables
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface MemoryItem {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  tags: string[]
  type: string
  difficulty: "easy" | "medium" | "hard"
  starred: boolean
  created_at: string
  updated_at: string
}

export interface MemoryReview {
  id: string
  memory_item_id: string
  user_id: string
  review_date: string
  next_review_date: string
  mastery_level: number
  review_count: number
  created_at: string
}

export interface MemoryAid {
  id: string
  memory_item_id: string
  user_id: string
  mind_map_data?: any
  mnemonics_data?: any
  sensory_associations_data?: any
  created_at: string
  updated_at: string
}

// Combined type for memory items with review data
export interface MemoryItemWithReview extends MemoryItem {
  memory_reviews?: MemoryReview[]
  next_review?: string
  days_until_review?: number
  mastery?: number
  review_count?: number
}
