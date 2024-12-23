import { DatabasePurchase, LegacyPurchaseFormat, TotalPurchase, Payment } from "@/types/purchase";
import { Json } from "@/types/json";

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

const parseJsonField = (field: Json | null): any => {
  if (!field) return undefined;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.error('Error parsing JSON field:', e);
      return undefined;
    }
  }
  return field;
};

const parsePayments = (paymentsJson: Json | null): Payment[] | null => {
  const parsed = parseJsonField(paymentsJson);
  if (!Array.isArray(parsed)) return null;
  
  return parsed.map(payment => ({
    uuid: payment.uuid || '',
    amount: Number(payment.amount) || 0,
    type: payment.type || '',
    references: payment.references || undefined
  }));
};

export const mapToTotalPurchase = (purchase: any): TotalPurchase => {
  const normalizeAmount = (amount: number | string | null): number => {
    if (!amount) return 0;
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount.toString().replace(',', '.'));
    return isNaN(numericAmount) ? 0 : numericAmount;
  };

  return {
    id: purchase.id || purchase.purchase_uuid,
    purchase_uuid: purchase.purchase_uuid,
    timestamp: purchase.timestamp,
    amount: normalizeAmount(purchase.amount),
    user_display_name: purchase.user_display_name,
    payment_type: purchase.payment_type || null,
    product_name: purchase.product_name || null,
    source: purchase.source || 'new',
    created_at: purchase.created_at,
    updated_at: purchase.updated_at,
    refunded: purchase.refunded || false,
    refund_uuid: purchase.refund_uuid || null,
    refund_timestamp: purchase.refund_timestamp || null,
    payments: purchase.payments,
    cost_price: purchase.cost_price,
    currency: purchase.currency,
    country: purchase.country,
    purchase_number: purchase.purchase_number,
    gps_coordinates: purchase.gps_coordinates,
    products: purchase.products,
    vat_amount: purchase.vat_amount
  };
};

export type { LegacyPurchaseFormat } from "@/types/purchase";