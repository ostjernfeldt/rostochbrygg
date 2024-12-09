import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [salesGoal, setSalesGoal] = useState("12000");
  const [startTime, setStartTime] = useState("16:30");
  const [endTime, setEndTime] = useState("20:00");
  const [bonus, setBonus] = useState("200");
  
  // Challenge states
  const [dailyChallenge, setDailyChallenge] = useState("");
  const [dailyReward, setDailyReward] = useState("");
  const [weeklyChallenge, setWeeklyChallenge] = useState("");
  const [weeklyReward, setWeeklyReward] = useState("");
  const [monthlyChallenge, setMonthlyChallenge] = useState("");
  const [monthlyReward, setMonthlyReward] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);

  // Load saved settings and challenges when component mounts
  useEffect(() => {
    const loadSettings = () => {
      const savedStartTime = localStorage.getItem("workStartTime");
      const savedEndTime = localStorage.getItem("workEndTime");
      if (savedStartTime) setStartTime(savedStartTime);
      if (savedEndTime) setEndTime(savedEndTime);
    };

    const loadChallenges = async () => {
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setDailyChallenge(data.daily_challenge);
          setDailyReward(data.daily_reward);
          setWeeklyChallenge(data.weekly_challenge);
          setWeeklyReward(data.weekly_reward);
          setMonthlyChallenge(data.monthly_challenge);
          setMonthlyReward(data.monthly_reward);
          setChallengeId(data.id);
        }
      } catch (error) {
        console.error('Error loading challenges:', error);
        toast({
          title: "Fel vid laddning",
          description: "Kunde inte ladda utmaningarna",
          variant: "destructive",
        });
      }
    };

    loadSettings();
    loadChallenges();
  }, []);

  const handleSave = async () => {
    // Save local settings
    localStorage.setItem("workStartTime", startTime);
    localStorage.setItem("workEndTime", endTime);
    localStorage.setItem("salesGoal", salesGoal);
    localStorage.setItem("dailyBonus", bonus);

    // Save challenges to Supabase
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          daily_challenge: dailyChallenge,
          daily_reward: dailyReward,
          weekly_challenge: weeklyChallenge,
          weekly_reward: weeklyReward,
          monthly_challenge: monthlyChallenge,
          monthly_reward: monthlyReward,
        })
        .eq('id', challengeId);

      if (error) throw error;

      toast({
        title: "Sparat!",
        description: "Dina inställningar har sparats",
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
        duration: 1000,
      });
    } catch (error) {
      console.error('Error saving challenges:', error);
      toast({
        title: "Fel vid sparande",
        description: "Kunde inte spara utmaningarna",
        variant: "destructive",
      });
    }
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
          </div>
        </div>

        <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
          <h2 className="text-xl font-bold mb-4">Utmaningar</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white text-lg mb-2">Dagens utmaning</label>
              <Textarea 
                value={dailyChallenge}
                onChange={(e) => setDailyChallenge(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white text-lg resize-none" 
              />
              <Input 
                type="text"
                placeholder="Belöning"
                value={dailyReward}
                onChange={(e) => setDailyReward(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg mt-2" 
              />
            </div>

            <div>
              <label className="block text-white text-lg mb-2">Veckans utmaning</label>
              <Textarea 
                value={weeklyChallenge}
                onChange={(e) => setWeeklyChallenge(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white text-lg resize-none" 
              />
              <Input 
                type="text"
                placeholder="Belöning"
                value={weeklyReward}
                onChange={(e) => setWeeklyReward(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg mt-2" 
              />
            </div>

            <div>
              <label className="block text-white text-lg mb-2">Månadens utmaning</label>
              <Textarea 
                value={monthlyChallenge}
                onChange={(e) => setMonthlyChallenge(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white text-lg resize-none" 
              />
              <Input 
                type="text"
                placeholder="Belöning"
                value={monthlyReward}
                onChange={(e) => setMonthlyReward(e.target.value)}
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg mt-2" 
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
        >
          Spara inställningar
        </Button>
      </div>
    </div>
  );
};

export default Settings;