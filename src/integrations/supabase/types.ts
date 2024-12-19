export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      total_purchases: {
        Row: {
          id: string
          purchase_uuid: string
          user_uuid: string | null
          purchase_number: string | null
          timestamp: string
          amount: string
          vat_amount: string | null
          country: string | null
          currency: string | null
          user_display_name: string | null
          payment_type: string | null
          product_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          purchase_uuid: string
          user_uuid?: string | null
          purchase_number?: string | null
          timestamp: string
          amount: string
          vat_amount?: string | null
          country?: string | null
          currency?: string | null
          user_display_name?: string | null
          payment_type?: string | null
          product_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          purchase_uuid?: string
          user_uuid?: string | null
          purchase_number?: string | null
          timestamp?: string
          amount?: string
          vat_amount?: string | null
          country?: string | null
          currency?: string | null
          user_display_name?: string | null
          payment_type?: string | null
          product_name?: string | null
          created_at?: string | null
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
          Refunded?: string | null
          "Tax Amount"?: string | null
          Timestamp?: string | null
          "Unit Price"?: string | null
          updated_at?: string | null
          "User Display Name"?: string | null
          "VAT Amount"?: string | null
        }
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
