import { useCountAnimation } from "@/hooks/useCountAnimation";
import { useSalesData } from "@/hooks/useSalesData";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { SellerStatsDialog } from "./SellerStatsDialog";

export const SalesStats = ({ shouldAnimate = false }) => {
  const navigate = useNavigate();
  const { data: salesData, isLoading } = useSalesData();
  const [dialogType, setDialogType] = useState<"sales" | "average" | null>(null);
  
  const animatedSalesAmount = useCountAnimation(
    shouldAnimate ? (salesData?.totalAmount || 0) : 0,
    2000
  );
  const animatedSalesCount = useCountAnimation(
    shouldAnimate ? (salesData?.salesCount || 0) : 0,
    2000
  );
  const animatedAverageValue = useCountAnimation(
    shouldAnimate ? (salesData?.averageValue || 0) : 0,
    2000
  );

  if (isLoading) {
    return (
      <>
        <div className="stat-card animate-pulse">
          <span className="text-gray-400 text-lg">Total försäljning</span>
          <div className="h-10 bg-gray-200 rounded mt-1"></div>
        </div>
        <div className="stat-card animate-pulse">
          <span className="text-gray-400 text-lg">Antal sälj</span>
          <div className="h-10 bg-gray-200 rounded mt-1"></div>
        </div>
        <div className="stat-card animate-pulse">
          <span className="text-gray-400 text-lg">Snittordervärde</span>
          <div className="h-10 bg-gray-200 rounded mt-1"></div>
        </div>
      </>
    );
  }

  if (!salesData) {
    return (
      <>
        <div className="stat-card">
          <span className="text-gray-400 text-lg">Total försäljning</span>
          <div className="text-4xl font-bold mt-1">SEK 0</div>
          <div className="mt-1 text-gray-400">Ingen data tillgänglig</div>
        </div>
        <div className="stat-card">
          <span className="text-gray-400 text-lg">Antal sälj</span>
          <div className="text-4xl font-bold mt-1">0</div>
          <div className="mt-1 text-gray-400">Ingen data tillgänglig</div>
        </div>
        <div className="stat-card">
          <span className="text-gray-400 text-lg">Snittordervärde</span>
          <div className="text-4xl font-bold mt-1">SEK 0</div>
          <div className="mt-1 text-gray-400">Ingen data tillgänglig</div>
        </div>
      </>
    );
  }

  const formatPercentage = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded >= 0 ? '+' : ''}${rounded}%`;
  };

  return (
    <>
      <div 
        onClick={() => navigate("/transactions")}
        className="stat-card animate-fade-in [animation-delay:200ms] hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
      >
        <span className="text-gray-400 text-lg">Total försäljning</span>
        <div className="text-4xl font-bold mt-1">
          SEK {shouldAnimate ? animatedSalesAmount.toLocaleString() : salesData.totalAmount.toLocaleString()}
        </div>
        <div className={`mt-1 ${salesData.percentageChanges.totalAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercentage(salesData.percentageChanges.totalAmount)} från förra gången
        </div>
      </div>

      <div 
        onClick={() => setDialogType("sales")}
        className="stat-card animate-fade-in [animation-delay:400ms] hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
      >
        <span className="text-gray-400 text-lg">Antal sälj</span>
        <div className="text-4xl font-bold mt-1">
          {shouldAnimate ? animatedSalesCount : salesData.salesCount}
        </div>
        <div className={`mt-1 ${salesData.percentageChanges.salesCount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercentage(salesData.percentageChanges.salesCount)} från förra gången
        </div>
      </div>

      <div 
        onClick={() => setDialogType("average")}
        className="stat-card animate-fade-in [animation-delay:600ms] hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
      >
        <span className="text-gray-400 text-lg">Snittordervärde</span>
        <div className="text-4xl font-bold mt-1">
          SEK {shouldAnimate ? animatedAverageValue : Math.round(salesData.averageValue)}
        </div>
        <div className={`mt-1 ${salesData.percentageChanges.averageValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercentage(salesData.percentageChanges.averageValue)} från förra gången
        </div>
      </div>

      <SellerStatsDialog 
        isOpen={dialogType !== null}
        onClose={() => setDialogType(null)}
        type={dialogType || "sales"}
      />
    </>
  );
};