import { TotalPurchase } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  const processedTransactions: TotalPurchase[] = [];
  
  // First pass: collect all refunds and match them with original transactions
  rawTransactions.forEach(transaction => {
    if (transaction.amount < 0) {
      // Try to find the original transaction by matching payment_uuid with refund_uuid
      // or by matching amount, product, and user for historical transactions
      const originalTransaction = rawTransactions.find(t => {
        // First try to match using payment_uuid and refund_uuid
        if (transaction.refund_uuid && t.payment_uuid === transaction.refund_uuid) {
          return true;
        }
        
        // For historical transactions or when UUIDs are not available,
        // match based on amount, product name, and user
        return (
          Math.abs(Number(t.amount)) === Math.abs(Number(transaction.amount)) &&
          t.product_name === transaction.product_name &&
          t.user_display_name === transaction.user_display_name &&
          new Date(t.timestamp).getTime() < new Date(transaction.timestamp).getTime() &&
          !t.refunded // Make sure we haven't already marked this as refunded
        );
      });
      
      if (originalTransaction) {
        console.log("Found matching original transaction for refund:", {
          original: originalTransaction,
          refund: transaction,
          match: {
            originalPaymentUuid: originalTransaction.payment_uuid,
            refundUuid: transaction.refund_uuid,
            matchedByAmount: Math.abs(Number(originalTransaction.amount)) === Math.abs(Number(transaction.amount)),
            matchedByProduct: originalTransaction.product_name === transaction.product_name,
            matchedByUser: originalTransaction.user_display_name === transaction.user_display_name
          }
        });
        
        // Mark the original transaction as refunded and store refund details
        originalTransaction.refunded = true;
        originalTransaction.refund_timestamp = transaction.timestamp;
        originalTransaction.refund_uuid = transaction.purchase_uuid;
      } else {
        console.log("No matching original transaction found for refund:", {
          refund: transaction,
          refundUuid: transaction.refund_uuid,
          amount: Math.abs(Number(transaction.amount)),
          product: transaction.product_name,
          user: transaction.user_display_name,
          availableTransactions: rawTransactions
            .filter(t => t.amount > 0)
            .map(t => ({
              paymentUuid: t.payment_uuid,
              amount: Number(t.amount),
              product: t.product_name,
              user: t.user_display_name,
              timestamp: t.timestamp
            }))
        });
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