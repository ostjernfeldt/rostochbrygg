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
      {userName && (
        <div className="text-2xl font-bold mt-2 text-white">
          {userName}
        </div>
      )}
      <div className="text-xl mt-1 text-primary">
        {value}
      </div>
    </div>
  );
};