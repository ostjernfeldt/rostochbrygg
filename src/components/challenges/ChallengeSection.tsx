import { Trophy, Gift, Laptop } from "lucide-react";
import { ChallengeCard } from "./ChallengeCard";
import { format, startOfWeek, endOfWeek, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChallengeDateFilter } from "./ChallengeDateFilter";
import { useDefaultSalesDate } from "@/hooks/useDefaultSalesDate";

interface ChallengeSectionProps {
  salesDates: string[] | undefined;
}

export const ChallengeSection = ({ salesDates }: ChallengeSectionProps) => {
  const defaultDate = useDefaultSalesDate(salesDates);
  const [selectedDay, setSelectedDay] = useState(defaultDate);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return `${format(startOfWeek(now), 'yyyy-MM-dd')}`;
  });

  useEffect(() => {
    setSelectedDay(defaultDate);
  }, [defaultDate]);

  const { data: challenges } = useQuery({
    queryKey: ["active-challenges", selectedDay, selectedWeek, selectedMonth],
    queryFn: async () => {
      console.log("Fetching active challenges...");
      const dayStart = parseISO(selectedDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const weekStart = parseISO(selectedWeek);
      const weekEnd = endOfWeek(weekStart);

      const [year, month] = selectedMonth.split('-').map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(monthStart);

      const { data: dailyChallenge } = await supabase
        .from("challenges")
        .select("*")
        .eq("type", "daily")
        .gte("start_date", dayStart.toISOString())
        .lte("end_date", dayEnd.toISOString())
        .single();

      const { data: weeklyChallenge } = await supabase
        .from("challenges")
        .select("*")
        .eq("type", "weekly")
        .gte("start_date", weekStart.toISOString())
        .lte("end_date", weekEnd.toISOString())
        .single();

      const { data: monthlyChallenge } = await supabase
        .from("challenges")
        .select("*")
        .eq("type", "monthly")
        .gte("start_date", monthStart.toISOString())
        .lte("end_date", monthEnd.toISOString())
        .single();

      return {
        daily_challenge: "Sälj för störst belopp under dagen",
        daily_reward: dailyChallenge ? `${dailyChallenge.reward} SEK bonus` : "Ingen utmaning idag",
        weekly_challenge: "Sälj för störst belopp under veckan",
        weekly_reward: weeklyChallenge ? `${weeklyChallenge.reward} SEK bonus` : "Ingen utmaning denna vecka",
        monthly_challenge: "Sälj för störst belopp under månaden",
        monthly_reward: monthlyChallenge ? `${monthlyChallenge.reward} SEK bonus` : "Ingen utmaning denna månad"
      };
    }
  });

  const { data: leaders } = useQuery({
    queryKey: ["challengeLeaders", selectedDay, selectedWeek, selectedMonth],
    queryFn: async () => {
      console.log("Fetching challenge leaders...");
      
      try {
        const { data: latestSale, error: saleError } = await supabase
          .from("purchases")
          .select("Timestamp")
          .order("Timestamp", { ascending: false })
          .limit(1)
          .single();

        if (saleError) throw saleError;

        if (!latestSale) {
          console.log("No sales found");
          return {
            dailyLeader: null,
            weeklyLeader: null,
            monthlyLeader: null
          };
        }

        const dayStart = parseISO(selectedDay);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = parseISO(selectedDay);
        dayEnd.setHours(23, 59, 59, 999);

        const weekStart = parseISO(selectedWeek);
        const weekEnd = endOfWeek(weekStart);

        const [year, month] = selectedMonth.split('-').map(Number);
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(monthStart);

        const { data: dailySales, error: dailyError } = await supabase
          .from("purchases")
          .select('"User Display Name", Amount, Timestamp')
          .gte("Timestamp", dayStart.toISOString())
          .lte("Timestamp", dayEnd.toISOString());

        if (dailyError) throw dailyError;

        const { data: weeklySales, error: weeklyError } = await supabase
          .from("purchases")
          .select('"User Display Name", Amount, Timestamp')
          .gte("Timestamp", weekStart.toISOString())
          .lte("Timestamp", weekEnd.toISOString());

        if (weeklyError) throw weeklyError;

        const { data: monthlySales, error: monthlyError } = await supabase
          .from("purchases")
          .select('"User Display Name", Amount, Timestamp')
          .gte("Timestamp", monthStart.toISOString())
          .lte("Timestamp", monthEnd.toISOString());

        if (monthlyError) throw monthlyError;

        const calculateLeader = (sales: any[] | null) => {
          if (!sales || sales.length === 0) return null;
          
          const totals = sales.reduce((acc: { [key: string]: number }, sale) => {
            const name = sale["User Display Name"];
            const amount = Number(sale.Amount || 0);
            acc[name] = (acc[name] || 0) + amount;
            return acc;
          }, {});

          const sortedTotals = Object.entries(totals)
            .sort(([, a], [, b]) => Number(b) - Number(a));

          return sortedTotals.length > 0 
            ? { 
                name: sortedTotals[0][0], 
                amount: Number(sortedTotals[0][1])
              }
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
      } catch (error) {
        console.error("Error in challenge leaders query:", error);
        throw error;
      }
    }
  });

  const dailyFilter = ChallengeDateFilter({
    type: 'day',
    salesDates,
    selectedValue: selectedDay,
    onValueChange: setSelectedDay
  });

  const weeklyFilter = ChallengeDateFilter({
    type: 'week',
    selectedValue: selectedWeek,
    onValueChange: setSelectedWeek
  });

  const monthlyFilter = ChallengeDateFilter({
    type: 'month',
    selectedValue: selectedMonth,
    onValueChange: setSelectedMonth
  });

  return (
    <>
      <ChallengeCard
        icon={<Trophy size={24} />}
        iconColor="text-yellow-500"
        title="Dagens Utmaning"
        challenge={challenges?.daily_challenge || "Laddar..."}
        reward={challenges?.daily_reward || "Laddar..."}
        leader={leaders?.dailyLeader}
        filter={dailyFilter}
      />

      <ChallengeCard
        icon={<Gift size={24} />}
        iconColor="text-purple-500"
        title="Veckans Utmaning"
        challenge={challenges?.weekly_challenge || "Laddar..."}
        reward={challenges?.weekly_reward || "Laddar..."}
        leader={leaders?.weeklyLeader}
        filter={weeklyFilter}
      />

      <ChallengeCard
        icon={<Laptop size={24} />}
        iconColor="text-blue-500"
        title="Månadens Utmaning"
        challenge={challenges?.monthly_challenge || "Laddar..."}
        reward={challenges?.monthly_reward || "Laddar..."}
        leader={leaders?.monthlyLeader}
        filter={monthlyFilter}
      />
    </>
  );
};