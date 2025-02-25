
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

  // First, get all refund transactions
  const refundTransactions = transactions.filter(t => t.refund_uuid !== null);
  
  // Create a map of refunds using refund_uuid as key
  const refundMap = new Map<string, string>();
  refundTransactions.forEach(refund => {
    if (refund.refund_uuid) {
      refundMap.set(refund.refund_uuid, refund.timestamp);
    }
  });

  // Process transactions and mark refunded ones
  const processedTransactions = transactions
    .filter(transaction => transaction.refund_uuid === null) // Only show original transactions
    .map(transaction => ({
      ...transaction,
      refunded: transaction.payment_uuid ? refundMap.has(transaction.payment_uuid) : false,
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
