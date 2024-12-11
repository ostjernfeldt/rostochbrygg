import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useState } from "react";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

interface PurchaseData {
  "User Display Name": string;
  Amount: number;
}

const Leaderboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return `${format(startOfWeek(now), 'yyyy-MM-dd')}`;
  });

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

  const processLeaderboardData = (salesData: PurchaseData[]): UserSales[] => {
    const userSales = salesData.reduce((acc: { [key: string]: UserSales }, sale) => {
      const userName = sale["User Display Name"];
      const amount = Number(sale.Amount || 0);

      if (!acc[userName]) {
        acc[userName] = {
          "User Display Name": userName,
          totalAmount: 0,
          salesCount: 0
        };
      }

      acc[userName].totalAmount += amount;
      acc[userName].salesCount += 1;

      return acc;
    }, {});

    return Object.values(userSales).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const { data: dailyLeaderboard, isLoading: isDailyLoading } = useQuery({
    queryKey: ["dailyLeaderboard"],
    queryFn: async () => {
      console.log("Fetching daily leaderboard data...");
      
      const { data: dateData, error: dateError } = await supabase
        .from("purchases")
        .select("Timestamp")
        .order("Timestamp", { ascending: false })
        .limit(1);

      if (dateError) throw dateError;
      if (!dateData?.length) return [];

      const latestDate = new Date(dateData[0].Timestamp);
      const startOfDay = new Date(latestDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(latestDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", startOfDay.toISOString())
        .lte("Timestamp", endOfDay.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData || []);
    }
  });

  const { data: weeklyLeaderboard, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ["weeklyLeaderboard", selectedWeek],
    queryFn: async () => {
      console.log("Fetching weekly leaderboard data...");
      const weekStart = new Date(selectedWeek);
      const weekEnd = endOfWeek(weekStart);

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", weekStart.toISOString())
        .lte("Timestamp", weekEnd.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData || []);
    }
  });

  const { data: monthlyLeaderboard, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ["monthlyLeaderboard", selectedMonth],
    queryFn: async () => {
      console.log("Fetching monthly leaderboard data...");
      const [year, month] = selectedMonth.split('-');
      const monthStart = startOfMonth(new Date(Number(year), Number(month) - 1));
      const monthEnd = endOfMonth(monthStart);

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", monthStart.toISOString())
        .lte("Timestamp", monthEnd.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData || []);
    }
  });

  return (
    <PageLayout>
      <div className="space-y-8">
        <LeaderboardSection
          title="Dagens topplista"
          data={dailyLeaderboard}
          isLoading={isDailyLoading}
        />

        <LeaderboardSection
          title="Veckans topplista"
          data={weeklyLeaderboard}
          isLoading={isWeeklyLoading}
          filter={{
            options: weekOptions,
            value: selectedWeek,
            onValueChange: setSelectedWeek,
            placeholder: "Välj vecka"
          }}
        />

        <LeaderboardSection
          title="Månadens topplista"
          data={monthlyLeaderboard}
          isLoading={isMonthlyLoading}
          filter={{
            options: monthOptions,
            value: selectedMonth,
            onValueChange: setSelectedMonth,
            placeholder: "Välj månad"
          }}
        />
      </div>
    </PageLayout>
  );
};

export default Leaderboard;