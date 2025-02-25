import { TotalPurchase } from "@/types/purchase";
import { TransactionCard } from "./TransactionCard";

interface TransactionListContentProps {
  isLoading: boolean;
  transactions: TotalPurchase[];
}

export const TransactionListContent = ({ isLoading, transactions }: TransactionListContentProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card rounded-xl p-4">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center text-gray-400 mt-8">
        Inga transaktioner hittades
      </div>
    );
  }

  // Create a map for refund information
  const refundMap = new Map<string, string>();
  const refundedPaymentUuids = new Set<string>();
  
  // First pass: Find all refunds and their original payment UUIDs
  transactions.forEach(transaction => {
    if (transaction.refund_uuid) {
      // Store the refund timestamp
      refundMap.set(transaction.refund_uuid, transaction.timestamp);
      // Mark this as a refunded transaction
      refundedPaymentUuids.add(transaction.refund_uuid);
    }
  });

  // Get original transactions and add refund information
  const processedTransactions = transactions
    .filter(transaction => {
      // Keep only if:
      // 1. It's not a refund transaction (no refund_uuid)
      // 2. If it has a payment_uuid, check if we should include it
      if (transaction.refund_uuid) {
        return false;
      }
      
      // For transactions with payment_uuid, only include if it matches a refund
      // or if it's not in our refunded set
      if (transaction.payment_uuid) {
        return true; // We'll handle refund status in the map
      }
      
      return true; // Include transactions without payment_uuid
    })
    .map(transaction => ({
      ...transaction,
      refunded: transaction.payment_uuid ? refundedPaymentUuids.has(transaction.payment_uuid) : false,
      refund_timestamp: transaction.payment_uuid ? refundMap.get(transaction.payment_uuid) : null
    }));

  // Sort by timestamp
  const sortedTransactions = processedTransactions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedTransactions.map((transaction) => (
        <TransactionCard 
          key={transaction.purchase_uuid} 
          transaction={transaction}
        />
      ))}
    </div>
  );
};
