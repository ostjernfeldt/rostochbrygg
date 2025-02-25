
import { TotalPurchase, Product } from "@/types/purchase";

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
        t.purchase_uuid === transaction.refund_uuid
      );

      if (originalTransaction) {
        const originalDate = new Date(originalTransaction.timestamp);
        const refundDate = new Date(transaction.timestamp);

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
      const originalTransaction = sortedTransactions.find(t => {
        if (t.refunded || t.amount <= 0) return false;
        
        // Check if amounts match (accounting for the negative refund amount)
        const amountsMatch = Math.abs(Number(t.amount)) === Math.abs(Number(transaction.amount));
        // Check if it's from the same user
        const sameUser = t.user_display_name === transaction.user_display_name;
        // Check if the refund happened before this transaction
        const correctOrder = new Date(t.timestamp).getTime() < new Date(transaction.timestamp).getTime();
        
        // Check if products match (if available)
        let productsMatch = true;
        if (t.products && transaction.products && Array.isArray(t.products) && Array.isArray(transaction.products)) {
          const originalProducts = JSON.stringify((t.products as Product[]).sort((a, b) => a.name.localeCompare(b.name)));
          const refundProducts = JSON.stringify((transaction.products as Product[]).sort((a, b) => a.name.localeCompare(b.name)));
          productsMatch = originalProducts === refundProducts;
        }
        
        return amountsMatch && sameUser && correctOrder && productsMatch;
      });

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
