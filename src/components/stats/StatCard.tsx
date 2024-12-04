interface StatCardProps {
  title: string;
  userName: string;
  value: string | number;
  animationDelay?: string;
}

export const StatCard = ({ title, userName, value, animationDelay = "0ms" }: StatCardProps) => {
  return (
    <div className={`stat-card animate-fade-in [animation-delay:${animationDelay}]`}>
      <h3 className="text-gray-400">{title}</h3>
      <div className="mt-2">
        <div className="font-bold text-xl">{userName}</div>
        <div className="text-green-500">{value}</div>
      </div>
    </div>
  );
};