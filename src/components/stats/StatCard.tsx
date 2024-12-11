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
    <div className={`overview-stat-card animate-fade-in [animation-delay:${animationDelay}]`}>
      <span className="text-gray-400 text-lg">{title}</span>
      <div className="text-4xl font-bold mt-1 text-white">
        {value}
      </div>
      {userName && (
        <div className="mt-2 text-sm text-gray-400">
          {userName}
        </div>
      )}
    </div>
  );
};