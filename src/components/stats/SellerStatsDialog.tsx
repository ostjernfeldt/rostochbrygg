import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      
      const { data: sales, error } = await supabase
        .from("purchases")
        .select("User Display Name, Amount")
        .not("User Display Name", "is", null)
        .not("Amount", "is", null);

      if (error) throw error;
      if (!sales || sales.length === 0) return [];

      // Group sales by seller
      const sellerStats = sales.reduce<Record<string, { total: number; count: number }>>(
        (acc, sale) => {
          const sellerName = sale["User Display Name"];
          if (!acc[sellerName]) {
            acc[sellerName] = { total: 0, count: 0 };
          }
          acc[sellerName].total += Number(sale.Amount);
          acc[sellerName].count += 1;
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
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>
          {type === "sales" ? "Antal sälj per säljare" : "Snittordervärde per säljare"}
        </DialogTitle>
        <div className="space-y-4 mt-4">
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
      </DialogContent>
    </Dialog>
  );
};