import { Database as GeneratedDatabase } from "@/integrations/supabase/types";

export interface TotalPurchase {
  amount: string;
  country: string | null;
  created_at: string | null;
  currency: string | null;
  purchase_number: string | null;
  purchase_uuid: string;
  timestamp: string;
  updated_at: string | null;
  user_display_name: string | null;
  user_uuid: string | null;
  vat_amount: string | null;
  payment_type?: string | null;
  product_name?: string | null;
}

export type AppRole = "admin" | "user";

export type Database = GeneratedDatabase & {
  public: {
    Tables: {
      total_purchases: {
        Row: TotalPurchase;
        Insert: TotalPurchase;
        Update: Partial<TotalPurchase>;
      };
    } & GeneratedDatabase['public']['Tables'];
  };
};
