
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  const { data: totalSales, isLoading } = useQuery({
    queryKey: ["latestDaySales"],
    queryFn: async () => {
      console.log("Fetching latest day sales...");
      
      // First get the latest date with sales
      const { data: dateData, error: dateError } = await supabase
        .from("total_purchases")
        .select("timestamp")
        .order('timestamp', { ascending: false })
        .limit(1);

      if (dateError) {
        console.error("Error fetching latest date:", dateError);
        throw dateError;
      }

      if (!dateData || dateData.length === 0) {
        console.log("No sales data found");
        return { total: 0, date: null, percentageChange: 0 };
      }

      const latestDate = new Date(dateData[0].timestamp);
      console.log("Latest date:", latestDate);

      // Get all sales for the latest date
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

      // Get the day before
      const dayBefore = new Date(latestDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const startOfDayBefore = new Date(dayBefore);
      startOfDayBefore.setHours(0, 0, 0, 0);
      
      const endOfDayBefore = new Date(dayBefore);
      endOfDayBefore.setHours(23, 59, 59, 999);

      // Get sales from the day before for comparison
      const { data: previousSales, error: previousError } = await supabase
        .from("total_purchases")
        .select("amount")
        .gte("timestamp", startOfDayBefore.toISOString())
        .lte("timestamp", endOfDayBefore.toISOString());

      if (previousError) {
        console.error("Error fetching previous day sales:", previousError);
        // Continue even if we can't get previous day data
      }

      const total = sales.reduce(
        (sum, sale) => sum + (Number(sale.amount) || 0),
        0
      );

      const previousTotal = previousSales?.reduce(
        (sum, sale) => sum + (Number(sale.amount) || 0),
        0
      ) || 0;

      const percentageChange = previousTotal > 0 
        ? ((total - previousTotal) / previousTotal) * 100 
        : 0;

      console.log("Total sales for latest day:", total);
      console.log("Previous day total:", previousTotal);
      console.log("Percentage change:", percentageChange);

      return {
        total,
        date: latestDate,
        percentageChange
      };
    }
  });

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-8">
      <div className="h-6 w-48 bg-card rounded-md mx-auto"></div>
      <div className="h-12 w-64 bg-card rounded-md mx-auto"></div>
      <div className="h-4 w-32 bg-card rounded-md mx-auto"></div>
    </div>
  );

  return (
    <PageLayout>
      <div className="max-w-md mx-auto">
        <Card className="bg-gradient-to-b from-card to-card/80 shadow-lg border-white/10">
          <CardContent className="p-8">
            {isLoading ? (
              renderSkeleton()
            ) : (
              <div className="text-center space-y-6">
                <h1 className={`font-bold text-white mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  Total försäljning
                </h1>
                
                {totalSales?.date ? (
                  <>
                    <p className="text-gray-400 mb-4">
                      {format(totalSales.date, 'd MMMM yyyy', { locale: sv })}
                    </p>
                    
                    <div className="flex flex-col items-center">
                      <p className={`font-bold text-primary ${isMobile ? 'text-4xl' : 'text-5xl'}`}>
                        SEK {Math.round(totalSales.total).toLocaleString()}
                      </p>
                      
                      {totalSales.percentageChange !== 0 && (
                        <div className={`flex items-center mt-3 ${totalSales.percentageChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {totalSales.percentageChange > 0 ? (
                            <ArrowUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDown className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-sm font-medium">
                            {Math.abs(Math.round(totalSales.percentageChange))}% jämfört med igår
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xl text-gray-400">
                    Ingen försäljningsdata tillgänglig
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Index;
