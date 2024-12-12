import { OverviewStatsGrid } from "@/components/stats/OverviewStatsGrid";
import { PaymentMethodStats } from "@/components/stats/PaymentMethodStats";
import { SalesChart } from "@/components/SalesChart";

interface StatsSectionProps {
  stats: {
    totalAmount: number;
    salesCount: number;
    averageValue: number;
    sellingDays: number;
    uniqueSellers: number;
    dailyAverage: number;
    transactions: any[];
    paymentMethodStats: any[];
  } | null;
  isLoading: boolean;
  selectedPeriod: string;
}

export const StatsSection = ({ stats, isLoading, selectedPeriod }: StatsSectionProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-card"
          ></div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-400">
        Välj en period för att se statistik
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Försäljningsutveckling</h2>
        <SalesChart 
          transactions={stats.transactions} 
          groupByWeek={selectedPeriod !== 'week'} 
          selectedPeriod={selectedPeriod}
        />
      </div>
      <OverviewStatsGrid stats={stats} />
      <PaymentMethodStats stats={stats.paymentMethodStats} />
    </>
  );
};