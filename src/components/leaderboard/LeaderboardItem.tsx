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

  const getRankColor = () => {
    switch (rank) {
      case 1:
        return 'text-[#FFD700]'; // Gold
      case 2:
        return 'text-[#C0C0C0]'; // Silver
      case 3:
        return 'text-[#CD7F32]'; // Bronze
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div 
      className="bg-[#1A1F2C] rounded-xl p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={`text-2xl font-bold ${getRankColor()}`}>#{rank}</span>
          <div>
            <h3 className="font-bold text-xl text-white">{displayName}</h3>
            <p className="text-gray-400">{salesCount} sälj</p>
          </div>
        </div>
        <span className="text-[#3B82F6] text-xl font-semibold">SEK {totalAmount.toLocaleString()}</span>
      </div>
    </div>
  );
};