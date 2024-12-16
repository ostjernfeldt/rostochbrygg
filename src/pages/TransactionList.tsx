import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import { PageLayout } from "@/components/PageLayout";

const TransactionList = () => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["latestTransactions"],
    queryFn: async () => {
      console.log("Fetching transactions...");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // First try to get today's transactions
      const todayResult = await supabase
        .from("purchases")
        .select("*")
        .gte("Timestamp", today.toISOString())
        .order("Timestamp", { ascending: false });

      if (todayResult.error) {
        console.error("Error fetching today's transactions:", todayResult.error);
        throw todayResult.error;
      }

      console.log("Today's transactions:", todayResult.data);

      // If we have transactions for today, return them
      if (todayResult.data && todayResult.data.length > 0) {
        return {
          transactions: todayResult.data,
          date: today
        };
      }

      // If no transactions today, find the latest date with transactions
      const latestDateResult = await supabase
        .from("purchases")
        .select("Timestamp")
        .order("Timestamp", { ascending: false })
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

      const latestDate = new Date(latestDateResult.data[0].Timestamp);
      latestDate.setHours(0, 0, 0, 0);
      
      // Get all transactions for the latest date
      const latestTransactions = await supabase
        .from("purchases")
        .select("*")
        .gte("Timestamp", latestDate.toISOString())
        .lt("Timestamp", new Date(latestDate.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .order("Timestamp", { ascending: false });

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

  // Get unique user display names from transactions
  const uniqueUsers = transactions?.transactions 
    ? Array.from(new Set(transactions.transactions.map(t => t["User Display Name"])))
    : [];

  // Filter transactions based on selected user
  const filteredTransactions = transactions?.transactions
    ? selectedUser === 'all'
      ? transactions.transactions
      : transactions.transactions.filter(t => t["User Display Name"] === selectedUser)
    : [];

  // Calculate total amount for selected user
  const selectedUserTotal = filteredTransactions.reduce((sum, transaction) => 
    sum + (transaction.Amount || 0), 0
  );

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

      {/* Sales Chart */}
      {transactions?.transactions && (
        <div className="mb-6">
          <SalesChart 
            transactions={transactions.transactions} 
            showAccumulatedPerTransaction={true}
          />
        </div>
      )}

      {/* User filter dropdown */}
      <div className="mb-4 space-y-2">
        <Select
          value={selectedUser}
          onValueChange={(value) => setSelectedUser(value)}
        >
          <SelectTrigger className="w-full bg-card border-primary/20">
            <SelectValue placeholder="Filtrera på säljare" />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            <SelectItem value="all">Alla säljare</SelectItem>
            {uniqueUsers.map((user) => (
              <SelectItem key={user} value={user || ''}>
                {user || 'Okänd säljare'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedUser !== 'all' && (
          <div className="p-4 bg-card rounded-xl border border-primary/20">
            <span className="text-gray-400">Total försäljning:</span>
            <span className="ml-2 text-xl font-bold">SEK {selectedUserTotal.toLocaleString()}</span>
          </div>
        )}
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
            <div key={transaction.id} className="bg-card rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400">
                  {format(new Date(transaction.Timestamp), "HH:mm")}
                </span>
                <span className="text-xl font-bold">
                  SEK {transaction.Amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-primary">{transaction["User Display Name"]}</span>
                  <span className="text-gray-400">{transaction["Payment Type"] || "Okänd betalningsmetod"}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Produkt: {transaction["Product Name"] || "Okänd produkt"}
                </div>
              </div>
            </div>
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