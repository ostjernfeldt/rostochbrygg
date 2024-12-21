import { TotalPurchase } from "@/types/purchase";
import { getValidTotalAmount } from "./TransactionProcessor";

interface TransactionStatsProps {
  transactions: TotalPurchase[];
  selectedUser: string;
}

export const TransactionStats = ({ transactions, selectedUser }: TransactionStatsProps) => {
  const selectedUserTotal = getValidTotalAmount(transactions);

  if (selectedUser === 'all') return null;

  return (
    <div className="p-4 bg-card rounded-xl border border-primary/20">
      <span className="text-gray-400">Total försäljning:</span>
      <span className="ml-2 text-xl font-bold">SEK {selectedUserTotal.toLocaleString()}</span>
    </div>
  );
};