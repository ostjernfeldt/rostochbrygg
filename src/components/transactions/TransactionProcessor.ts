import { TotalPurchase } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  const processedTransactions: TotalPurchase[] = [];
  const refundMap = new Map<string, TotalPurchase>();
  
  // First pass: collect all refunds
  rawTransactions.forEach(transaction => {
    if (transaction.amount < 0) {
      refundMap.set(transaction.payment_uuid || '', transaction);
    }
  });

  // Second pass: process all transactions
  rawTransactions.forEach(transaction => {
    // If this transaction has been refunded
    if (refundMap.has(transaction.payment_uuid || '')) {
      const refund = refundMap.get(transaction.payment_uuid || '');
      transaction.refunded = true;
      transaction.refund_timestamp = refund?.timestamp;
      transaction.refund_uuid = refund?.purchase_uuid;
    }
    
    // Only add non-refund transactions to the list
    // Refunds will be shown as part of their original transaction
    if (transaction.amount > 0) {
      processedTransactions.push(transaction);
    }
  });

  console.log("Processed transactions:", processedTransactions);
  return processedTransactions;
};

export const getValidTransactions = (transactions: TotalPurchase[]): TotalPurchase[] => {
  return transactions.filter(t => !t.refunded && t.amount > 0);
};

export const getValidSalesCount = (transactions: TotalPurchase[]): number => {
  return getValidTransactions(transactions).length;
};

export const getValidTotalAmount = (transactions: TotalPurchase[]): number => {
  return getValidTransactions(transactions).reduce((sum, t) => sum + Number(t.amount), 0);
};