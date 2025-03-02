
import { TotalPurchase, Product } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  return rawTransactions;
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
  // Optimize by using filter directly to avoid double array processing
  return transactions.filter(t => 
    !t.refunded && t.amount > 0 && 
    !(t.refund_timestamp && isSameDay(new Date(t.timestamp), new Date(t.refund_timestamp)))
  ).length;
};

export const getValidTotalAmount = (transactions: TotalPurchase[]): number => {
  // Optimize by doing filter and sum in a single pass
  return transactions.reduce((sum, t) => {
    if (!t.refunded && t.amount > 0 && 
        !(t.refund_timestamp && isSameDay(new Date(t.timestamp), new Date(t.refund_timestamp)))) {
      return sum + Number(t.amount);
    }
    return sum;
  }, 0);
};
