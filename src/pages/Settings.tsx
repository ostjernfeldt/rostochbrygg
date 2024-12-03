import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

const Settings = () => {
  const [salesGoal, setSalesGoal] = useState("12000");
  const [startTime, setStartTime] = useState("16:30");
  const [endTime, setEndTime] = useState("20:00");
  const [bonus, setBonus] = useState("200");

  // Load saved settings when component mounts
  useEffect(() => {
    const savedStartTime = localStorage.getItem("workStartTime");
    const savedEndTime = localStorage.getItem("workEndTime");
    if (savedStartTime) setStartTime(savedStartTime);
    if (savedEndTime) setEndTime(savedEndTime);
  }, []);

  const handleSave = () => {
    localStorage.setItem("workStartTime", startTime);
    localStorage.setItem("workEndTime", endTime);
    localStorage.setItem("salesGoal", salesGoal);
    localStorage.setItem("dailyBonus", bonus);

    toast({
      title: "Sparat!",
      description: "Dina inställningar har sparats",
      className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
      duration: 1000,
    });
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-8 animate-fade-in">Dagens inställningar</h1>

      <div className="space-y-6">
        <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
          <div className="space-y-4">
            <div>
              <label className="block text-white text-lg mb-2">Försäljningsmål</label>
              <Input 
                type="number" 
                value={salesGoal}
                onChange={(e) => setSalesGoal(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-lg mb-2">Arbetspass start</label>
                <Input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
                />
              </div>
              <div>
                <label className="block text-white text-lg mb-2">Arbetspass slut</label>
                <Input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-lg mb-2">Dagens bonus</label>
              <Input 
                type="number" 
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
              />
            </div>

            <Button 
              onClick={handleSave}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
            >
              Spara inställningar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;