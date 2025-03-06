
import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, parseISO, subMonths } from "date-fns";
import { sv } from "date-fns/locale";  // Importera svenska lokaliseringen
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { useLeaderboardDates } from "@/hooks/useLeaderboardDates";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Initialize with current week's start date
    return format(startOfWeek(new Date()), 'yyyy-MM-dd');
  });
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [previousMonthsWithData, setPreviousMonthsWithData] = useState<string[]>([]);

  // Handle dates loaded from the server
  const handleDatesLoaded = (dates: string[]) => {
    console.log("Dates loaded:", dates);
    
    // If there are dates, set previous months with data
    if (dates.length > 0) {
      // Generate a list of months with sales data
      const monthsWithData = new Set<string>();
      dates.forEach(date => {
        const month = date.substring(0, 7); // Get YYYY-MM format
        monthsWithData.add(month);
      });
      setPreviousMonthsWithData(Array.from(monthsWithData).sort().reverse()); // Sort descending
    }
  };

  // Fetch dates with sales activity
  const { data: salesDates } = useLeaderboardDates(handleDatesLoaded);

  // Generate weeks based on sales dates or current date
  const weekOptions = Array.from({ length: 5 }, (_, i) => {
    // Always use current date as reference for week options
    const date = startOfWeek(new Date());
    date.setDate(date.getDate() - (i * 7));
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: `Vecka ${format(date, 'w')} (${format(date, 'd MMM', { locale: sv })} - ${format(endOfWeek(date), 'd MMM', { locale: sv })})`
    };
  });

  // Generate last 12 months for the dropdown, with Swedish month names
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: sv })
    };
  });

  // Fetch leaderboard data for each time period
  const { data: weeklyLeaderboard, isLoading: isWeeklyLoading } = useLeaderboardData('weekly', selectedWeek);
  const { 
    data: monthlyLeaderboard, 
    isLoading: isMonthlyLoading 
  } = useLeaderboardData('monthly', selectedMonth);

  // Effect to check if current month has data and fall back to previous month if needed
  useEffect(() => {
    if (!isMonthlyLoading && monthlyLeaderboard && previousMonthsWithData.length > 0) {
      const currentMonthHasData = 
        monthlyLeaderboard.monthlyLeaders && 
        monthlyLeaderboard.monthlyLeaders.length > 0;
      
      // If current month has no data and it's not in our list of months with data
      if (!currentMonthHasData && !previousMonthsWithData.includes(selectedMonth)) {
        console.log("Current month has no data, finding previous month with data");
        
        // Find the most recent month with data
        const mostRecentMonthWithData = previousMonthsWithData[0];
        
        if (mostRecentMonthWithData && mostRecentMonthWithData !== selectedMonth) {
          console.log(`Switching to month with data: ${mostRecentMonthWithData}`);
          setSelectedMonth(mostRecentMonthWithData);
        }
      }
    }
  }, [monthlyLeaderboard, isMonthlyLoading, previousMonthsWithData, selectedMonth]);

  // Debug logs to track data loading
  useEffect(() => {
    console.log("Weekly leaderboard data:", weeklyLeaderboard);
    console.log("Monthly leaderboard data:", monthlyLeaderboard);
  }, [weeklyLeaderboard, monthlyLeaderboard]);

  return (
    <PageLayout>
      <div className="space-y-8">
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
