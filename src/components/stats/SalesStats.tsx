import { useCountAnimation } from "@/hooks/useCountAnimation";
import { useSalesData } from "@/hooks/useSalesData";

export const SalesStats = ({ shouldAnimate = false }) => {
  const { data: salesData, isLoading } = useSalesData();
  
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

  // If data is undefined, show empty state
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
      <div className="stat-card animate-fade-in [animation-delay:200ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Total försäljning</span>
        <div className="text-4xl font-bold mt-1">
          SEK {shouldAnimate ? animatedSalesAmount.toLocaleString() : salesData.totalAmount.toLocaleString()}
        </div>
        <div className={`mt-1 ${salesData.percentageChanges.totalAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercentage(salesData.percentageChanges.totalAmount)} från förra gången
        </div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:400ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Antal sälj</span>
        <div className="text-4xl font-bold mt-1">
          {shouldAnimate ? animatedSalesCount : salesData.salesCount}
        </div>
        <div className={`mt-1 ${salesData.percentageChanges.salesCount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercentage(salesData.percentageChanges.salesCount)} från förra gången
        </div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:600ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Snittordervärde</span>
        <div className="text-4xl font-bold mt-1">
          SEK {shouldAnimate ? animatedAverageValue : Math.round(salesData.averageValue)}
        </div>
        <div className={`mt-1 ${salesData.percentageChanges.averageValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercentage(salesData.percentageChanges.averageValue)} från förra gången
        </div>
      </div>
    </>
  );
};