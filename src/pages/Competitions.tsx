import { Trophy, Gift, Laptop } from "lucide-react";
import { AllTimeStats } from "@/components/stats/AllTimeStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";

const Competitions = () => {
  const { data: challenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    }
  });

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-6 animate-fade-in">Tävlingar & Bonusar</h1>

      <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-500" size={24} />
          <div>
            <h3 className="font-bold">Dagens Utmaning</h3>
            <p className="text-gray-400">{challenges?.daily_challenge || "Laddar..."}</p>
          </div>
        </div>
        <p className="text-green-500 mt-2">{challenges?.daily_reward || "Laddar..."}</p>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:200ms] hover:scale-[1.02] transition-transform duration-200">
        <div className="flex items-center gap-3">
          <Gift className="text-purple-500" size={24} />
          <div>
            <h3 className="font-bold">Veckans Utmaning</h3>
            <p className="text-gray-400">{challenges?.weekly_challenge || "Laddar..."}</p>
          </div>
        </div>
        <p className="text-green-500 mt-2">{challenges?.weekly_reward || "Laddar..."}</p>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:400ms] hover:scale-[1.02] transition-transform duration-200">
        <div className="flex items-center gap-3">
          <Laptop className="text-blue-500" size={24} />
          <div>
            <h3 className="font-bold">Månadens Utmaning</h3>
            <p className="text-gray-400">{challenges?.monthly_challenge || "Laddar..."}</p>
          </div>
        </div>
        <p className="text-green-500 mt-2">{challenges?.monthly_reward || "Laddar..."}</p>
      </div>

      <AllTimeStats />
    </PageLayout>
  );
};

export default Competitions;