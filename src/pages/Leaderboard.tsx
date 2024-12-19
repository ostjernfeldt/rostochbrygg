import { useState } from "react";
import { format, startOfWeek, endOfWeek, parseISO, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { useLeaderboardDates } from "@/hooks/useLeaderboardDates";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedWeek, setSelectedWeek] = useState("");

  // Handle dates loaded from the server
  const handleDatesLoaded = (dates: string[]) => {
    if (dates.length > 0 && !selectedDay) {
      const latestDate = dates[0];
      setSelectedDay(latestDate);
      
      const latestWeekStart = format(startOfWeek(parseISO(latestDate)), 'yyyy-MM-dd');
      setSelectedWeek(latestWeekStart);
    }
  };

  // Fetch dates with sales activity
  const { data: salesDates } = useLeaderboardDates(handleDatesLoaded);

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

  // Fetch leaderboard data for each time period
  const { data: dailyLeaderboard, isLoading: isDailyLoading } = useLeaderboardData('daily', selectedDay);
  const { data: weeklyLeaderboard, isLoading: isWeeklyLoading } = useLeaderboardData('weekly', selectedWeek);
  const { data: monthlyLeaderboard, isLoading: isMonthlyLoading } = useLeaderboardData('monthly', selectedMonth);

  const getLeaderboardTitle = () => {
    if (dailyLeaderboard?.latestDate && dailyLeaderboard.latestDate !== selectedDay) {
      return `Senaste försäljning ${format(new Date(dailyLeaderboard.latestDate), 'd MMMM')}`;
    }
    return "Dagens topplista";
  };

  return (
    <PageLayout>
      <div className="space-y-8">
        <LeaderboardSection
          title={getLeaderboardTitle()}
          data={dailyLeaderboard?.dailyLeaders}
          isLoading={isDailyLoading}
          filter={{
            options: dayOptions,
            value: selectedDay,
            onValueChange: setSelectedDay,
            placeholder: "Välj datum"
          }}
          onUserClick={(userName) => navigate(`/staff/${encodeURIComponent(userName)}`)}
        />

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