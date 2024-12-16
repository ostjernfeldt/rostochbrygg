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
      <div className="space-y-1">
        <div className="text-gray-400 text-sm leading-tight">{title}</div>
        {subtitle && (
          <div className="text-gray-500 text-xs leading-tight">{subtitle}</div>
        )}
      </div>
      {userName && (
        <div className="text-xl sm:text-2xl font-bold mt-1 text-white leading-tight">
          {userName}
        </div>
      )}
      <div className="text-2xl sm:text-3xl font-bold mt-auto text-white leading-tight">
        {value}
      </div>
    </div>
  );
};