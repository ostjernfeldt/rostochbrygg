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

  // Create a map to store refund info using payment_uuid as key
  const refundMap = new Map<string, TotalPurchase>();
  
  // First pass: Find all refunds and map them by the original transaction's payment_uuid
  transactions.forEach(transaction => {
    if (transaction.refund_uuid) {
      refundMap.set(transaction.refund_uuid, transaction);
    }
  });

  // Second pass: Process original transactions and add refund info
  const processedTransactions = transactions
    .filter(transaction => {
      // Only keep transactions that are not refunds themselves
      return !transaction.refund_uuid;
    })
    .map(transaction => {
      const refund = transaction.payment_uuid ? refundMap.get(transaction.payment_uuid) : null;
      return {
        ...transaction,
        refunded: !!refund,
        refund_timestamp: refund?.timestamp || null
      };
    });

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
