import { Settings } from "lucide-react";

const Home = () => {
  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Välkommen Oscar</h1>
          <p className="text-gray-400">Här kan du se statistiken från idag.</p>
        </div>
        <Settings className="text-primary" size={24} />
      </div>

      <div className="stat-card">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Tid kvar av dagen</span>
          <span>20 min</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div className="bg-primary w-4/5 h-2 rounded-full"></div>
        </div>
      </div>

      <div className="stat-card">
        <span className="text-gray-400">Total försäljning</span>
        <div className="text-3xl font-bold">SEK 15,000</div>
        <span className="text-green-500">+10% från förra gången</span>
      </div>

      <div className="stat-card">
        <span className="text-gray-400">Antal sälj</span>
        <div className="text-3xl font-bold">42</div>
        <span className="text-green-500">+15% från förra gången</span>
      </div>

      <div className="stat-card">
        <span className="text-gray-400">Snittordervärde</span>
        <div className="text-3xl font-bold">SEK 327</div>
        <span className="text-red-500">-5% från förra gången</span>
      </div>
    </div>
  );
};

export default Home;