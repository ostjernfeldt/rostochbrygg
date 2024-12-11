import { PageLayout } from "@/components/PageLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TransactionList = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("Timestamp", { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-4">Transaction List</h1>
      <div>
        {transactions && transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="mb-2">
              <p>{transaction.Timestamp}: {transaction.Amount} SEK</p>
            </div>
          ))
        ) : (
          <p>No transactions found.</p>
        )}
      </div>
    </PageLayout>
  );
};

export default TransactionList;
