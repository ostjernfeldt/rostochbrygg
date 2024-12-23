import { TotalPurchase } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  const processedTransactions: TotalPurchase[] = [];
  const refundMap = new Map<string, TotalPurchase>();
  
  // First pass: collect all refunds and match them with original transactions
  rawTransactions.forEach(transaction => {
    if (transaction.amount < 0) {
      // Find the original transaction by matching payment_uuid with refund_uuid
      const originalTransaction = rawTransactions.find(t => 
        t.payment_uuid === transaction.refund_uuid && t.amount > 0
      );
      
      if (originalTransaction) {
        console.log("Found matching original transaction for refund:", originalTransaction);
        originalTransaction.refunded = true;
        originalTransaction.refund_timestamp = transaction.timestamp;
        originalTransaction.refund_uuid = transaction.purchase_uuid;
      } else {
        console.log("No matching original transaction found for refund:", transaction);
      }
    }
  });

  // Second pass: add only non-refund transactions to the final list
  rawTransactions.forEach(transaction => {
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