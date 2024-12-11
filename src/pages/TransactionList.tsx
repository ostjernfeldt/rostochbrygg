import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const TransactionList = () => {
  const navigate = useNavigate();
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["todaysTransactions"],
    queryFn: async () => {
      console.log("Fetching today's transactions...");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .gte("Timestamp", today.toISOString())
        .order("Timestamp", { ascending: false });
        
      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
      
      console.log("Fetched transactions:", data);
      return data;
    }
  });

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => navigate("/")}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Dagens transaktioner</h1>
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
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="bg-card rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400">
                  {format(new Date(transaction.Timestamp), "HH:mm")}
                </span>
                <span className="text-xl font-bold">
                  SEK {transaction.Amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary">{transaction["User Display Name"]}</span>
                <span className="text-gray-400">{transaction["Payment Type"] || "Okänd betalningsmetod"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-8">
          Inga transaktioner idag
        </div>
      )}
    </div>
  );
};

export default TransactionList;