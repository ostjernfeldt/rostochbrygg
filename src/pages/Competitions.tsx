import { Trophy, Gift, Laptop } from "lucide-react";
import { AllTimeStats } from "@/components/stats/AllTimeStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, format, parseISO } from "date-fns";
import { useState } from "react";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";

interface ChallengeLeaders {
  dailyLeader: { name: string; amount: number } | null;
  weeklyLeader: { name: string; amount: number } | null;
  monthlyLeader: { name: string; amount: number } | null;
  currentMonth?: string;
}

interface Purchase {
  "User Display Name": string;
  Amount: number;
  Timestamp: string;
}

const Competitions = () => {
  const [selectedDay, setSelectedDay] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return `${format(startOfWeek(now), 'yyyy-MM-dd')}`;
  });

  // Fetch dates with sales activity
  const { data: salesDates } = useQuery({
    queryKey: ["salesDates"],
    queryFn: async () => {
      console.log("Fetching dates with sales activity...");
      const { data, error } = await supabase
        .from("purchases")
        .select("Timestamp")
        .order("Timestamp", { ascending: false });

      if (error) throw error;

      // Get unique dates and format them
      const uniqueDates = Array.from(new Set(
        data.map(purchase => format(new Date(purchase.Timestamp), 'yyyy-MM-dd'))
      ));

      console.log("Found sales dates:", uniqueDates);
      return uniqueDates;
    }
  });

  // Generate date options from sales dates
  const dayOptions = (salesDates || []).map(date => ({
    value: date,
    label: format(parseISO(date), 'd MMMM yyyy')
  }));

  // Generate last 12 months for the dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  // Generate weeks for the current month
  const weekOptions = Array.from({ length: 5 }, (_, i) => {
    const date = startOfWeek(new Date());
    date.setDate(date.getDate() - (i * 7));
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: `Vecka ${format(date, 'w')} (${format(date, 'd MMM')} - ${format(endOfWeek(date), 'd MMM')})`
    };
  });

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
    queryKey: ["challengeLeaders", selectedDay, selectedWeek, selectedMonth],
    queryFn: async (): Promise<ChallengeLeaders> => {
      console.log("Fetching challenge leaders...");
      
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

      // Parse the selected dates
      const dayStart = parseISO(selectedDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = parseISO(selectedDay);
      dayEnd.setHours(23, 59, 59, 999);

      const weekStart = parseISO(selectedWeek);
      const weekEnd = endOfWeek(weekStart);

      const [year, month] = selectedMonth.split('-');
      const monthStart = startOfMonth(new Date(Number(year), Number(month) - 1));
      const monthEnd = endOfMonth(monthStart);

      // Fetch sales for each period
      const { data: dailySales } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", dayStart.toISOString())
        .lte("Timestamp", dayEnd.toISOString());

      const { data: weeklySales } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", weekStart.toISOString())
        .lte("Timestamp", weekEnd.toISOString());

      const { data: monthlySales } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", monthStart.toISOString())
        .lte("Timestamp", monthEnd.toISOString());

      // Calculate totals for each period
      const calculateLeader = (sales: Purchase[] | null) => {
        if (!sales || sales.length === 0) return null;
        
        const totals = sales.reduce((acc: { [key: string]: number }, sale) => {
          const name = sale["User Display Name"];
          const amount = Number(sale.Amount || 0);
          acc[name] = (acc[name] || 0) + amount;
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
      const currentMonthName = format(monthStart, 'MMMM yyyy');

      console.log("Leaders calculated:", { dailyLeader, weeklyLeader, monthlyLeader });

      return {
        dailyLeader,
        weeklyLeader,
        monthlyLeader,
        currentMonth: currentMonthName
      };
    }
  });

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-6 animate-fade-in">Tävlingar & Bonusar</h1>

      <ChallengeCard
        icon={<Trophy size={24} />}
        iconColor="text-yellow-500"
        title="Dagens Utmaning"
        challenge={challenges?.daily_challenge || "Laddar..."}
        reward={challenges?.daily_reward || "Laddar..."}
        leader={leaders?.dailyLeader}
        filter={{
          options: dayOptions,
          value: selectedDay,
          onValueChange: setSelectedDay,
          placeholder: "Välj datum"
        }}
      />

      <ChallengeCard
        icon={<Gift size={24} />}
        iconColor="text-purple-500"
        title="Veckans Utmaning"
        challenge={challenges?.weekly_challenge || "Laddar..."}
        reward={challenges?.weekly_reward || "Laddar..."}
        leader={leaders?.weeklyLeader}
        filter={{
          options: weekOptions,
          value: selectedWeek,
          onValueChange: setSelectedWeek,
          placeholder: "Välj vecka"
        }}
      />

      <ChallengeCard
        icon={<Laptop size={24} />}
        iconColor="text-blue-500"
        title="Månadens Utmaning"
        challenge={challenges?.monthly_challenge || "Laddar..."}
        reward={challenges?.monthly_reward || "Laddar..."}
        leader={leaders?.monthlyLeader}
        filter={{
          options: monthOptions,
          value: selectedMonth,
          onValueChange: setSelectedMonth,
          placeholder: "Välj månad"
        }}
      />

      <AllTimeStats />
    </PageLayout>
  );
};

export default Competitions;
