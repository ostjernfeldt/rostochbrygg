
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { TotalPurchase } from "@/types/purchase";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface DailyTransactionsProps {
  transactions: TotalPurchase[];
  isLoading: boolean;
  selectedSeller: string;
  selectedDate?: Date;
}

export const DailyTransactions = ({ 
  transactions, 
  isLoading,
  selectedSeller,
  selectedDate 
}: DailyTransactionsProps) => {
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

  // Filter transactions based on seller and process refunds
  const filteredTransactions = transactions
    .filter(t => {
      // First filter by seller
      if (selectedSeller !== "all" && t.user_display_name !== selectedSeller) {
        return false;
      }
      // Then remove refund transactions
      if (t.refund_uuid) {
        return false;
      }
      return true;
    })
    .map(transaction => ({
      ...transaction,
      refunded: transaction.payment_uuid ? refundedPaymentUuids.has(transaction.payment_uuid) : false,
      refund_timestamp: transaction.payment_uuid ? refundMap.get(transaction.payment_uuid) : null
    }));

  // Get the date from the first transaction, or use selectedDate, or fallback to current date
  const dateToShow = transactions.length > 0 
    ? new Date(transactions[0].timestamp) 
    : selectedDate || new Date();

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">
        Transaktioner {format(dateToShow, 'd MMMM', { locale: sv })}
      </h2>
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
