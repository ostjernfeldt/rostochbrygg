
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

  // Create a map of original transactions with their refunds
  const processedTransactions = transactions.reduce((acc, transaction) => {
    if (transaction.amount >= 0) {
      // This is an original purchase
      acc.set(transaction.purchase_uuid, {
        ...transaction,
        refunded: false,
        refund_timestamp: null
      });
    } else {
      // This is a refund, find the original transaction
      const originalTransaction = Array.from(acc.values()).find(t => 
        // Match by exact same products and user
        t.user_display_name === transaction.user_display_name &&
        Math.abs(Number(t.amount)) === Math.abs(Number(transaction.amount)) &&
        !t.refunded
      );

      if (originalTransaction) {
        acc.set(originalTransaction.purchase_uuid, {
          ...originalTransaction,
          refunded: true,
          refund_timestamp: transaction.timestamp
        });
      }
    }
    return acc;
  }, new Map<string, TotalPurchase>());

  // Convert map to array and sort by timestamp
  const sortedTransactions = Array.from(processedTransactions.values()).sort(
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
