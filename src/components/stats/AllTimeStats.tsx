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
        .not("user_display_name", "is", null)
        .not("amount", "is", null);

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
          <div key={i} className="hall-of-fame-card animate-pulse">
            <div className="h-6 bg-gray-700/50 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-700/50 rounded w-2/3"></div>
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
        R&B Hall of Fame
      </h2>

      <StatCard
        className="hall-of-fame-card hover:scale-[1.02] transition-all duration-300"
        title="Högst ackumulerad försäljning"
        userName={stats.topAccumulatedSeller.user_display_name}
        value={`SEK ${Math.round(stats.topAccumulatedSeller.value).toLocaleString()}`}
      />

      <StatCard
        className="hall-of-fame-card hover:scale-[1.02] transition-all duration-300"
        title="Högsta registrerade sälj"
        userName={stats.highestSale.user_display_name}
        value={`SEK ${Math.round(stats.highestSale.value).toLocaleString()}`}
        animationDelay="200ms"
      />

      <StatCard
        className="hall-of-fame-card hover:scale-[1.02] transition-all duration-300"
        title="Högsta snittordervärde"
        userName={stats.topAverageValue.user_display_name}
        value={`SEK ${Math.round(stats.topAverageValue.value).toLocaleString()}`}
        animationDelay="400ms"
      />

      <StatCard
        className="hall-of-fame-card hover:scale-[1.02] transition-all duration-300"
        title="Högst närvaro senaste 30 dagarna"
        userName={stats.topPresence.user_display_name}
        value={`${Math.round(stats.topPresence.value)} dagar`}
        animationDelay="600ms"
      />
    </div>
  );
};