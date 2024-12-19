import { DatabasePurchase, LegacyPurchaseFormat } from "@/types/purchase";

export const mapDatabaseToLegacyFormat = (purchase: DatabasePurchase): LegacyPurchaseFormat => {
  const normalizeNumeric = (value: string | null) => {
    if (!value) return 0;
    const normalized = value.toString().replace(',', '.');
    return isNaN(parseFloat(normalized)) ? 0 : parseFloat(normalized);
  };

  return {
    Timestamp: purchase.timestamp,
    Amount: normalizeNumeric(purchase.amount),
    "User Display Name": purchase.user_display_name || '',
    "Payment Type": purchase.payment_type || undefined,
    "Product Name": purchase.product_name || undefined
  };
};

export const mapPurchaseArray = (purchases: DatabasePurchase[]): LegacyPurchaseFormat[] => {
  return purchases.map(mapDatabaseToLegacyFormat);
};