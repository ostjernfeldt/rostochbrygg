interface StatCardProps {
  title: string;
  subtitle?: string;
  userName: string;
  value: string | number;
  animationDelay?: string;
}

export const StatCard = ({ 
  title, 
  subtitle,
  value,
  userName,
  animationDelay = "0ms" 
}: StatCardProps) => {
  return (
    <div 
      className="overview-stat-card animate-fade-in bg-[#1A1F2C] rounded-xl p-4 flex flex-col h-full"
      style={{ animationDelay }}
    >
      <div className="mb-auto">
        <div className="text-gray-400 text-base font-medium mb-1">{title}</div>
        {subtitle && (
          <div className="text-gray-500 text-sm">{subtitle}</div>
        )}
      </div>
      {userName && (
        <div className="text-xl sm:text-2xl font-bold mt-2 text-white">
          {userName}
        </div>
      )}
      <div className="text-3xl sm:text-4xl font-bold mt-2 text-white">
        {value}
      </div>
    </div>
  );
};