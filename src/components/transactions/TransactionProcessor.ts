
import { TotalPurchase, Product } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  return rawTransactions;
};

export const getValidTransactions = (transactions: TotalPurchase[]): TotalPurchase[] => {
  return transactions.filter(t => {
    // Om transaktionen redan är markerad som refunderad, exkludera den
    if (t.refunded) return false;

    // Om det är en positiv transaktion
    if (t.amount > 0) {
      // Om det finns ett refund_timestamp, kolla om refunden skedde samma dag
      if (t.refund_timestamp) {
        const saleDate = new Date(t.timestamp);
        const refundDate = new Date(t.refund_timestamp);
        
        // Om refunden skedde samma dag, exkludera transaktionen
        if (saleDate.getFullYear() === refundDate.getFullYear() &&
            saleDate.getMonth() === refundDate.getMonth() &&
            saleDate.getDate() === refundDate.getDate()) {
          return false;
        }
      }
      return true;
    }
    return false;
  });
};

export const getValidSalesCount = (transactions: TotalPurchase[]): number => {
  return getValidTransactions(transactions).length;
};

export const getValidTotalAmount = (transactions: TotalPurchase[]): number => {
  return getValidTransactions(transactions).reduce((sum, t) => sum + Number(t.amount), 0);
};
