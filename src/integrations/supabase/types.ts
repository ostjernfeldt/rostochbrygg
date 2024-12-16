export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          category: Database["public"]["Enums"]["article_category"]
          content: string
          created_at: string | null
          id: string
          reading_time: number | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["article_category"]
          content: string
          created_at?: string | null
          id?: string
          reading_time?: number | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["article_category"]
          content?: string
          created_at?: string | null
          id?: string
          reading_time?: number | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      challenges: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          reward: number
          start_date: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          reward: number
          start_date: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          reward?: number
          start_date?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          Amount: number | null
          Cost: number | null
          created_at: string | null
          Currency: string | null
          "Discount Amount": number | null
          "Discount Quantity": number | null
          "Discount Value": number | null
          "Gross Tax": number | null
          "Gross Value": number | null
          id: string
          "Payment Type": string | null
          "Product Name": string | null
          "Purchase Number": string | null
          "Purchase UUID": string | null
          Refunded: string | null
          "Tax Amount": number | null
          Timestamp: string | null
          "Unit Price": number | null
          updated_at: string | null
          "User Display Name": string | null
          "VAT Amount": number | null
        }
        Insert: {
          Amount?: number | null
          Cost?: number | null
          created_at?: string | null
          Currency?: string | null
          "Discount Amount"?: number | null
          "Discount Quantity"?: number | null
          "Discount Value"?: number | null
          "Gross Tax"?: number | null
          "Gross Value"?: number | null
          id?: string
          "Payment Type"?: string | null
          "Product Name"?: string | null
          "Purchase Number"?: string | null
          "Purchase UUID"?: string | null
          Refunded?: string | null
          "Tax Amount"?: number | null
          Timestamp?: string | null
          "Unit Price"?: number | null
          updated_at?: string | null
          "User Display Name"?: string | null
          "VAT Amount"?: number | null
        }
        Update: {
          Amount?: number | null
          Cost?: number | null
          created_at?: string | null
          Currency?: string | null
          "Discount Amount"?: number | null
          "Discount Quantity"?: number | null
          "Discount Value"?: number | null
          "Gross Tax"?: number | null
          "Gross Value"?: number | null
          id?: string
          "Payment Type"?: string | null
          "Product Name"?: string | null
          "Purchase Number"?: string | null
          "Purchase UUID"?: string | null
          Refunded?: string | null
          "Tax Amount"?: number | null
          Timestamp?: string | null
          "Unit Price"?: number | null
          updated_at?: string | null
          "User Display Name"?: string | null
          "VAT Amount"?: number | null
        }
        Relationships: []
      }
      salaries: {
        Row: {
          base_salary: number
          bonus: number | null
          commission_rate: number
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          updated_at: string | null
          user_display_name: string
          vacation_pay: number | null
        }
        Insert: {
          base_salary?: number
          bonus?: number | null
          commission_rate?: number
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          updated_at?: string | null
          user_display_name: string
          vacation_pay?: number | null
        }
        Update: {
          base_salary?: number
          bonus?: number | null
          commission_rate?: number
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string | null
          user_display_name?: string
          vacation_pay?: number | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string | null
          id: string
          presence_end: string | null
          presence_start: string
          updated_at: string | null
          user_display_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          presence_end?: string | null
          presence_start: string
          updated_at?: string | null
          user_display_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          presence_end?: string | null
          presence_start?: string
          updated_at?: string | null
          user_display_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      article_category: "Kaffekunskap" | "Säljutbildning"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
