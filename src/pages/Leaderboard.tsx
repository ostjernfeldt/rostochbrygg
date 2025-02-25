
import { useState } from "react";
import { format, startOfWeek, endOfWeek, parseISO, subMonths } from "date-fns";
import { sv } from "date-fns/locale";  // Importera svenska lokaliseringen
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { useLeaderboardDates } from "@/hooks/useLeaderboardDates";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  // Handle dates loaded from the server
  const handleDatesLoaded = (dates: string[]) => {
    if (dates.length > 0 && !selectedWeek) {
      console.log("Latest sale date:", dates[0]);
      const latestDate = parseISO(dates[0]);
      const latestWeekStart = format(startOfWeek(latestDate), 'yyyy-MM-dd');
      setSelectedWeek(latestWeekStart);
      console.log("Setting latest week start to:", latestWeekStart);
    }
  };

  // Fetch dates with sales activity
  const { data: salesDates } = useLeaderboardDates(handleDatesLoaded);

  // Generate weeks based on sales dates
  const weekOptions = salesDates ? Array.from({ length: 5 }, (_, i) => {
    const latestDate = parseISO(salesDates[0]);
    const date = startOfWeek(latestDate);
    date.setDate(date.getDate() - (i * 7));
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: `Vecka ${format(date, 'w')} (${format(date, 'd MMM', { locale: sv })} - ${format(endOfWeek(date), 'd MMM', { locale: sv })})`
    };
  }) : [];

  // Generate last 12 months for the dropdown, now with Swedish month names
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: sv })
    };
  });

  // Fetch leaderboard data for each time period
  const { data: weeklyLeaderboard, isLoading: isWeeklyLoading } = useLeaderboardData('weekly', selectedWeek);
  const { data: monthlyLeaderboard, isLoading: isMonthlyLoading } = useLeaderboardData('monthly', selectedMonth);

  return (
    <PageLayout>
      <div className="space-y-8">
        <LeaderboardSection
          title="Veckans topplista"
          data={weeklyLeaderboard?.weeklyLeaders}
          isLoading={isWeeklyLoading}
          filter={{
            options: weekOptions,
            value: selectedWeek,
            onValueChange: setSelectedWeek,
            placeholder: "Välj vecka"
          }}
          onUserClick={(userName) => navigate(`/staff/${encodeURIComponent(userName)}`)}
        />

        <LeaderboardSection
          title="Månadens topplista"
          data={monthlyLeaderboard?.monthlyLeaders}
          isLoading={isMonthlyLoading}
          filter={{
            options: monthOptions,
            value: selectedMonth,
            onValueChange: setSelectedMonth,
            placeholder: "Välj månad"
          }}
          onUserClick={(userName) => navigate(`/staff/${encodeURIComponent(userName)}`)}
        />
      </div>
    </PageLayout>
  );
};

export default Leaderboard;
