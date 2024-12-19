export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Tables {
  articles: {
    Row: {
      category: ArticleCategory
      content: string
      created_at: string | null
      id: string
      reading_time: number | null
      slug: string
      title: string
      updated_at: string | null
    }
    Insert: {
      category: ArticleCategory
      content: string
      created_at?: string | null
      id?: string
      reading_time?: number | null
      slug: string
      title: string
      updated_at?: string | null
    }
    Update: {
      category?: ArticleCategory
      content?: string
      created_at?: string | null
      id?: string
      reading_time?: number | null
      slug?: string
      title?: string
      updated_at?: string | null
    }
  }
  bonus_records: {
    Row: {
      amount: number
      bonus_date: string
      created_at: string | null
      description: string | null
      id: string
      updated_at: string | null
      user_display_name: string
    }
    Insert: {
      amount?: number
      bonus_date: string
      created_at?: string | null
      description?: string | null
      id?: string
      updated_at?: string | null
      user_display_name: string
    }
    Update: {
      amount?: number
      bonus_date?: string
      created_at?: string | null
      description?: string | null
      id?: string
      updated_at?: string | null
      user_display_name?: string
    }
  }
}

export type ArticleCategory = "Kaffekunskap" | "Säljutbildning"