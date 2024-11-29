import { Settings } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Home = () => {
  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-start mb-6">
        <div className="text-left">
          <h1 className="text-3xl font-bold mb-1">Välkommen Oscar</h1>
          <p className="text-gray-400 text-lg">Här kan du se statistiken från idag.</p>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="text-gray-400" size={24} />
          <span className="text-gray-400">Inställningar för dagen</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-lg">Tid kvar av dagen</span>
          <span className="text-lg">20 min</span>
        </div>
        <Progress value={80} className="h-2" />
        <div className="mt-2">
          <span className="text-gray-400">Dagens mål har uppnåtts</span>
        </div>
      </div>

      <div className="stat-card">
        <span className="text-gray-400 text-lg">Total försäljning</span>
        <div className="text-4xl font-bold mt-1">SEK 15,000</div>
        <div className="text-green-500 mt-1">+10% från förra gången</div>
      </div>

      <div className="stat-card">
        <span className="text-gray-400 text-lg">Antal sälj</span>
        <div className="text-4xl font-bold mt-1">42</div>
        <div className="text-green-500 mt-1">+15% från förra gången</div>
      </div>

      <div className="stat-card">
        <span className="text-gray-400 text-lg">Snittordervärde</span>
        <div className="text-4xl font-bold mt-1">SEK 327</div>
        <div className="text-red-500 mt-1">-5% från förra gången</div>
      </div>
    </div>
  );
};

export default Home;