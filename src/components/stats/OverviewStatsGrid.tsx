import React from 'react';
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
  // Only show selling days if there were actual sales
  const effectiveSellingDays = stats.totalAmount > 0 ? stats.sellingDays : 0;
  const effectiveDailyAverage = effectiveSellingDays > 0 ? stats.totalAmount / effectiveSellingDays : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total försäljning"
        value={`SEK ${Math.round(stats.totalAmount).toLocaleString()}`}
        userName=""
      />
      <StatCard
        title="Antal sälj"
        value={stats.salesCount.toLocaleString()}
        userName=""
      />
      <StatCard
        title="Snittordervärde"
        value={`SEK ${Math.round(stats.averageValue).toLocaleString()}`}
        userName=""
      />
      <StatCard
        title="Antal säljdagar"
        value={effectiveSellingDays.toLocaleString()}
        userName=""
      />
      <StatCard
        title="Antal säljare"
        value={stats.uniqueSellers.toLocaleString()}
        userName=""
      />
      <StatCard
        title="Snitt per dag"
        value={`SEK ${Math.round(effectiveDailyAverage).toLocaleString()}`}
        userName=""
      />
    </div>
  );
};