import { TotalPurchase } from "@/types/purchase";

export const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
  const processedTransactions: TotalPurchase[] = [];
  const sortedTransactions = [...rawTransactions].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Keep track of processed negative transactions to avoid duplicates
  const processedNegativeTransactions = new Set<string>();

  for (let i = 0; i < sortedTransactions.length; i++) {
    const currentTransaction = sortedTransactions[i];
    
    if (processedNegativeTransactions.has(currentTransaction.id)) {
      continue;
    }

    if (currentTransaction.amount > 0) {
      // Look ahead for a matching refund
      let isRefunded = false;
      let refundTimestamp = null;
      let refundId = null;

      for (let j = i + 1; j < sortedTransactions.length; j++) {
        const potentialRefund = sortedTransactions[j];
        
        if (
          potentialRefund.amount === -currentTransaction.amount &&
          potentialRefund.user_display_name === currentTransaction.user_display_name
        ) {
          // Check if there are any other transactions by the same user between these timestamps
          const transactionsBetween = sortedTransactions.slice(i + 1, j).filter(t => 
            t.user_display_name === currentTransaction.user_display_name &&
            t.id !== potentialRefund.id
          );

          if (transactionsBetween.length === 0) {
            isRefunded = true;
            refundTimestamp = potentialRefund.timestamp;
            refundId = potentialRefund.id;
            processedNegativeTransactions.add(potentialRefund.id);
            break;
          }
        }
      }

      processedTransactions.push({
        ...currentTransaction,
        refunded: isRefunded,
        refund_timestamp: refundTimestamp,
        refund_uuid: refundId
      });
    } else if (currentTransaction.amount < 0 && !processedNegativeTransactions.has(currentTransaction.id)) {
      // If it's a negative amount that hasn't been matched to a purchase, add it separately
      processedTransactions.push(currentTransaction);
    }
  }

  return processedTransactions;
};

// Helper function to get only valid (non-refunded, positive amount) transactions
export const getValidTransactions = (transactions: TotalPurchase[]): TotalPurchase[] => {
  return transactions.filter(t => !t.refunded && t.amount > 0);
};

// Helper function to count valid sales (excluding refunds)
export const getValidSalesCount = (transactions: TotalPurchase[]): number => {
  return getValidTransactions(transactions).length;
};

// Helper function to calculate total valid amount
export const getValidTotalAmount = (transactions: TotalPurchase[]): number => {
  return getValidTransactions(transactions).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};