import { DatabasePurchase, LegacyPurchaseFormat, TotalPurchase } from "@/types/purchase";

export const mapDatabaseToLegacyFormat = (purchase: DatabasePurchase | TotalPurchase): LegacyPurchaseFormat => {
  const normalizeNumeric = (value: string | number | null) => {
    if (!value) return 0;
    const normalized = value.toString().replace(',', '.');
    return isNaN(parseFloat(normalized)) ? 0 : parseFloat(normalized);
  };

  return {
    Timestamp: purchase.timestamp,
    Amount: typeof purchase.amount === 'number' ? purchase.amount : normalizeNumeric(purchase.amount),
    "User Display Name": purchase.user_display_name || '',
    "Payment Type": purchase.payment_type || undefined,
    "Product Name": purchase.product_name || undefined
  };
};

export const mapPurchaseArray = (purchases: (DatabasePurchase | TotalPurchase)[]): LegacyPurchaseFormat[] => {
  return purchases.map(mapDatabaseToLegacyFormat);
};

export const mapToTotalPurchase = (purchase: DatabasePurchase): TotalPurchase => {
  return {
    id: purchase.id || purchase.purchase_uuid,
    purchase_uuid: purchase.purchase_uuid,
    timestamp: purchase.timestamp,
    amount: typeof purchase.amount === 'number' ? purchase.amount : parseFloat(purchase.amount),
    user_display_name: purchase.user_display_name,
    payment_type: purchase.payment_type || null,
    product_name: purchase.product_name || null,
    source: purchase.source || 'new',
    created_at: purchase.created_at,
    updated_at: purchase.updated_at
  };
};