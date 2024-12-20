import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import { PageLayout } from "@/components/PageLayout";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { UserFilter } from "@/components/transactions/UserFilter";
import { TransactionStats } from "@/components/transactions/TransactionStats";
import type { LegacyPurchaseFormat, TotalPurchase } from "@/types/purchase";

const TransactionList = () => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["latestTransactions"],
    queryFn: async () => {
      console.log("Fetching transactions...");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayResult = await supabase
        .from("total_purchases")
        .select()
        .gte("timestamp", today.toISOString())
        .order("timestamp", { ascending: false });

      if (todayResult.error) {
        console.error("Error fetching today's transactions:", todayResult.error);
        throw todayResult.error;
      }

      console.log("Today's transactions:", todayResult.data);

      if (todayResult.data && todayResult.data.length > 0) {
        return {
          transactions: processTransactions(todayResult.data),
          date: today
        };
      }

      const latestDateResult = await supabase
        .from("total_purchases")
        .select("timestamp")
        .order("timestamp", { ascending: false })
        .limit(1);

      if (latestDateResult.error) {
        console.error("Error fetching latest date:", latestDateResult.error);
        throw latestDateResult.error;
      }

      if (!latestDateResult.data || latestDateResult.data.length === 0) {
        return {
          transactions: [],
          date: today
        };
      }

      const latestDate = new Date(latestDateResult.data[0].timestamp);
      latestDate.setHours(0, 0, 0, 0);
      
      const latestTransactions = await supabase
        .from("total_purchases")
        .select()
        .gte("timestamp", latestDate.toISOString())
        .lt("timestamp", new Date(latestDate.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .order("timestamp", { ascending: false });

      if (latestTransactions.error) {
        console.error("Error fetching latest transactions:", latestTransactions.error);
        throw latestTransactions.error;
      }

      console.log("Latest transactions:", latestTransactions.data);
      return {
        transactions: processTransactions(latestTransactions.data),
        date: latestDate
      };
    }
  });

  // Process transactions to identify refunds based on matching amounts and user names
  const processTransactions = (rawTransactions: TotalPurchase[]): TotalPurchase[] => {
    const processedTransactions: TotalPurchase[] = [];
    const sortedTransactions = [...rawTransactions].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Keep track of processed negative transactions to avoid duplicates
    const processedNegativeTransactions = new Set<string>();

    for (let i = 0; i < sortedTransactions.length; i++) {
      const currentTransaction = sortedTransactions[i];
      
      // Skip if this negative transaction has already been processed
      if (processedNegativeTransactions.has(currentTransaction.id)) {
        continue;
      }

      if (currentTransaction.amount > 0) {
        // Look ahead for a matching refund
        let isRefunded = false;
        let refundTimestamp = null;
        let refundId = null;

        for (let j = i + 1; j < sortedTransactions.length; j++) {
          const potentialRefund = sortedTransactions[j];
          
          // Check if this is a matching refund (same amount but negative, same user)
          if (
            potentialRefund.amount === -currentTransaction.amount &&
            potentialRefund.user_display_name === currentTransaction.user_display_name
          ) {
            // Check if there are any other transactions by the same user between these timestamps
            const transactionsBetween = sortedTransactions.slice(i + 1, j).filter(t => 
              t.user_display_name === currentTransaction.user_display_name &&
              t.id !== potentialRefund.id
            );

            if (transactionsBetween.length === 0) {
              isRefunded = true;
              refundTimestamp = potentialRefund.timestamp;
              refundId = potentialRefund.id;
              processedNegativeTransactions.add(potentialRefund.id);
              break;
            }
          }
        }

        processedTransactions.push({
          ...currentTransaction,
          refunded: isRefunded,
          refund_timestamp: refundTimestamp,
          refund_uuid: refundId
        });
      } else if (currentTransaction.amount < 0 && !processedNegativeTransactions.has(currentTransaction.id)) {
        // If it's a negative amount that hasn't been matched to a purchase, add it separately
        processedTransactions.push(currentTransaction);
      }
    }

    return processedTransactions;
  };

  // Filter transactions based on selected user
  const filteredTransactions = transactions?.transactions
    ? selectedUser === 'all'
      ? transactions.transactions
      : transactions.transactions.filter(t => t.user_display_name === selectedUser)
    : [];

  // Map the transactions to LegacyPurchaseFormat for the SalesChart
  // Only include non-refunded transactions with positive amounts
  const validTransactions = filteredTransactions.filter(t => !t.refunded && t.amount > 0);
  const legacyFormattedTransactions: LegacyPurchaseFormat[] = validTransactions.map(t => ({
    Timestamp: t.timestamp,
    Amount: Number(t.amount),
    "User Display Name": t.user_display_name || '',
    "Payment Type": t.payment_type || undefined,
    "Product Name": t.product_name || undefined
  }));

  return (
    <PageLayout>
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => navigate("/")}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">
          {transactions?.date ? `${format(transactions.date, 'd MMMM yyyy')} transaktioner` : 'Transaktioner'}
        </h1>
      </div>

      {transactions?.transactions && (
        <div className="mb-6">
          <SalesChart 
            transactions={legacyFormattedTransactions} 
            showAccumulatedPerTransaction={true}
          />
        </div>
      )}

      <div className="mb-4 space-y-2">
        <UserFilter 
          transactions={transactions?.transactions || []}
          selectedUser={selectedUser}
          onUserChange={setSelectedUser}
        />
        
        <TransactionStats 
          transactions={filteredTransactions}
          selectedUser={selectedUser}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card rounded-xl p-4">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredTransactions.length > 0 ? (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <TransactionCard 
              key={transaction.purchase_uuid} 
              transaction={transaction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-8">
          Inga transaktioner hittades
        </div>
      )}
    </PageLayout>
  );
};

export default TransactionList;
