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
      legacy_purchases: {
        Row: {
          Amount: string | null
          Cost: string | null
          created_at: string | null
          Currency: string | null
          "Discount Amount": string | null
          "Discount Quantity": string | null
          "Discount Value": string | null
          "Gross Tax": string | null
          "Gross Value": string | null
          id: string
          "Payment Type": string | null
          "Product Name": string | null
          "Purchase Number": string | null
          "Purchase UUID": string | null
          "Refund UUID": string | null
          Refunded: string | null
          "Tax Amount": string | null
          Timestamp: string | null
          "Unit Price": string | null
          updated_at: string | null
          "User Display Name": string | null
          "VAT Amount": string | null
        }
        Insert: {
          Amount?: string | null
          Cost?: string | null
          created_at?: string | null
          Currency?: string | null
          "Discount Amount"?: string | null
          "Discount Quantity"?: string | null
          "Discount Value"?: string | null
          "Gross Tax"?: string | null
          "Gross Value"?: string | null
          id?: string
          "Payment Type"?: string | null
          "Product Name"?: string | null
          "Purchase Number"?: string | null
          "Purchase UUID"?: string | null
          "Refund UUID"?: string | null
          Refunded?: string | null
          "Tax Amount"?: string | null
          Timestamp?: string | null
          "Unit Price"?: string | null
          updated_at?: string | null
          "User Display Name"?: string | null
          "VAT Amount"?: string | null
        }
        Update: {
          Amount?: string | null
          Cost?: string | null
          created_at?: string | null
          Currency?: string | null
          "Discount Amount"?: string | null
          "Discount Quantity"?: string | null
          "Discount Value"?: string | null
          "Gross Tax"?: string | null
          "Gross Value"?: string | null
          id?: string
          "Payment Type"?: string | null
          "Product Name"?: string | null
          "Purchase Number"?: string | null
          "Purchase UUID"?: string | null
          "Refund UUID"?: string | null
          Refunded?: string | null
          "Tax Amount"?: string | null
          Timestamp?: string | null
          "Unit Price"?: string | null
          updated_at?: string | null
          "User Display Name"?: string | null
          "VAT Amount"?: string | null
        }
        Relationships: []
      }
      legacy_purchases_backup: {
        Row: {
          Amount: string | null
          Cost: string | null
          created_at: string | null
          Currency: string | null
          "Discount Amount": string | null
          "Discount Quantity": string | null
          "Discount Value": string | null
          "Gross Tax": string | null
          "Gross Value": string | null
          id: string | null
          "Payment Type": string | null
          "Product Name": string | null
          "Purchase Number": string | null
          "Purchase UUID": string | null
          "Refund UUID": string | null
          Refunded: string | null
          "Tax Amount": string | null
          Timestamp: string | null
          "Unit Price": string | null
          updated_at: string | null
          "User Display Name": string | null
          "VAT Amount": string | null
        }
        Insert: {
          Amount?: string | null
          Cost?: string | null
          created_at?: string | null
          Currency?: string | null
          "Discount Amount"?: string | null
          "Discount Quantity"?: string | null
          "Discount Value"?: string | null
          "Gross Tax"?: string | null
          "Gross Value"?: string | null
          id?: string | null
          "Payment Type"?: string | null
          "Product Name"?: string | null
          "Purchase Number"?: string | null
          "Purchase UUID"?: string | null
          "Refund UUID"?: string | null
          Refunded?: string | null
          "Tax Amount"?: string | null
          Timestamp?: string | null
          "Unit Price"?: string | null
          updated_at?: string | null
          "User Display Name"?: string | null
          "VAT Amount"?: string | null
        }
        Update: {
          Amount?: string | null
          Cost?: string | null
          created_at?: string | null
          Currency?: string | null
          "Discount Amount"?: string | null
          "Discount Quantity"?: string | null
          "Discount Value"?: string | null
          "Gross Tax"?: string | null
          "Gross Value"?: string | null
          id?: string | null
          "Payment Type"?: string | null
          "Product Name"?: string | null
          "Purchase Number"?: string | null
          "Purchase UUID"?: string | null
          "Refund UUID"?: string | null
          Refunded?: string | null
          "Tax Amount"?: string | null
          Timestamp?: string | null
          "Unit Price"?: string | null
          updated_at?: string | null
          "User Display Name"?: string | null
          "VAT Amount"?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: string | null
          created_at: string | null
          id: string
          payment_uuid: string | null
          purchase_uuid: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: string | null
          created_at?: string | null
          id?: string
          payment_uuid?: string | null
          purchase_uuid?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: string | null
          created_at?: string | null
          id?: string
          payment_uuid?: string | null
          purchase_uuid?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_purchase_uuid_fkey"
            columns: ["purchase_uuid"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["purchase_uuid"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          product_uuid: string | null
          purchase_uuid: string | null
          quantity: string | null
          unit_price: string | null
          updated_at: string | null
          vat_percentage: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          product_uuid?: string | null
          purchase_uuid?: string | null
          quantity?: string | null
          unit_price?: string | null
          updated_at?: string | null
          vat_percentage?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          product_uuid?: string | null
          purchase_uuid?: string | null
          quantity?: string | null
          unit_price?: string | null
          updated_at?: string | null
          vat_percentage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_purchase_uuid_fkey"
            columns: ["purchase_uuid"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["purchase_uuid"]
          },
        ]
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
          amount: string
          country: string | null
          created_at: string | null
          currency: string | null
          payment_type: string | null
          purchase_number: string | null
          purchase_uuid: string
          timestamp: string
          updated_at: string | null
          user_display_name: string | null
          user_uuid: string | null
          vat_amount: string | null
        }
        Insert: {
          amount: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          payment_type?: string | null
          purchase_number?: string | null
          purchase_uuid: string
          timestamp: string
          updated_at?: string | null
          user_display_name?: string | null
          user_uuid?: string | null
          vat_amount?: string | null
        }
        Update: {
          amount?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          payment_type?: string | null
          purchase_number?: string | null
          purchase_uuid?: string
          timestamp?: string
          updated_at?: string | null
          user_display_name?: string | null
          user_uuid?: string | null
          vat_amount?: string | null
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
      total_purchases: {
        Row: {
          amount: number
          coordinates_accuracy_meters: number | null
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          cost_price: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          discount_rate: number | null
          gps_coordinates: Json | null
          gross_amount: number | null
          id: string
          net_amount: number | null
          payment_card_last4: string | null
          payment_card_mask: string | null
          payment_card_type: string | null
          payment_installments: number | null
          payment_message: string | null
          payment_reference: string | null
          payment_reference_number: string | null
          payment_type: string | null
          payment_uuid: string | null
          payments: Json | null
          product_category: string | null
          product_description: string | null
          product_name: string | null
          product_sku: string | null
          product_uuid: string | null
          product_variant_uuid: string | null
          products: Json | null
          purchase_number: number | null
          purchase_uuid: string | null
          quantity: number | null
          refund_timestamp: string | null
          refund_uuid: string | null
          refunded: boolean | null
          source: string
          timestamp: string
          unit_price: number | null
          updated_at: string | null
          user_display_name: string | null
          vat_amount: number | null
        }
        Insert: {
          amount: number
          coordinates_accuracy_meters?: number | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          cost_price?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_rate?: number | null
          gps_coordinates?: Json | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          payment_card_last4?: string | null
          payment_card_mask?: string | null
          payment_card_type?: string | null
          payment_installments?: number | null
          payment_message?: string | null
          payment_reference?: string | null
          payment_reference_number?: string | null
          payment_type?: string | null
          payment_uuid?: string | null
          payments?: Json | null
          product_category?: string | null
          product_description?: string | null
          product_name?: string | null
          product_sku?: string | null
          product_uuid?: string | null
          product_variant_uuid?: string | null
          products?: Json | null
          purchase_number?: number | null
          purchase_uuid?: string | null
          quantity?: number | null
          refund_timestamp?: string | null
          refund_uuid?: string | null
          refunded?: boolean | null
          source?: string
          timestamp: string
          unit_price?: number | null
          updated_at?: string | null
          user_display_name?: string | null
          vat_amount?: number | null
        }
        Update: {
          amount?: number
          coordinates_accuracy_meters?: number | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          cost_price?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_rate?: number | null
          gps_coordinates?: Json | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          payment_card_last4?: string | null
          payment_card_mask?: string | null
          payment_card_type?: string | null
          payment_installments?: number | null
          payment_message?: string | null
          payment_reference?: string | null
          payment_reference_number?: string | null
          payment_type?: string | null
          payment_uuid?: string | null
          payments?: Json | null
          product_category?: string | null
          product_description?: string | null
          product_name?: string | null
          product_sku?: string | null
          product_uuid?: string | null
          product_variant_uuid?: string | null
          products?: Json | null
          purchase_number?: number | null
          purchase_uuid?: string | null
          quantity?: number | null
          refund_timestamp?: string | null
          refund_uuid?: string | null
          refunded?: boolean | null
          source?: string
          timestamp?: string
          unit_price?: number | null
          updated_at?: string | null
          user_display_name?: string | null
          vat_amount?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sync_total_purchases: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
