export interface PurchasesTables {
  purchases: {
    Row: {
      purchase_uuid: string
      user_uuid: string | null
      purchase_number: string | null
      timestamp: string
      amount: string
      vat_amount: string | null
      country: string | null
      currency: string | null
      user_display_name: string | null
      created_at: string | null
      updated_at: string | null
      payment_type: string | null  // Added payment_type field
    }
    Insert: {
      purchase_uuid: string
      user_uuid?: string | null
      purchase_number?: string | null
      timestamp: string
      amount: string
      vat_amount?: string | null
      country?: string | null
      currency?: string | null
      user_display_name?: string | null
      created_at?: string | null
      updated_at?: string | null
      payment_type?: string | null  // Added payment_type field
    }
    Update: {
      purchase_uuid?: string
      user_uuid?: string | null
      purchase_number?: string | null
      timestamp?: string
      amount?: string
      vat_amount?: string | null
      country?: string | null
      currency?: string | null
      user_display_name?: string | null
      created_at?: string | null
      updated_at?: string | null
      payment_type?: string | null  // Added payment_type field
    }
  }
  total_purchases: {
    Row: {
      id: string
      purchase_uuid: string | null
      timestamp: string
      amount: number
      user_display_name: string | null
      payment_type: string | null
      product_name: string | null
      source: string
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      purchase_uuid?: string | null
      timestamp: string
      amount: number
      user_display_name?: string | null
      payment_type?: string | null
      product_name?: string | null
      source?: string
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      purchase_uuid?: string | null
      timestamp?: string
      amount?: number
      user_display_name?: string | null
      payment_type?: string | null
      product_name?: string | null
      source?: string
      created_at?: string | null
      updated_at?: string | null
    }
  }
}