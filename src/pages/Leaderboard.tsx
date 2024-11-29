import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Leaderboard = () => {
  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "gold";
      case 2:
        return "silver";
      case 3:
        return "bronze";
      default:
        return "";
    }
  };

  const leaderboardData = [
    { rank: 1, name: "Fredrik Keränen", sales: 28, amount: 5100 },
    { rank: 2, name: "Samuel Winqvist", sales: 23, amount: 4900 },
    { rank: 3, name: "Bruno Wulff", sales: 23, amount: 3900 },
    { rank: 4, name: "Nicolas Iurea", sales: 23, amount: 3700 },
    { rank: 5, name: "Alvin Ljungman", sales: 23, amount: 3600 },
    { rank: 6, name: "Louisa De Prado", sales: 23, amount: 2300 },
  ];

  const handleCopy = async () => {
    try {
      const text = leaderboardData
        .map(item => `#${item.rank} ${item.name} - ${item.sales} sälj - SEK ${item.amount}`)
        .join('\n');
      
      await navigator.clipboard.writeText(text);
      
      toast({
        title: "Copied to clipboard",
        description: "The leaderboard has been copied to your clipboard",
        duration: 2000,
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Failed to copy",
        description: "Could not copy the leaderboard to clipboard",
        variant: "destructive",
        duration: 2000,
        className: "bg-red-500 text-white border-none rounded-xl shadow-lg",
      });
    }
  };

  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dagens topplista</h1>
        <Copy 
          className="text-primary cursor-pointer hover:text-primary/80 transition-colors" 
          size={24} 
          onClick={handleCopy}
        />
      </div>

      <div className="space-y-3">
        {leaderboardData.map((item) => (
          <div 
            key={item.rank} 
            className={`leaderboard-item ${item.rank === 1 ? 'first-place' : ''} hover:scale-[1.02] transition-transform duration-200`}
          >
            <div className="flex items-center gap-4">
              <span className={`leaderboard-rank ${getRankClass(item.rank)}`}>#{item.rank}</span>
              <div className="text-left">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="leaderboard-sales">{item.sales} sälj</p>
              </div>
            </div>
            <span className="leaderboard-amount">SEK {item.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;