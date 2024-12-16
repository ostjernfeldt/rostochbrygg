import { StatCard } from "@/components/stats/StatCard";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface StaffStatsProps {
  stats: {
    salesCount: number;
    averageValue: number;
    activeDays: number;
    firstSaleDate: string;
    bestDay: {
      date: string;
      amount: number;
    };
    worstDay: {
      date: string;
      amount: number;
    };
  };
}

export const StaffStats = ({ stats }: StaffStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <StatCard
        title="Antal sälj"
        value={stats.salesCount}
        userName=""
        animationDelay="200ms"
      />
      <StatCard
        title="Snittordervärde"
        value={`SEK ${Math.round(stats.averageValue)}`}
        userName=""
        animationDelay="400ms"
      />
      <StatCard
        title="Aktiva dagar"
        value={stats.activeDays}
        userName=""
        animationDelay="600ms"
      />
      <StatCard
        title="Första sälj"
        value={format(new Date(stats.firstSaleDate), "yyyy-MM-dd")}
        userName=""
        animationDelay="800ms"
      />
      <StatCard
        title="Första säljdagen"
        subtitle={format(new Date(stats.worstDay.date), "d MMM yyyy", { locale: sv })}
        value={`SEK ${Math.round(stats.worstDay.amount).toLocaleString()}`}
        userName=""
        animationDelay="1000ms"
      />
      <StatCard
        title="Bästa säljdagen"
        subtitle={format(new Date(stats.bestDay.date), "d MMM yyyy", { locale: sv })}
        value={`SEK ${Math.round(stats.bestDay.amount).toLocaleString()}`}
        userName=""
        animationDelay="1200ms"
      />
    </div>
  );
};