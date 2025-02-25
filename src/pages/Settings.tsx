
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { PageLayout } from "@/components/PageLayout";

const Settings = () => {
  const [salesGoal, setSalesGoal] = useState("12000");
  const [startTime, setStartTime] = useState("16:30");
  const [endTime, setEndTime] = useState("20:00");

  const handleSave = () => {
    localStorage.setItem("workStartTime", startTime);
    localStorage.setItem("workEndTime", endTime);
    localStorage.setItem("salesGoal", salesGoal);

    toast({
      title: "Sparat!",
      description: "Dina inställningar har sparats",
      className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
      duration: 1000,
    });
  };

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-8 animate-fade-in">Inställningar</h1>

      <div className="space-y-6">
        <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
          <h2 className="text-xl font-bold mb-4">Arbetspass</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-lg mb-2">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg w-full rounded-md px-3"
              />
            </div>
            <div>
              <label className="block text-white text-lg mb-2">Slut</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg w-full rounded-md px-3"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-white text-lg mb-2">Försäljningsmål</label>
            <input
              type="number"
              value={salesGoal}
              onChange={(e) => setSalesGoal(e.target.value)}
              className="bg-[#1A1F2C] border-none text-white h-12 text-lg w-full rounded-md px-3"
            />
          </div>
          <Button 
            onClick={handleSave}
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
          >
            Spara inställningar
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
