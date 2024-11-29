import { Trophy, Gift, Laptop } from "lucide-react";

const Competitions = () => {
  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 animate-fade-in">Tävlingar & Bonusar</h1>

      <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-500" size={24} />
          <div>
            <h3 className="font-bold">Dagens Utmaning</h3>
            <p className="text-gray-400">Sälj mest idag.</p>
          </div>
        </div>
        <p className="text-green-500 mt-2">Belöning: 200 SEK bonus</p>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:200ms] hover:scale-[1.02] transition-transform duration-200">
        <div className="flex items-center gap-3">
          <Gift className="text-purple-500" size={24} />
          <div>
            <h3 className="font-bold">Veckans Utmaning</h3>
            <p className="text-gray-400">Sälj för störst belopp den är veckan.</p>
          </div>
        </div>
        <p className="text-green-500 mt-2">Belöning: 300 SEK bonus</p>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:400ms] hover:scale-[1.02] transition-transform duration-200">
        <div className="flex items-center gap-3">
          <Laptop className="text-blue-500" size={24} />
          <div>
            <h3 className="font-bold">Månadens Utmaning</h3>
            <p className="text-gray-400">Generera 10 köp på hemsidan med rabattkod.</p>
          </div>
        </div>
        <p className="text-green-500 mt-2">Belöning: 200 SEK bonus + 10% per köp</p>
      </div>
    </div>
  );
};

export default Competitions;