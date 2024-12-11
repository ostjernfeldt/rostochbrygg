import { ReactNode } from "react";
import { LeaderboardFilter } from "@/components/leaderboard/LeaderboardFilter";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChallengeCardProps {
  icon: ReactNode;
  iconColor: string;
  title: string;
  challenge: string;
  reward: string;
  leader: { name: string; amount: number } | null;
  filter?: {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
  };
}

export const ChallengeCard = ({
  icon,
  iconColor,
  title,
  challenge,
  reward,
  leader,
  filter
}: ChallengeCardProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
      <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex justify-between items-start'}`}>
        <div className="flex items-center gap-3">
          <div className={iconColor}>{icon}</div>
          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-gray-400">{challenge}</p>
          </div>
        </div>
        {filter && (
          <div className={`${isMobile ? 'w-full' : 'w-auto'}`}>
            <LeaderboardFilter
              options={filter.options}
              value={filter.value}
              onValueChange={filter.onValueChange}
              placeholder={filter.placeholder}
            />
          </div>
        )}
      </div>
      <p className="text-green-500 mt-2">{reward}</p>
      {leader && (
        <div className="mt-4 p-3 bg-card/50 rounded-lg">
          <p className="font-bold">{leader.name}</p>
          <p style={{ color: "#D3E4FD" }}>SEK {leader.amount.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};