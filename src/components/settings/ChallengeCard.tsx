import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChallengeCardProps {
  title: string;
  challenge: string;
  setChallenge: (value: string) => void;
  reward: string;
  setReward: (value: string) => void;
}

export const ChallengeCard = ({ 
  title, 
  challenge, 
  setChallenge, 
  reward, 
  setReward 
}: ChallengeCardProps) => {
  const handleRewardChange = (value: string) => {
    // Remove any non-numeric characters except dots
    const numericValue = value.replace(/[^\d.]/g, '');
    setReward(numericValue);
  };

  return (
    <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-white text-lg mb-2">Utmaning</label>
          <Textarea 
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            className="bg-[#1A1F2C] border-none text-white text-lg resize-none" 
          />
        </div>
        <div>
          <label className="block text-white text-lg mb-2">Belöning (SEK)</label>
          <Input 
            type="text"
            value={reward}
            onChange={(e) => handleRewardChange(e.target.value)}
            className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
          />
        </div>
      </div>
    </div>
  );
};