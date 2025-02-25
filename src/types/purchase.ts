
import { Json } from "./json";

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

export interface PaymentReference {
  refundsPayment?: string;
}

export interface Payment {
  uuid: string;
  amount: number;
  type: string;
  references?: PaymentReference;
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
  refund_timestamp?: string | null;
  payment_uuid: string | null;
  payments?: Json | Payment[] | null;
  cost_price?: number | null;
  currency?: string | null;
  country?: string | null;
  purchase_number?: number | null;
  gps_coordinates?: Json | null;
  products?: Json | null;
  vat_amount?: number | null;
  quantity?: number | null;
}

export interface StaffMemberStats {
  displayName: string;
  firstSale: Date;
  totalAmount: number;
  totalPoints: number;
  averagePoints: number;
  averageAmount: number;
  daysActive: number;
  salesCount: number;
  totalSales?: number;
  sales: TotalPurchase[];
}
