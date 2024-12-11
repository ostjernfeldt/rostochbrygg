import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChallengeCard } from "@/components/settings/ChallengeCard";
import { PageLayout } from "@/components/PageLayout";

const Settings = () => {
  const [salesGoal, setSalesGoal] = useState("12000");
  const [startTime, setStartTime] = useState("16:30");
  const [endTime, setEndTime] = useState("20:00");
  
  // Challenge states
  const [dailyChallenge, setDailyChallenge] = useState("");
  const [dailyReward, setDailyReward] = useState("");
  const [weeklyChallenge, setWeeklyChallenge] = useState("");
  const [weeklyReward, setWeeklyReward] = useState("");
  const [monthlyChallenge, setMonthlyChallenge] = useState("");
  const [monthlyReward, setMonthlyReward] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);

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
          setDailyReward(data.daily_reward.replace(/[^\d.]/g, ''));
          setWeeklyChallenge(data.weekly_challenge);
          setWeeklyReward(data.weekly_reward.replace(/[^\d.]/g, ''));
          setMonthlyChallenge(data.monthly_challenge);
          setMonthlyReward(data.monthly_reward.replace(/[^\d.]/g, ''));
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
    localStorage.setItem("workStartTime", startTime);
    localStorage.setItem("workEndTime", endTime);
    localStorage.setItem("salesGoal", salesGoal);

    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          daily_challenge: dailyChallenge,
          daily_reward: `${dailyReward} SEK bonus`,
          weekly_challenge: weeklyChallenge,
          weekly_reward: `${weeklyReward} SEK bonus`,
          monthly_challenge: monthlyChallenge,
          monthly_reward: `${monthlyReward} SEK bonus`,
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
    <PageLayout>
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
          </div>
        </div>

        <ChallengeCard
          title="Dagens utmaning"
          challenge={dailyChallenge}
          setChallenge={setDailyChallenge}
          reward={dailyReward}
          setReward={setDailyReward}
        />

        <ChallengeCard
          title="Veckans utmaning"
          challenge={weeklyChallenge}
          setChallenge={setWeeklyChallenge}
          reward={weeklyReward}
          setReward={setWeeklyReward}
        />

        <ChallengeCard
          title="Månadens utmaning"
          challenge={monthlyChallenge}
          setChallenge={setMonthlyChallenge}
          reward={monthlyReward}
          setReward={setMonthlyReward}
        />

        <Button 
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
        >
          Spara inställningar
        </Button>
      </div>
    </PageLayout>
  );
};

export default Settings;