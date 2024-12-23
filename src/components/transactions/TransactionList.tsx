import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import { PageLayout } from "@/components/PageLayout";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { UserFilter } from "@/components/transactions/UserFilter";
import { TransactionStats } from "@/components/transactions/TransactionStats";
import { processTransactions, getValidTransactions } from "./TransactionProcessor";
import type { LegacyPurchaseFormat, TotalPurchase } from "@/types/purchase";

const TransactionList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["latestTransactions", dateParam],
    queryFn: async () => {
      console.log("Fetching transactions for date:", dateParam);
      
      const startOfDay = new Date(dateParam || new Date());
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(dateParam || new Date());
      endOfDay.setHours(23, 59, 59, 999);

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

  // Get only valid transactions (non-refunded, positive amounts)
  const validTransactions = getValidTransactions(filteredTransactions);

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
          transactions={validTransactions}
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