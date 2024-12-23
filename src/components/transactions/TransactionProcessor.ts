import { TotalPurchase } from "@/types/purchase";
import { mapToTotalPurchase } from "@/utils/purchaseMappers";
import { Json } from "@/types/json";

interface PaymentReference {
  refundsPayment?: string;
}

interface Payment {
  uuid: string;
  amount: number;
  type: string;
  references?: PaymentReference;
}

const parsePayment = (payment: Json | Payment): Payment | null => {
  if (typeof payment === 'string') return null;
  if (!payment || typeof payment !== 'object') return null;
  
  return {
    uuid: (payment as any).uuid || '',
    amount: Number((payment as any).amount) || 0,
    type: (payment as any).type || '',
    references: (payment as any).references
  };
};

const parsePayments = (payments: Json | Payment[] | null): Payment[] => {
  if (!payments) return [];
  if (!Array.isArray(payments)) return [];
  
  return payments.map(parsePayment).filter((p): p is Payment => p !== null);
};

export const processTransactions = (rawTransactions: any[]): TotalPurchase[] => {
  const mappedTransactions = rawTransactions.map(mapToTotalPurchase);
  const processedTransactions: TotalPurchase[] = [];
  const sortedTransactions = [...mappedTransactions].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Keep track of refunded payment UUIDs
  const refundedPaymentUuids = new Set<string>();
  const refundedTransactionUuids = new Set<string>();

  // First pass: collect all refunded payment UUIDs and their transactions
  for (const transaction of sortedTransactions) {
    const payments = parsePayments(transaction.payments);
    for (const payment of payments) {
      if (payment.references?.refundsPayment) {
        refundedPaymentUuids.add(payment.references.refundsPayment);
        // Find the original transaction that was refunded
        const originalTransaction = sortedTransactions.find(t => {
          const originalPayments = parsePayments(t.payments);
          return originalPayments.some(p => p.uuid === payment.references?.refundsPayment);
        });
        if (originalTransaction) {
          refundedTransactionUuids.add(originalTransaction.purchase_uuid);
        }
      }
    }
  }

  // Second pass: process transactions
  for (const transaction of sortedTransactions) {
    let isRefunded = false;
    const payments = parsePayments(transaction.payments);

    // Check if this transaction has been refunded
    if (refundedTransactionUuids.has(transaction.purchase_uuid)) {
      isRefunded = true;
    }

    // Check if any of this transaction's payments have been refunded
    for (const payment of payments) {
      if (refundedPaymentUuids.has(payment.uuid)) {
        isRefunded = true;
        break;
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