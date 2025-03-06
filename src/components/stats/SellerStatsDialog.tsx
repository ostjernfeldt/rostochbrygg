
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processTransactions, getValidSalesCount } from "@/components/transactions/TransactionProcessor";
import { toast } from "sonner";

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
      
      // First get visible staff members
      const { data: visibleStaff, error: staffError } = await supabase
        .from("staff_roles")
        .select("user_display_name")
        .eq("hidden", false);

      if (staffError) {
        console.error("Error fetching staff:", staffError);
        toast.error("Kunde inte hämta säljare");
        throw staffError;
      }

      if (!visibleStaff || visibleStaff.length === 0) {
        console.log("No staff members found");
        return [];
      }

      const visibleStaffNames = new Set(visibleStaff.map(s => s.user_display_name));

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

      // Filter out data from hidden staff members
      const filteredTodaySales = todaySales?.filter(sale => 
        visibleStaffNames.has(sale.user_display_name!)
      ) || [];

      // If we have sales today, use them
      if (filteredTodaySales.length > 0) {
        console.log("Found sales for today:", filteredTodaySales.length);
        const processedSales = processTransactions(filteredTodaySales);
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

      // Filter out data from hidden staff members
      const filteredLatestSales = latestSales?.filter(sale => 
        visibleStaffNames.has(sale.user_display_name!)
      ) || [];

      console.log("Found sales for latest day:", filteredLatestSales.length);
      const processedSales = processTransactions(filteredLatestSales);
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
              <div className="text-center">
                Inga säljare med försäljningsdata hittades. Lägg till säljare i staff_roles tabellen och registrera försäljningar.
              </div>
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
