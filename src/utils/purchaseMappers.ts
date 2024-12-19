import { TotalPurchase } from "@/types/database";

export interface LegacyPurchaseFormat {
  Timestamp: string;
  Amount: number;
  "User Display Name": string;
  "Payment Type"?: string;
  "Product Name"?: string;
}

export const mapDatabaseToLegacyFormat = (purchase: TotalPurchase): LegacyPurchaseFormat => {
  const normalizeNumeric = (value: string | null) => {
    if (!value) return 0;
    return Number(value.replace(',', '.'));
  };

  return {
    Timestamp: purchase.timestamp,
    Amount: normalizeNumeric(purchase.amount),
    "User Display Name": purchase.user_display_name || '',
    "Payment Type": purchase.payment_type || undefined,
    "Product Name": purchase.product_name || undefined
  };
};

export const mapPurchaseArray = (purchases: TotalPurchase[]): LegacyPurchaseFormat[] => {
  return purchases.map(mapDatabaseToLegacyFormat);
};