import { useNavigate } from "react-router-dom";

interface LeaderboardItemProps {
  rank: number;
  displayName: string;
  salesCount: number;
  totalAmount: number;
  percentageChange?: number;
  onClick?: () => void;
}

export const LeaderboardItem = ({ 
  rank, 
  displayName, 
  salesCount, 
  totalAmount,
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

  const getPercentageChangeElement = () => {
    if (percentageChange === 0) return null;
    
    const isPositive = percentageChange > 0;
    return (
      <span className={`percentage-change ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '+' : ''}{percentageChange}%
      </span>
    );
  };

  return (
    <div 
      className={`leaderboard-item hover:bg-gray-800/50 transition-colors cursor-pointer`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        <span className={`leaderboard-rank ${
          rank === 1 ? 'gold' : 
          rank === 2 ? 'silver' : 
          rank === 3 ? 'bronze' : ''
        }`}>#{rank}</span>
        <div className="text-left">
          <h3 className="font-bold text-lg">{displayName}</h3>
          <p className="leaderboard-sales">
            {salesCount} sälj
            {getPercentageChangeElement()}
          </p>
        </div>
      </div>
      <span className="leaderboard-amount">SEK {totalAmount.toLocaleString()}</span>
    </div>
  );
};