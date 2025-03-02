
import { TotalPurchase } from "@/types/purchase";
import { calculateTotalPoints } from "@/utils/pointsCalculation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccumulatedPointsCardProps {
  transactions: TotalPurchase[];
  isLoading?: boolean;
}

export const AccumulatedPointsCard = ({ transactions, isLoading = false }: AccumulatedPointsCardProps) => {
  const getAccumulatedPoints = () => {
    if (!transactions || transactions.length === 0) return 0;
    
    // Filter out refunded transactions
    const validTransactions = transactions.filter(t => !t.refunded);
    
    // Calculate total points
    return calculateTotalPoints(validTransactions);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Total poäng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Total poäng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{getAccumulatedPoints().toLocaleString()} p</div>
        <div className="text-sm text-muted-foreground mt-1">
          Alla poäng (exkl. återbetalningar)
        </div>
      </CardContent>
    </Card>
  );
};
