
import { TotalPurchase, Product } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log(`Processing ${rawTransactions.length} transactions...`);
  // Ensure we're not filtering out valid transactions
  return rawTransactions.filter(t => t.user_display_name !== null);
};

export const getValidTransactions = (transactions: TotalPurchase[]): TotalPurchase[] => {
  // Optimize by filtering in a single pass
  return transactions.filter(t => 
    !t.refunded && t.amount > 0 && 
    // Check if refund happened on a different day when there's a refund timestamp
    !(t.refund_timestamp && isSameDay(new Date(t.timestamp), new Date(t.refund_timestamp)))
  );
};

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

export const getValidSalesCount = (transactions: TotalPurchase[]): number => {
  // Use the same filter logic as getValidTransactions for consistency
  return getValidTransactions(transactions).length;
};

export const getValidTotalAmount = (transactions: TotalPurchase[]): number => {
  // Use the same filter logic and sum amounts in a single pass
  return getValidTransactions(transactions).reduce((sum, t) => sum + Number(t.amount), 0);
};
