import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processTransactions, getValidSalesCount } from "@/components/transactions/TransactionProcessor";

interface SellerStatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "sales" | "average";
}

interface SellerStats {
  "User Display Name": string;
  salesCount: number;
  averageValue: number;
}

export const SellerStatsDialog = ({ isOpen, onClose, type }: SellerStatsDialogProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["sellerStats", type],
    queryFn: async () => {
      console.log("Fetching seller stats...");
      
      // Get today's date range
      const today = new Date();
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      // First try to get today's sales
      const { data: todaySales, error: todayError } = await supabase
        .from("total_purchases")
        .select("*")
        .gte("timestamp", startOfToday.toISOString())
        .lte("timestamp", endOfToday.toISOString())
        .not("user_display_name", "is", null);

      if (todayError) {
        console.error("Error fetching today's sales:", todayError);
        throw todayError;
      }

      // If we have sales today, use them
      if (todaySales && todaySales.length > 0) {
        console.log("Found sales for today:", todaySales.length);
        const processedSales = processTransactions(todaySales);
        return calculateStats(processedSales);
      }

      // If no sales today, get the latest date with sales
      console.log("No sales today, fetching latest date with sales...");
      const { data: latestDateData, error: latestDateError } = await supabase
        .from("total_purchases")
        .select("timestamp")
        .not("user_display_name", "is", null)
        .order("timestamp", { ascending: false })
        .limit(1);

      if (latestDateError) {
        console.error("Error fetching latest date:", latestDateError);
        throw latestDateError;
      }

      if (!latestDateData || latestDateData.length === 0) {
        console.log("No sales data found at all");
        return [];
      }

      const latestDate = new Date(latestDateData[0].timestamp);
      const startOfLatestDay = new Date(latestDate);
      startOfLatestDay.setHours(0, 0, 0, 0);
      const endOfLatestDay = new Date(latestDate);
      endOfLatestDay.setHours(23, 59, 59, 999);

      // Get all sales for the latest day
      const { data: latestSales, error: latestSalesError } = await supabase
        .from("total_purchases")
        .select("*")
        .gte("timestamp", startOfLatestDay.toISOString())
        .lte("timestamp", endOfLatestDay.toISOString())
        .not("user_display_name", "is", null);

      if (latestSalesError) {
        console.error("Error fetching latest sales:", latestSalesError);
        throw latestSalesError;
      }

      console.log("Found sales for latest day:", latestSales.length);
      const processedSales = processTransactions(latestSales);
      return calculateStats(processedSales);
    }
  });

  const calculateStats = (sales: any[]) => {
    // Group sales by seller
    const sellerStats = sales.reduce<Record<string, { total: number; count: number }>>(
      (acc, sale) => {
        const sellerName = sale.user_display_name;
        if (!acc[sellerName]) {
          acc[sellerName] = { total: 0, count: 0 };
        }
        if (!sale.refunded) {
          acc[sellerName].total += Number(sale.amount);
          acc[sellerName].count += 1;
        }
        return acc;
      },
      {}
    );

    // Convert to array and calculate averages
    const statsArray: SellerStats[] = Object.entries(sellerStats).map(
      ([name, { total, count }]) => ({
        "User Display Name": name,
        salesCount: count,
        averageValue: Math.round(total / count)
      })
    );

    // Sort based on type
    return statsArray.sort((a, b) => 
      type === "sales" 
        ? b.salesCount - a.salesCount 
        : b.averageValue - a.averageValue
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>
          {type === "sales" ? "Antal sälj per säljare" : "Snittordervärde per säljare"}
          <div className="text-sm text-gray-400 font-normal mt-1">
            Statistik från senaste säljpasset
          </div>
        </DialogTitle>
        <ScrollArea className="h-[60vh] mt-4">
          <div className="space-y-4 pr-4">
            {isLoading ? (
              <div className="text-center">Laddar statistik...</div>
            ) : !stats || stats.length === 0 ? (
              <div className="text-center">Ingen data tillgänglig</div>
            ) : (
              stats.map((seller, index) => (
                <div
                  key={seller["User Display Name"]}
                  className="flex justify-between items-center p-4 bg-card rounded-lg"
                >
                  <div>
                    <div className="font-medium">{seller["User Display Name"]}</div>
                    <div className="text-sm text-gray-500">
                      {type === "sales" 
                        ? `${seller.salesCount} sälj`
                        : `SEK ${seller.averageValue.toLocaleString()}`
                      }
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    #{index + 1}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};