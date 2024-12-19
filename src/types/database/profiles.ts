export interface ProfilesTables {
  profiles: {
    Row: {
      id: string
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id: string
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      created_at?: string | null
      updated_at?: string | null
    }
  }
}