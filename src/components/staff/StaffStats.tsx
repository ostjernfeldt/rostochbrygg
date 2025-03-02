
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

interface RoleLevel {
  id: string;
  title: string;
  points_threshold: number;
  display_order: number;
}

export const StaffStats = ({ stats, userDisplayName }: StaffStatsProps) => {
  // Justera statistiken för att exkludera återbetalade köp
  const cleanStats = {
    ...stats,
    // Om vi har data för genomsnittliga poäng, använd det, annars 0
    averagePoints: stats.averagePoints || 0,
    // Om vi har data för högsta sälj, använd det, annars ett tomt objekt med 0 poäng
    highestSale: stats.highestSale || { date: new Date().toISOString(), points: 0 },
    // Om vi har data för bästa dagen, använd det, annars ett tomt objekt med 0 poäng
    bestDay: stats.bestDay || { date: new Date().toISOString(), points: 0 }
  };

  // Hämta historiska poäng
  const { data: historicalPoints } = useQuery({
    queryKey: ["historicalPoints", userDisplayName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_historical_points")
        .select("points")
        .eq("user_display_name", userDisplayName)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching historical points:", error);
        return 0;
      }

      return data?.points || 0;
    },
    enabled: !!userDisplayName
  });

  // Hämta rollnivåer
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

  // Beräkna ackumulerade poäng (använder samma logik som befintliga kort plus historiska poäng)
  const automaticPoints = Math.round(cleanStats.averagePoints * cleanStats.salesCount);
  const totalAccumulatedPoints = automaticPoints + (historicalPoints || 0);

  // Bestäm nuvarande roll och nästa roll baserat på ackumulerade poäng
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Ackumelerad poäng"
          value={`${totalAccumulatedPoints} p`}
          userName=""
          animationDelay="400ms"
        />
        <StatCard
          title="Snittpoäng per sälj"
          value={`${Math.round(cleanStats.averagePoints)} p`}
          userName=""
          animationDelay="800ms"
        />
        <StatCard
          title="Högsta sälj"
          value={`${Math.round(cleanStats.highestSale.points)} p`}
          userName=""
          subtitle={format(new Date(cleanStats.highestSale.date), "d MMM yyyy", { locale: sv })}
          animationDelay="1200ms"
        />
        <StatCard
          title="Bästa säljdagen"
          subtitle={format(new Date(cleanStats.bestDay.date), "d MMM yyyy", { locale: sv })}
          value={`${Math.round(cleanStats.bestDay.points)} p`}
          userName=""
          animationDelay="1600ms"
        />
      </div>

      {/* Role progression bar */}
      <RoleProgressBar
        currentRole={currentRole?.title || "Sales Intern"}
        nextRole={nextRole?.title}
        currentPoints={totalAccumulatedPoints}
        currentThreshold={currentRole?.points_threshold || 0}
        nextThreshold={nextRole?.points_threshold}
        animationDelay="2000ms"
      />
    </div>
  );
};
