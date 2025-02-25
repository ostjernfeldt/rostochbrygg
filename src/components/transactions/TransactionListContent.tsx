
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

  // Separate refunds and original transactions
  const refunds = transactions.filter(t => t.amount < 0);
  const originalTransactions = transactions.filter(t => t.amount >= 0);

  // Process original transactions and add refund info
  const processedTransactions = originalTransactions.map(transaction => {
    // Find matching refund for this transaction
    const matchingRefund = refunds.find(
      refund => refund.refund_uuid === transaction.payment_uuid
    );

    return {
      ...transaction,
      refunded: !!matchingRefund,
      refund_timestamp: matchingRefund ? matchingRefund.timestamp : null
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
