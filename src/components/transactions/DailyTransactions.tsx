import { TransactionCard } from "@/components/transactions/TransactionCard";
import { TotalPurchase } from "@/types/purchase";

interface DailyTransactionsProps {
  transactions: TotalPurchase[];
  isLoading: boolean;
  selectedSeller: string;
}

export const DailyTransactions = ({ 
  transactions, 
  isLoading,
  selectedSeller 
}: DailyTransactionsProps) => {
  const filteredTransactions = selectedSeller === "all" 
    ? transactions 
    : transactions.filter(t => t.user_display_name === selectedSeller);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Transaktioner</h2>
      <div className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-card rounded-xl" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Inga transaktioner för detta datum
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.purchase_uuid}
              transaction={transaction}
            />
          ))
        )}
      </div>
    </div>
  );
};