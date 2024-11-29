import { Copy } from "lucide-react";

const Leaderboard = () => {
  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dagens topplista</h1>
        <Copy className="text-primary" size={20} />
      </div>

      {[
        { rank: 1, name: "Fredrik Keränen", sales: 28, amount: 5100 },
        { rank: 2, name: "Samuel Winqvist", sales: 23, amount: 4900 },
        { rank: 3, name: "Bruno Wulff", sales: 23, amount: 3900 },
        { rank: 4, name: "Nicolas Iurea", sales: 23, amount: 3700 },
        { rank: 5, name: "Alvin Ljungman", sales: 23, amount: 3600 },
        { rank: 6, name: "Louisa De Prado", sales: 23, amount: 2300 },
      ].map((item) => (
        <div key={item.rank} className="stat-card flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-primary font-bold">#{item.rank}</span>
            <div>
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-gray-400">{item.sales} sälj</p>
            </div>
          </div>
          <span className="font-bold">SEK {item.amount}</span>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;