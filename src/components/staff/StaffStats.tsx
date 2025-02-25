
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
    worstDay: {
      date: string;
      points: number;
    };
  };
}

export const StaffStats = ({ stats }: StaffStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title="Snittpoäng"
        value={`${Math.round(stats.averagePoints)} p`}
        userName=""
        animationDelay="400ms"
      />
      <StatCard
        title="Högsta försäljning"
        value={`${Math.round(stats.bestDay.points)} p`}
        userName=""
        animationDelay="800ms"
      />
      <StatCard
        title="Bästa säljdagen"
        subtitle={format(new Date(stats.bestDay.date), "d MMM yyyy", { locale: sv })}
        value={`${Math.round(stats.bestDay.points)} p`}
        userName=""
        animationDelay="1200ms"
      />
    </div>
  );
};
