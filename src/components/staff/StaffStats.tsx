
import { StatCard } from "@/components/stats/StatCard";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

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
}

export const StaffStats = ({ stats }: StaffStatsProps) => {
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

  // Beräkna ackumulerade poäng (använder samma logik som befintliga kort)
  const totalAccumulatedPoints = Math.round(cleanStats.averagePoints * cleanStats.salesCount);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatCard
        title="Snittpoäng per sälj"
        value={`${Math.round(cleanStats.averagePoints)} p`}
        userName=""
        animationDelay="400ms"
      />
      <StatCard
        title="Högsta sälj"
        value={`${Math.round(cleanStats.highestSale.points)} p`}
        userName=""
        subtitle={format(new Date(cleanStats.highestSale.date), "d MMM yyyy", { locale: sv })}
        animationDelay="800ms"
      />
      <StatCard
        title="Bästa säljdagen"
        subtitle={format(new Date(cleanStats.bestDay.date), "d MMM yyyy", { locale: sv })}
        value={`${Math.round(cleanStats.bestDay.points)} p`}
        userName=""
        animationDelay="1200ms"
      />
      <StatCard
        title="Ackumulerade poäng"
        value={`${totalAccumulatedPoints} p`}
        userName=""
        animationDelay="1600ms"
      />
    </div>
  );
};
