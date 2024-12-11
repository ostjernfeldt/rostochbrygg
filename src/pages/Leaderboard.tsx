import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { useNavigate } from "react-router-dom";

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

interface PurchaseData {
  "User Display Name": string;
  Amount: number;
  Timestamp: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedWeek, setSelectedWeek] = useState("");

  // Fetch dates with sales activity for the daily filter
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
    },
    meta: {
      onSuccess: (dates: string[]) => {
        if (dates && dates.length > 0 && !selectedDay) {
          // Set the most recent date as default
          const latestDate = dates[0];
          setSelectedDay(latestDate);
          
          // Set the week containing the latest date as default
          const latestWeekStart = format(startOfWeek(parseISO(latestDate)), 'yyyy-MM-dd');
          setSelectedWeek(latestWeekStart);
        }
      }
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
    queryKey: ["dailyLeaderboard", selectedDay],
    queryFn: async () => {
      if (!selectedDay) return [];
      
      console.log("Fetching daily leaderboard data...");
      const dayStart = parseISO(selectedDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount, Timestamp')
        .gte("Timestamp", dayStart.toISOString())
        .lte("Timestamp", dayEnd.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData || []);
    },
    enabled: !!selectedDay
  });

  const { data: weeklyLeaderboard, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ["weeklyLeaderboard", selectedWeek],
    queryFn: async () => {
      if (!selectedWeek) return [];

      console.log("Fetching weekly leaderboard data...");
      const weekStart = parseISO(selectedWeek);
      const weekEnd = endOfWeek(weekStart);

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount, Timestamp')
        .gte("Timestamp", weekStart.toISOString())
        .lte("Timestamp", weekEnd.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData || []);
    },
    enabled: !!selectedWeek
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
        .select('"User Display Name", Amount, Timestamp')
        .gte("Timestamp", monthStart.toISOString())
        .lte("Timestamp", monthEnd.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData || []);
    }
  });

  const handleUserClick = (userName: string) => {
    navigate(`/staff/${encodeURIComponent(userName)}`);
  };

  return (
    <PageLayout>
      <div className="space-y-8">
        <LeaderboardSection
          title="Dagens topplista"
          data={dailyLeaderboard}
          isLoading={isDailyLoading}
          filter={{
            options: dayOptions,
            value: selectedDay,
            onValueChange: setSelectedDay,
            placeholder: "Välj datum"
          }}
          onUserClick={handleUserClick}
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
          onUserClick={handleUserClick}
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
          onUserClick={handleUserClick}
        />
      </div>
    </PageLayout>
  );
};

export default Leaderboard;