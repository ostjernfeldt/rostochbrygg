import { TotalPurchase } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  const processedTransactions: TotalPurchase[] = [];
  
  // First pass: collect all refunds and match them with original transactions
  rawTransactions.forEach(transaction => {
    if (transaction.amount < 0) {
      // Try to find the original transaction that this refund corresponds to
      const originalTransaction = rawTransactions.find(t => 
        t.amount > 0 && 
        t.product_name === transaction.product_name &&
        t.user_display_name === transaction.user_display_name &&
        new Date(t.timestamp).getTime() < new Date(transaction.timestamp).getTime() &&
        !t.refunded // Make sure we haven't already marked this as refunded
      );
      
      if (originalTransaction) {
        console.log("Found matching original transaction for refund:", {
          original: originalTransaction,
          refund: transaction
        });
        
        // Mark the original transaction as refunded and store refund details
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