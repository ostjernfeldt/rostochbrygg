import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { StatCard } from "./StatCard";
import { 
  calculateTopSeller,
  calculateHighestSale,
  calculateTopAverageValue,
  calculateTopPresence
} from "@/utils/statsCalculations";

export const AllTimeStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["allTimeStats"],
    queryFn: async () => {
      console.log("Fetching all-time stats...");
      
      const { data: sales, error: salesError } = await supabase
        .from("purchases")
        .select()
        .not("User Display Name", "is", null)
        .not("Amount", "is", null);

      if (salesError) throw salesError;
      if (!sales || sales.length === 0) return null;

      return {
        topAccumulatedSeller: calculateTopSeller(sales),
        highestSale: calculateHighestSale(sales),
        topAverageValue: calculateTopAverageValue(sales),
        topPresence: calculateTopPresence(sales)
      };
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="text-yellow-500" size={24} />
        All-time Topplista
      </h2>

      <StatCard
        title="Högst ackumulerad försäljning"
        userName={stats.topAccumulatedSeller["User Display Name"]}
        value={`SEK ${Math.round(stats.topAccumulatedSeller.value).toLocaleString()}`}
      />

      <StatCard
        title="Högsta registrerade sälj"
        userName={stats.highestSale["User Display Name"]}
        value={`SEK ${Math.round(stats.highestSale.value).toLocaleString()}`}
        animationDelay="200ms"
      />

      <StatCard
        title="Högsta snittordervärde"
        userName={stats.topAverageValue["User Display Name"]}
        value={`SEK ${Math.round(stats.topAverageValue.value).toLocaleString()}`}
        animationDelay="400ms"
      />

      <StatCard
        title="Högst snittnärvaro per vecka"
        userName={stats.topPresence["User Display Name"]}
        value={`${Math.round(stats.topPresence.value)} pass`}
        animationDelay="600ms"
      />
    </div>
  );
};