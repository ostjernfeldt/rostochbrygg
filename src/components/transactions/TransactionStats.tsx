import { TotalPurchase } from "@/types/purchase";

interface TransactionStatsProps {
  transactions: TotalPurchase[];
  selectedUser: string;
}

export const TransactionStats = ({ transactions, selectedUser }: TransactionStatsProps) => {
  // Filter out refunded transactions and negative amounts (refunds)
  const validTransactions = transactions.filter(t => !t.refunded && t.amount > 0);
  
  const selectedUserTotal = validTransactions.reduce((sum, transaction) => 
    sum + (Number(transaction.amount) || 0), 0
  );

  if (selectedUser === 'all') return null;

  return (
    <div className="p-4 bg-card rounded-xl border border-primary/20">
      <span className="text-gray-400">Total försäljning:</span>
      <span className="ml-2 text-xl font-bold">SEK {selectedUserTotal.toLocaleString()}</span>
    </div>
  );
};