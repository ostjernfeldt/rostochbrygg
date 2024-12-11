import { StatCard } from "./StatCard";

interface OverviewStats {
  totalAmount: number;
  salesCount: number;
  averageValue: number;
  sellingDays: number;
  uniqueSellers: number;
  dailyAverage: number;
}

export const OverviewStatsGrid = ({ stats }: { stats: OverviewStats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total försäljning"
        value={`SEK ${Math.round(stats.totalAmount).toLocaleString()}`}
        userName=""
        percentageChange={-2.8}
      />
      <StatCard
        title="Antal sälj"
        value={stats.salesCount.toLocaleString()}
        userName=""
        percentageChange={1.5}
      />
      <StatCard
        title="Snittordervärde"
        value={`SEK ${Math.round(stats.averageValue).toLocaleString()}`}
        userName=""
        percentageChange={-0.5}
      />
      <StatCard
        title="Antal säljdagar"
        value={stats.sellingDays.toLocaleString()}
        userName=""
      />
      <StatCard
        title="Antal säljare"
        value={stats.uniqueSellers.toLocaleString()}
        userName=""
      />
      <StatCard
        title="Snitt per dag"
        value={`SEK ${Math.round(stats.dailyAverage).toLocaleString()}`}
        userName=""
      />
    </div>
  );
};