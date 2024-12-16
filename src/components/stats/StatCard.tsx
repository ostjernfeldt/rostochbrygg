interface StatCardProps {
  title: string;
  userName: string;
  value: string | number;
  animationDelay?: string;
}

export const StatCard = ({ 
  title, 
  value,
  userName,
  animationDelay = "0ms" 
}: StatCardProps) => {
  return (
    <div 
      className={`overview-stat-card animate-fade-in bg-[#1A1F2C] rounded-xl p-4 flex flex-col h-full`}
      style={{ animationDelay }}
    >
      <span className="text-gray-400 text-sm sm:text-base mb-2">{title}</span>
      {userName && (
        <div className="text-xl sm:text-2xl font-bold mt-1 text-white">
          {userName}
        </div>
      )}
      <div className="text-2xl sm:text-3xl font-bold mt-auto text-white">
        {value}
      </div>
    </div>
  );
};