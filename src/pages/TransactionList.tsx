import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import { PageLayout } from "@/components/PageLayout";
import { UserFilter } from "@/components/transactions/UserFilter";
import { TransactionStats } from "@/components/transactions/TransactionStats";
import { TransactionListHeader } from "@/components/transactions/TransactionListHeader";
import { TransactionListContent } from "@/components/transactions/TransactionListContent";
import type { LegacyPurchaseFormat } from "@/types/purchase";

const TransactionList = () => {
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
          transactions: todayResult.data,
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
        transactions: latestTransactions.data,
        date: latestDate
      };
    }
  });

  // Filter transactions based on selected user
  const filteredTransactions = transactions?.transactions
    ? selectedUser === 'all'
      ? transactions.transactions
      : transactions.transactions.filter(t => t.user_display_name === selectedUser)
    : [];

  // Get only valid transactions (non-refunded, positive amounts)
  const validTransactions = filteredTransactions.filter(t => !t.refunded && t.amount > 0);

  // Map the transactions to LegacyPurchaseFormat for the SalesChart
  const legacyFormattedTransactions: LegacyPurchaseFormat[] = validTransactions.map(t => ({
    Timestamp: t.timestamp,
    Amount: Number(t.amount),
    "User Display Name": t.user_display_name || '',
    "Payment Type": t.payment_type || undefined,
    "Product Name": t.product_name || undefined
  }));

  return (
    <PageLayout>
      <TransactionListHeader date={transactions?.date || null} />

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
          transactions={validTransactions}
          selectedUser={selectedUser}
        />
      </div>

      <TransactionListContent 
        isLoading={isLoading}
        transactions={filteredTransactions}
      />
    </PageLayout>
  );
};

export default TransactionList;