import { SalesChart } from "@/components/SalesChart";

interface SalesChartSectionProps {
  sales: any[];
}

export const SalesChartSection = ({ sales }: SalesChartSectionProps) => {
  return (
    <div className="stat-card">
      <h3 className="text-gray-400 mb-4">Försäljning över tid</h3>
      <SalesChart transactions={sales} />
    </div>
  );
};