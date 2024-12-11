interface StatCardProps {
  title: string;
  userName: string;
  value: string | number;
  percentageChange?: number;
  animationDelay?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  percentageChange, 
  animationDelay = "0ms" 
}: StatCardProps) => {
  const formattedPercentage = percentageChange !== undefined 
    ? `${percentageChange >= 0 ? '+' : ''}${Math.round(percentageChange * 10) / 10}%`
    : null;

  return (
    <div className={`stat-card animate-fade-in [animation-delay:${animationDelay}]`}>
      <span className="text-gray-400 text-lg">{title}</span>
      <div className="text-4xl font-bold mt-1 text-white">
        {value}
      </div>
      {formattedPercentage && (
        <div className={`mt-1 ${percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formattedPercentage} från förra gången
        </div>
      )}
    </div>
  );
};