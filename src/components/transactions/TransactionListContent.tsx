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

  // Filter out standalone refund transactions that are already shown as part of their original transaction
  const filteredTransactions = transactions.filter(transaction => {
    // Keep all positive amount transactions
    if (transaction.amount >= 0) return true;
    
    // For negative amounts (refunds), check if there's a matching original transaction
    const hasMatchingOriginal = transactions.some(t => 
      // Match by payment_uuid/refund_uuid
      (t.payment_uuid === transaction.refund_uuid) ||
      // Or by matching amounts and user (as fallback)
      (t.user_display_name === transaction.user_display_name &&
       Math.abs(Number(t.amount)) === Math.abs(Number(transaction.amount)) &&
       t.amount > 0 &&
       new Date(t.timestamp) < new Date(transaction.timestamp))
    );
    
    // Only keep refund transactions that don't have a matching original transaction
    return !hasMatchingOriginal;
  });

  // Sort transactions by timestamp
  const sortedTransactions = [...filteredTransactions].sort(
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
