
import { StatCard } from "@/components/stats/StatCard";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { RoleProgressBar } from "./RoleProgressBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StaffStatsProps {
  stats: {
    salesCount: number;
    averagePoints: number;
    activeDays: number;
    firstSaleDate: string;
    bestDay: {
      date: string;
      points: number;
    };
    highestSale: {
      date: string;
      points: number;
    };
    worstDay: {
      date: string;
      points: number;
    };
  };
  userDisplayName: string;
}

// Define types for our database tables
interface RoleLevel {
  id: string;
  title: string;
  points_threshold: number;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

interface HistoricalPoints {
  id: string;
  user_display_name: string;
  points: number;
  updated_at?: string;
  updated_by?: string;
}

export const StaffStats = ({ stats, userDisplayName }: StaffStatsProps) => {
  // Adjust statistics to exclude refunded purchases
  const cleanStats = {
    ...stats,
    // If we have data for average points, use it, otherwise 0
    averagePoints: stats.averagePoints || 0,
    // If we have data for highest sale, use it, otherwise an empty object with 0 points
    highestSale: stats.highestSale || { date: new Date().toISOString(), points: 0 },
    // If we have data for best day, use it, otherwise an empty object with 0 points
    bestDay: stats.bestDay || { date: new Date().toISOString(), points: 0 }
  };

  // Fetch historical points
  const { data: historicalPoints } = useQuery({
    queryKey: ["historicalPoints", userDisplayName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_historical_points")
        .select("*")
        .eq("user_display_name", userDisplayName)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching historical points:", error);
        return 0;
      }

      return (data as HistoricalPoints)?.points || 0;
    },
    enabled: !!userDisplayName
  });

  // Fetch role levels
  const { data: roleLevels } = useQuery({
    queryKey: ["roleLevels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_levels")
        .select("*")
        .order("points_threshold", { ascending: true });

      if (error) {
        console.error("Error fetching role levels:", error);
        return [];
      }

      return data as RoleLevel[];
    }
  });

  // Calculate accumulated points (using the same logic as existing cards plus historical points)
  const automaticPoints = Math.round(cleanStats.averagePoints * cleanStats.salesCount);
  const totalAccumulatedPoints = automaticPoints + (historicalPoints || 0);

  // Determine current role and next role based on accumulated points
  const getCurrentAndNextRole = () => {
    if (!roleLevels || roleLevels.length === 0) {
      return {
        currentRole: { title: "Sales Intern", points_threshold: 0 },
        nextRole: undefined
      };
    }

    let currentRole = roleLevels[0];
    let nextRole = undefined;

    for (let i = 0; i < roleLevels.length; i++) {
      if (totalAccumulatedPoints >= roleLevels[i].points_threshold) {
        currentRole = roleLevels[i];
        nextRole = roleLevels[i + 1] || undefined;
      } else {
        break;
      }
    }

    return { currentRole, nextRole };
  };

  const { currentRole, nextRole } = getCurrentAndNextRole();

  return (
    <div className="space-y-6">
      {/* Role progression bar - now placed first */}
      <RoleProgressBar
        currentRole={currentRole?.title || "Sales Intern"}
        nextRole={nextRole?.title}
        currentPoints={totalAccumulatedPoints}
        currentThreshold={currentRole?.points_threshold || 0}
        nextThreshold={nextRole?.points_threshold}
        animationDelay="400ms"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Ackumelerad poäng"
          value={`${totalAccumulatedPoints} p`}
          userName=""
          animationDelay="800ms"
        />
        <StatCard
          title="Snittpoäng per sälj"
          value={`${Math.round(cleanStats.averagePoints)} p`}
          userName=""
          animationDelay="1200ms"
        />
        <StatCard
          title="Högsta sälj"
          value={`${Math.round(cleanStats.highestSale.points)} p`}
          userName=""
          subtitle={format(new Date(cleanStats.highestSale.date), "d MMM yyyy", { locale: sv })}
          animationDelay="1600ms"
        />
        <StatCard
          title="Bästa säljdagen"
          subtitle={format(new Date(cleanStats.bestDay.date), "d MMM yyyy", { locale: sv })}
          value={`${Math.round(cleanStats.bestDay.points)} p`}
          userName=""
          animationDelay="2000ms"
        />
      </div>
    </div>
  );
};
