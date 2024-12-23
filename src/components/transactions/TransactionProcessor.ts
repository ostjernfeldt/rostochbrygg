import { TotalPurchase } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  const processedTransactions: TotalPurchase[] = [];
  const refundMap = new Map<string, TotalPurchase>();
  
  // First pass: collect all refunds
  rawTransactions.forEach(transaction => {
    if (transaction.refund_uuid) {
      refundMap.set(transaction.refund_uuid, transaction);
    }
  });

  // Second pass: process all transactions
  rawTransactions.forEach(transaction => {
    // If this is a refund (negative amount)
    if (transaction.amount < 0) {
      const refundedTransaction = processedTransactions.find(
        t => t.payment_uuid === transaction.refund_uuid
      );
      if (refundedTransaction) {
        refundedTransaction.refunded = true;
        refundedTransaction.refund_timestamp = transaction.timestamp;
        refundedTransaction.refund_uuid = transaction.purchase_uuid;
      }
    }
    
    // If this transaction has been refunded (matched by payment_uuid)
    if (refundMap.has(transaction.payment_uuid || '')) {
      const refund = refundMap.get(transaction.payment_uuid || '');
      transaction.refunded = true;
      transaction.refund_timestamp = refund?.timestamp;
      transaction.refund_uuid = refund?.purchase_uuid;
    }
    
    processedTransactions.push(transaction);
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