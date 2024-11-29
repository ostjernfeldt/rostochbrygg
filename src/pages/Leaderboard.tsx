import { Copy } from "lucide-react";

const Leaderboard = () => {
  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dagens topplista</h1>
        <Copy className="text-primary" size={24} />
      </div>

      <div className="space-y-3">
        {[
          { rank: 1, name: "Fredrik Keränen", sales: 28, amount: 5100 },
          { rank: 2, name: "Samuel Winqvist", sales: 23, amount: 4900 },
          { rank: 3, name: "Bruno Wulff", sales: 23, amount: 3900 },
          { rank: 4, name: "Nicolas Iurea", sales: 23, amount: 3700 },
          { rank: 5, name: "Alvin Ljungman", sales: 23, amount: 3600 },
          { rank: 6, name: "Louisa De Prado", sales: 23, amount: 2300 },
        ].map((item) => (
          <div 
            key={item.rank} 
            className={`leaderboard-item ${item.rank === 1 ? 'first-place' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className="leaderboard-rank">#{item.rank}</span>
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