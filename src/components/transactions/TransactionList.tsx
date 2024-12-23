import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import { PageLayout } from "@/components/PageLayout";
import { UserFilter } from "@/components/transactions/UserFilter";
import { TransactionStats } from "@/components/transactions/TransactionStats";
import { TransactionListHeader } from "@/components/transactions/TransactionListHeader";
import { TransactionListContent } from "@/components/transactions/TransactionListContent";
import { processTransactions } from "./TransactionProcessor";
import type { TotalPurchase } from "@/types/purchase";

const TransactionList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["latestTransactions", dateParam],
    queryFn: async () => {
      console.log("Fetching transactions for date:", dateParam);
      
      let startOfDay: Date;
      let endOfDay: Date;

      if (dateParam) {
        startOfDay = new Date(dateParam);
        endOfDay = new Date(dateParam);
      } else {
        startOfDay = new Date();
        const latestDateResult = await supabase
          .from("total_purchases")
          .select("timestamp")
          .order("timestamp", { ascending: false })
          .limit(1);

        if (latestDateResult.data && latestDateResult.data.length > 0) {
          startOfDay = new Date(latestDateResult.data[0].timestamp);
        }
        endOfDay = new Date(startOfDay);
      }

      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setHours(23, 59, 59, 999);

      console.log("Fetching transactions between:", {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });

      const { data: salesData, error: salesError } = await supabase
        .from("total_purchases")
        .select()
        .gte("timestamp", startOfDay.toISOString())
        .lte("timestamp", endOfDay.toISOString())
        .order("timestamp", { ascending: false });

      if (salesError) {
        console.error("Error fetching sales data:", salesError);
        throw salesError;
      }

      console.log("Fetched transactions:", salesData);
      return {
        transactions: processTransactions(salesData || []),
        date: startOfDay
      };
    }
  });

  // Filter transactions based on selected user
  const filteredTransactions = transactions?.transactions
    ? selectedUser === 'all'
      ? transactions.transactions
      : transactions.transactions.filter(t => t.user_display_name === selectedUser)
    : [];

  return (
    <PageLayout>
      <TransactionListHeader date={transactions?.date || null} />

      {transactions?.transactions && (
        <div className="mb-6">
          <SalesChart 
            transactions={filteredTransactions.map(t => ({
              Timestamp: t.timestamp,
              Amount: Number(t.amount),
              "User Display Name": t.user_display_name || '',
              "Payment Type": t.payment_type || undefined,
              "Product Name": t.product_name || undefined
            }))} 
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

      <TransactionListContent 
        isLoading={isLoading}
        transactions={filteredTransactions}
      />
    </PageLayout>
  );
};

export default TransactionList;