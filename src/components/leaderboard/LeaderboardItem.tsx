
import { useNavigate } from "react-router-dom";

interface LeaderboardItemProps {
  rank: number;
  displayName: string;
  salesCount: number;
  points: number;
  percentageChange?: number;
  onClick?: () => void;
}

export const LeaderboardItem = ({ 
  rank, 
  displayName, 
  salesCount, 
  points,
  percentageChange = 0,
  onClick 
}: LeaderboardItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/staff/${encodeURIComponent(displayName)}`);
    }
  };

  const getRankColor = () => {
    switch (rank) {
      case 1:
        return 'text-yellow-500'; // Gold
      case 2:
        return 'text-gray-400'; // Silver
      case 3:
        return 'text-amber-700'; // Bronze
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div 
      className="bg-gray-900 p-4 rounded-xl hover:bg-gray-800/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={`text-xl font-bold ${getRankColor()}`}>
            #{rank}
          </span>
          <div>
            <h3 className="font-semibold text-white">{displayName}</h3>
            <p className="text-gray-400 text-sm">
              {salesCount} sälj
            </p>
          </div>
        </div>
        <span className="text-cyan-400 font-semibold">
          {points} poäng
        </span>
      </div>
    </div>
  );
};
