import { Card } from "@/components/ui/card";

interface TotalSalariesCardProps {
  totalSalaries: number;
}

export const TotalSalariesCard = ({ totalSalaries }: TotalSalariesCardProps) => {
  return (
    <Card className="bg-card p-4 sm:p-6 mb-6">
      <div className="text-sm text-gray-400 mb-1">Total löner för perioden</div>
      <div className="text-2xl font-semibold text-primary">
        {totalSalaries.toLocaleString()} kr
      </div>
    </Card>
  );
};