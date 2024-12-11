import { Trophy, Gift, Laptop } from "lucide-react";
import { ChallengeCard } from "./ChallengeCard";
import { format, startOfWeek } from "date-fns";
import { useState, useEffect } from "react";
import { ChallengeDateFilter } from "./ChallengeDateFilter";
import { useDefaultSalesDate } from "@/hooks/useDefaultSalesDate";
import { useChallengeQueries } from "./ChallengeQueries";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

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

  const challenges = useChallengeQueries(selectedDay, selectedWeek, selectedMonth);
  const { data: leaders } = useLeaderboardData('daily', selectedDay);

  const getTopLeader = (leaderArray: Array<{ "User Display Name": string; totalAmount: number; salesCount: number }> | undefined) => {
    if (!leaderArray || leaderArray.length === 0) return null;
    const leader = leaderArray[0];
    return {
      name: leader["User Display Name"],
      amount: leader.totalAmount
    };
  };

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
        title="Dagens Tävling"
        challenge={challenges?.daily_challenge || "Laddar..."}
        reward={challenges?.daily_reward || "Laddar..."}
        leader={getTopLeader(leaders?.dailyLeaders)}
        filter={dailyFilter}
      />

      <ChallengeCard
        icon={<Gift size={24} />}
        iconColor="text-purple-500"
        title="Veckans Tävling"
        challenge={challenges?.weekly_challenge || "Laddar..."}
        reward={challenges?.weekly_reward || "Laddar..."}
        leader={getTopLeader(leaders?.weeklyLeaders)}
        filter={weeklyFilter}
      />

      <ChallengeCard
        icon={<Laptop size={24} />}
        iconColor="text-blue-500"
        title="Månadens Tävling"
        challenge={challenges?.monthly_challenge || "Laddar..."}
        reward={challenges?.monthly_reward || "Laddar..."}
        leader={getTopLeader(leaders?.monthlyLeaders)}
        filter={monthlyFilter}
      />
    </>
  );
};