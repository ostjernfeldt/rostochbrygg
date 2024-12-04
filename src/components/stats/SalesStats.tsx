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
    return <div>Loading sales data...</div>;
  }

  return (
    <>
      <div className="stat-card animate-fade-in [animation-delay:200ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Total försäljning</span>
        <div className="text-4xl font-bold mt-1">
          SEK {shouldAnimate ? animatedSalesAmount.toLocaleString() : salesData?.totalAmount.toLocaleString()}
        </div>
        <div className="text-green-500 mt-1">+10% från förra gången</div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:400ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Antal sälj</span>
        <div className="text-4xl font-bold mt-1">
          {shouldAnimate ? animatedSalesCount : salesData?.salesCount}
        </div>
        <div className="text-green-500 mt-1">+15% från förra gången</div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:600ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Snittordervärde</span>
        <div className="text-4xl font-bold mt-1">
          SEK {shouldAnimate ? animatedAverageValue : Math.round(salesData?.averageValue || 0)}
        </div>
        <div className="text-red-500 mt-1">-5% från förra gången</div>
      </div>
    </>
  );
};