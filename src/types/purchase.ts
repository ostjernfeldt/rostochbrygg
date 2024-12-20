export interface DatabasePurchase {
  id?: string;
  amount: string | number;
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
  source?: string;
}

export interface TotalPurchase {
  id: string;
  purchase_uuid: string;
  timestamp: string;
  amount: number;
  user_display_name: string | null;
  payment_type: string | null;
  product_name: string | null;
  source: string;
  created_at: string | null;
  updated_at: string | null;
  refunded: boolean | null;
  refund_uuid: string | null;
  refund_timestamp?: string;
}

export interface LegacyPurchaseFormat {
  Timestamp: string;
  Amount: number;
  "User Display Name": string;
  "Payment Type"?: string;
  "Product Name"?: string;
}

export interface StaffMemberStats {
  displayName: string;
  firstSale: Date;
  totalAmount: number;
  averageAmount: number;
  daysActive: number;
  salesCount: number;
  totalSales?: number;
  sales: TotalPurchase[];
  shifts: {
    id: string;
    presence_start: string;
    totalSales: number;
    sales: TotalPurchase[];
  }[];
}