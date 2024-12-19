import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const Index = () => {
  const { data: totalSales, isLoading } = useQuery({
    queryKey: ["latestDaySales"],
    queryFn: async () => {
      console.log("Fetching latest day sales...");
      
      // First get the latest date with sales
      const { data: dateData, error: dateError } = await supabase
        .from("total_purchases")
        .select("timestamp")
        .order("timestamp", { ascending: false })
        .limit(1);

      if (dateError) {
        console.error("Error fetching latest date:", dateError);
        throw dateError;
      }

      if (!dateData || dateData.length === 0) {
        console.log("No sales data found");
        return { total: 0, date: null };
      }

      const latestDate = new Date(dateData[0].timestamp);
      console.log("Latest date:", latestDate);

      // Get all sales for that date
      const startOfDay = new Date(latestDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(latestDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: sales, error: salesError } = await supabase
        .from("total_purchases")
        .select("amount")
        .gte("timestamp", startOfDay.toISOString())
        .lte("timestamp", endOfDay.toISOString());

      if (salesError) {
        console.error("Error fetching sales:", salesError);
        throw salesError;
      }

      const total = sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
      console.log("Total sales for latest day:", total);

      return {
        total,
        date: latestDate
      };
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-pulse">
          <div className="h-8 w-48 bg-card rounded mb-4 mx-auto"></div>
          <div className="h-12 w-64 bg-card rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold mb-4">Total försäljning</h1>
        {totalSales?.date ? (
          <>
            <p className="text-xl text-gray-400">
              {format(totalSales.date, 'd MMMM yyyy', { locale: sv })}
            </p>
            <p className="text-5xl font-bold text-primary">
              SEK {Math.round(totalSales.total).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-xl text-gray-400">Ingen försäljningsdata tillgänglig</p>
        )}
      </div>
    </div>
  );
};

export default Index;