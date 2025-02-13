
import { TotalPurchase } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  const processedTransactions: TotalPurchase[] = [];
  
  // Sort transactions by timestamp to ensure we process original purchases before refunds
  const sortedTransactions = [...rawTransactions].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // First pass: mark transactions that have been refunded
  sortedTransactions.forEach(transaction => {
    // If this transaction has a refund_uuid, it means it's a refund transaction
    if (transaction.refund_uuid) {
      console.log("Found refund transaction:", {
        timestamp: transaction.timestamp,
        amount: transaction.amount,
        refund_uuid: transaction.refund_uuid
      });

      // Find the original transaction that was refunded
      const originalTransaction = sortedTransactions.find(t => 
        t.payment_uuid === transaction.refund_uuid ||
        t.purchase_uuid === transaction.refund_uuid // Added this condition
      );

      if (originalTransaction) {
        console.log("Marking original transaction as refunded:", {
          originalTimestamp: originalTransaction.timestamp,
          refundTimestamp: transaction.timestamp,
          amount: originalTransaction.amount
        });
        
        originalTransaction.refunded = true;
        originalTransaction.refund_timestamp = transaction.timestamp;
      }
    }

    // For historical transactions that don't have payment_uuid/refund_uuid
    if (transaction.amount < 0) {
      console.log("Processing negative amount transaction:", {
        timestamp: transaction.timestamp,
        amount: transaction.amount,
        user: transaction.user_display_name
      });

      // Try to find matching original transaction
      const originalTransaction = sortedTransactions.find(t => 
        !t.refunded && // not already marked as refunded
        t.amount > 0 && // positive amount (original purchase)
        Math.abs(Number(t.amount)) === Math.abs(Number(transaction.amount)) &&
        t.user_display_name === transaction.user_display_name &&
        new Date(t.timestamp).getTime() < new Date(transaction.timestamp).getTime()
      );

      if (originalTransaction) {
        console.log("Found matching original transaction for historical refund:", {
          originalTimestamp: originalTransaction.timestamp,
          refundTimestamp: transaction.timestamp,
          amount: originalTransaction.amount
        });
        
        originalTransaction.refunded = true;
        originalTransaction.refund_timestamp = transaction.timestamp;
      }
    }
  });

  // Second pass: add all transactions to the final list, not just positive ones
  sortedTransactions.forEach(transaction => {
    processedTransactions.push(transaction);
  });

  // Log final processed transactions for debugging
  console.log("Final processed transactions:", processedTransactions.map(t => ({
    timestamp: t.timestamp,
    amount: t.amount,
    refunded: t.refunded,
    refund_timestamp: t.refund_timestamp,
    payment_uuid: t.payment_uuid,
    refund_uuid: t.refund_uuid
  })));

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
