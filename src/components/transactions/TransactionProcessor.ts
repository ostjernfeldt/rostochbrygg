import { TotalPurchase } from "@/types/purchase";
import { mapToTotalPurchase } from "@/utils/purchaseMappers";

export const processTransactions = (rawTransactions: any[]): TotalPurchase[] => {
  const mappedTransactions = rawTransactions.map(mapToTotalPurchase);
  const processedTransactions: TotalPurchase[] = [];
  const sortedTransactions = [...mappedTransactions].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Keep track of refunded payment UUIDs
  const refundedPaymentUuids = new Set<string>();

  // First pass: collect all refunded payment UUIDs
  for (const transaction of sortedTransactions) {
    if (transaction.payments && Array.isArray(transaction.payments)) {
      for (const payment of transaction.payments) {
        if (payment.references?.refundsPayment) {
          refundedPaymentUuids.add(payment.references.refundsPayment);
        }
      }
    }
  }

  // Second pass: process transactions
  for (const transaction of sortedTransactions) {
    let isRefunded = false;

    // Check if any of this transaction's payments have been refunded
    if (transaction.payments && Array.isArray(transaction.payments)) {
      for (const payment of transaction.payments) {
        if (refundedPaymentUuids.has(payment.uuid)) {
          isRefunded = true;
          break;
        }
      }
    }

    // Add the transaction with updated refund status
    processedTransactions.push({
      ...transaction,
      refunded: isRefunded
    });
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