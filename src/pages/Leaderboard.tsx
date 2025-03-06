
import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, parseISO, subMonths } from "date-fns";
import { sv } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { useLeaderboardDates } from "@/hooks/useLeaderboardDates";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(() => {
    return format(startOfWeek(new Date()), 'yyyy-MM-dd');
  });
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [previousMonthsWithData, setPreviousMonthsWithData] = useState<string[]>([]);

  const handleDatesLoaded = (dates: string[]) => {
    console.log("Dates loaded:", dates);
    
    if (dates.length > 0) {
      const monthsWithData = new Set<string>();
      dates.forEach(date => {
        const month = date.substring(0, 7);
        monthsWithData.add(month);
      });
      setPreviousMonthsWithData(Array.from(monthsWithData).sort().reverse());
    }
  };

  const { data: salesDates } = useLeaderboardDates(handleDatesLoaded);

  const weekOptions = Array.from({ length: 5 }, (_, i) => {
    const date = startOfWeek(new Date());
    date.setDate(date.getDate() - (i * 7));
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: `Vecka ${format(date, 'w')} (${format(date, 'd MMM', { locale: sv })} - ${format(endOfWeek(date), 'd MMM', { locale: sv })})`
    };
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: sv })
    };
  });

  const { 
    data: weeklyLeaderboard, 
    isLoading: isWeeklyLoading,
    error: weeklyError
  } = useLeaderboardData('weekly', selectedWeek);

  const { 
    data: monthlyLeaderboard, 
    isLoading: isMonthlyLoading,
    error: monthlyError
  } = useLeaderboardData('monthly', selectedMonth);

  useEffect(() => {
    if (!isMonthlyLoading && monthlyLeaderboard && previousMonthsWithData.length > 0) {
      const currentMonthHasData = 
        monthlyLeaderboard.monthlyLeaders && 
        monthlyLeaderboard.monthlyLeaders.length > 0;
      
      if (!currentMonthHasData && !previousMonthsWithData.includes(selectedMonth)) {
        console.log("Current month has no data, finding previous month with data");
        
        const mostRecentMonthWithData = previousMonthsWithData[0];
        
        if (mostRecentMonthWithData && mostRecentMonthWithData !== selectedMonth) {
          console.log(`Switching to month with data: ${mostRecentMonthWithData}`);
          setSelectedMonth(mostRecentMonthWithData);
        }
      }
    }
  }, [monthlyLeaderboard, isMonthlyLoading, previousMonthsWithData, selectedMonth]);

  useEffect(() => {
    console.log("Weekly leaderboard data:", weeklyLeaderboard);
    console.log("Monthly leaderboard data:", monthlyLeaderboard);
  }, [weeklyLeaderboard, monthlyLeaderboard]);

  const ErrorAlert = ({ error }: { error: Error }) => (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
      </AlertDescription>
    </Alert>
  );

  return (
    <PageLayout>
      <div className="space-y-8">
        {weeklyError && <ErrorAlert error={weeklyError as Error} />}
        <LeaderboardSection
          title="Veckans topplista"
          data={weeklyLeaderboard?.weeklyLeaders || []}
          isLoading={isWeeklyLoading}
          filter={{
            options: weekOptions,
            value: selectedWeek,
            onValueChange: setSelectedWeek,
            placeholder: "Välj vecka"
          }}
          onUserClick={(userName) => navigate(`/staff/${encodeURIComponent(userName)}`)}
        />

        {monthlyError && <ErrorAlert error={monthlyError as Error} />}
        <LeaderboardSection
          title="Månadens topplista"
          data={monthlyLeaderboard?.monthlyLeaders || []}
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
