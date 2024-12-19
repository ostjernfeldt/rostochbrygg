import { Database } from "@/integrations/supabase/types";

type DatabasePurchase = Database['public']['Tables']['total_purchases']['Row'];

export interface LegacyPurchaseFormat {
  Timestamp: string;
  Amount: number;
  "User Display Name": string;
  "Payment Type"?: string;
  "Product Name"?: string;
}

export const mapDatabaseToLegacyFormat = (purchase: DatabasePurchase): LegacyPurchaseFormat => {
  // Convert comma to period for numeric values if needed
  const normalizeNumeric = (value: string | null) => {
    if (!value) return 0;
    return Number(value.replace(',', '.'));
  };

  return {
    Timestamp: purchase.timestamp,
    Amount: normalizeNumeric(purchase.amount.toString()),
    "User Display Name": purchase.user_display_name || '',
    "Payment Type": purchase.payment_type || undefined,
    "Product Name": purchase.product_name || undefined
  };
};

export const mapPurchaseArray = (purchases: DatabasePurchase[]): LegacyPurchaseFormat[] => {
  return purchases.map(mapDatabaseToLegacyFormat);
};