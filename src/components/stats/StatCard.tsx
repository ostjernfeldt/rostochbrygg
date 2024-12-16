import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  userName: string;
  value: string | ReactNode;
  animationDelay?: string;
  className?: string;
}

export const StatCard = ({
  title,
  userName,
  value,
  animationDelay = "0ms",
  className = "stat-card"
}: StatCardProps) => {
  return (
    <div
      className={`${className} animate-fade-in`}
      style={{ animationDelay }}
    >
      <div className="flex flex-col">
        <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
        <p className="font-bold text-lg mb-1">{userName}</p>
        <p className="text-primary text-lg font-medium">{value}</p>
      </div>
    </div>
  );
};