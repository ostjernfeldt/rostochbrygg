import { TotalPurchase } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  console.log("Processing transactions...");
  const processedTransactions: TotalPurchase[] = [];
  
  // Sort transactions by timestamp to ensure we process original purchases before refunds
  const sortedTransactions = [...rawTransactions].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // First pass: collect all refunds and match them with original transactions
  sortedTransactions.forEach(transaction => {
    if (transaction.amount < 0) {
      console.log("Processing refund:", {
        amount: transaction.amount,
        payment_uuid: transaction.payment_uuid,
        refund_uuid: transaction.refund_uuid,
        product: transaction.product_name,
        user: transaction.user_display_name
      });

      // Try to find the original transaction
      const originalTransaction = sortedTransactions.find(t => {
        // First try to match using payment_uuid and refund_uuid
        if (transaction.refund_uuid && t.payment_uuid === transaction.refund_uuid) {
          console.log("Found match by payment_uuid/refund_uuid");
          return true;
        }
        
        // For historical transactions or when UUIDs are not available,
        // match based on amount, product name, and user
        const amountMatch = Math.abs(Number(t.amount)) === Math.abs(Number(transaction.amount));
        const productMatch = t.product_name === transaction.product_name;
        const userMatch = t.user_display_name === transaction.user_display_name;
        const timeMatch = new Date(t.timestamp).getTime() < new Date(transaction.timestamp).getTime();
        const notRefunded = !t.refunded; // Make sure we haven't already marked this as refunded

        if (amountMatch && productMatch && userMatch && timeMatch && notRefunded) {
          console.log("Found match by amount/product/user:", {
            originalTimestamp: t.timestamp,
            refundTimestamp: transaction.timestamp,
            amount: t.amount,
            product: t.product_name,
            user: t.user_display_name
          });
          return true;
        }

        return false;
      });
      
      if (originalTransaction) {
        console.log("Marking transaction as refunded:", {
          originalTransaction: {
            timestamp: originalTransaction.timestamp,
            amount: originalTransaction.amount,
            payment_uuid: originalTransaction.payment_uuid
          },
          refund: {
            timestamp: transaction.timestamp,
            amount: transaction.amount,
            refund_uuid: transaction.refund_uuid
          }
        });
        
        // Mark the original transaction as refunded and store refund details
        originalTransaction.refunded = true;
        originalTransaction.refund_timestamp = transaction.timestamp;
        originalTransaction.refund_uuid = transaction.purchase_uuid;
      } else {
        console.warn("No matching original transaction found for refund:", {
          timestamp: transaction.timestamp,
          amount: transaction.amount,
          product: transaction.product_name,
          user: transaction.user_display_name,
          payment_uuid: transaction.payment_uuid,
          refund_uuid: transaction.refund_uuid
        });
      }
    }
  });

  // Second pass: add only non-refund transactions to the final list
  sortedTransactions.forEach(transaction => {
    if (transaction.amount > 0) {
      processedTransactions.push(transaction);
    }
  });

  // Log the final processed transactions for debugging
  console.log("Final processed transactions:", processedTransactions.map(t => ({
    timestamp: t.timestamp,
    amount: t.amount,
    refunded: t.refunded,
    refund_timestamp: t.refund_timestamp,
    product: t.product_name,
    user: t.user_display_name
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