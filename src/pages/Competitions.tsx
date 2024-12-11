import { Trophy, Gift, Laptop } from "lucide-react";
import { AllTimeStats } from "@/components/stats/AllTimeStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { startOfMonth, endOfMonth, subDays } from "date-fns";

interface ChallengeLeaders {
  dailyLeader: { name: string; amount: number } | null;
  weeklyLeader: { name: string; amount: number } | null;
  monthlyLeader: { name: string; amount: number } | null;
}

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

  const { data: leaders } = useQuery({
    queryKey: ["challengeLeaders"],
    queryFn: async (): Promise<ChallengeLeaders> => {
      console.log("Fetching challenge leaders...");
      
      // First get the latest date with sales
      const { data: latestSale } = await supabase
        .from("purchases")
        .select("Timestamp")
        .order("Timestamp", { ascending: false })
        .limit(1)
        .single();

      if (!latestSale) {
        console.log("No sales found");
        return {
          dailyLeader: null,
          weeklyLeader: null,
          monthlyLeader: null
        };
      }

      const latestDate = new Date(latestSale.Timestamp);
      console.log("Latest sale date:", latestDate);

      // Get start and end dates for different periods
      const startOfDay = new Date(latestDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(latestDate);
      endOfDay.setHours(23, 59, 59, 999);

      const weekStart = subDays(endOfDay, 6);
      weekStart.setHours(0, 0, 0, 0);

      const currentMonth = startOfMonth(latestDate);
      const monthEnd = endOfMonth(latestDate);

      // Fetch daily leader
      const { data: dailySales } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", startOfDay.toISOString())
        .lte("Timestamp", endOfDay.toISOString());

      // Fetch weekly leader
      const { data: weeklySales } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", weekStart.toISOString())
        .lte("Timestamp", endOfDay.toISOString());

      // Fetch monthly leader
      const { data: monthlySales } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", currentMonth.toISOString())
        .lte("Timestamp", monthEnd.toISOString());

      // Calculate totals for each period
      const calculateLeader = (sales: any[]) => {
        if (!sales || sales.length === 0) return null;
        
        const totals = sales.reduce((acc: { [key: string]: number }, sale) => {
          const name = sale["User Display Name"] as string;
          acc[name] = (acc[name] || 0) + Number(sale.Amount || 0);
          return acc;
        }, {});

        const sortedTotals = Object.entries(totals)
          .sort(([, a], [, b]) => b - a);

        return sortedTotals.length > 0 
          ? { name: sortedTotals[0][0], amount: sortedTotals[0][1] }
          : null;
      };

      const dailyLeader = calculateLeader(dailySales || []);
      const weeklyLeader = calculateLeader(weeklySales || []);
      const monthlyLeader = calculateLeader(monthlySales || []);

      console.log("Leaders calculated:", { dailyLeader, weeklyLeader, monthlyLeader });

      return {
        dailyLeader,
        weeklyLeader,
        monthlyLeader
      };
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
        {leaders?.dailyLeader && (
          <div className="mt-4 p-3 bg-card/50 rounded-lg">
            <p className="text-sm text-gray-400">Leder just nu:</p>
            <p className="font-bold">{leaders.dailyLeader.name}</p>
            <p className="text-green-500">SEK {leaders.dailyLeader.amount.toLocaleString()}</p>
          </div>
        )}
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
        {leaders?.weeklyLeader && (
          <div className="mt-4 p-3 bg-card/50 rounded-lg">
            <p className="text-sm text-gray-400">Leder just nu:</p>
            <p className="font-bold">{leaders.weeklyLeader.name}</p>
            <p className="text-green-500">SEK {leaders.weeklyLeader.amount.toLocaleString()}</p>
          </div>
        )}
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
        {leaders?.monthlyLeader && (
          <div className="mt-4 p-3 bg-card/50 rounded-lg">
            <p className="text-sm text-gray-400">Leder just nu:</p>
            <p className="font-bold">{leaders.monthlyLeader.name}</p>
            <p className="text-green-500">SEK {leaders.monthlyLeader.amount.toLocaleString()}</p>
          </div>
        )}
      </div>

      <AllTimeStats />
    </PageLayout>
  );
};

export default Competitions;