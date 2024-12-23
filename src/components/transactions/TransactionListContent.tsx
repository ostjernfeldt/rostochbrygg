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

  // Group transactions by their related IDs
  const groupedTransactions = transactions.reduce((groups: TotalPurchase[][], transaction) => {
    // Try to find an existing group that this transaction belongs to
    const existingGroupIndex = groups.findIndex(group => 
      group.some(t => 
        // Match by payment_uuid/refund_uuid
        (t.payment_uuid && t.payment_uuid === transaction.refund_uuid) ||
        (t.refund_uuid && t.refund_uuid === transaction.payment_uuid) ||
        // Or by matching amounts (positive/negative) and user
        (t.user_display_name === transaction.user_display_name &&
         Math.abs(Number(t.amount)) === Math.abs(Number(transaction.amount)) &&
         ((t.amount > 0 && transaction.amount < 0) || (t.amount < 0 && transaction.amount > 0)))
      )
    );

    if (existingGroupIndex >= 0) {
      groups[existingGroupIndex].push(transaction);
    } else {
      groups.push([transaction]);
    }
    return groups;
  }, []);

  // Sort transactions within each group by timestamp
  const sortedGroups = groupedTransactions.map(group => 
    group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  );

  // Flatten the groups back into a single array
  const sortedTransactions = sortedGroups.flat();

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