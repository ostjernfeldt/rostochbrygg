import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useChallenge } from "@/hooks/useChallenge";

interface ChallengePeriod {
  startDate: Date;
  endDate: Date;
}

export const useChallengeQueries = (selectedDay: string, selectedWeek: string, selectedMonth: string) => {
  // Calculate date ranges
  const getDailyPeriod = (): ChallengePeriod => {
    const dayStart = parseISO(selectedDay);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    return { startDate: dayStart, endDate: dayEnd };
  };

  const getWeeklyPeriod = (): ChallengePeriod => {
    const weekStart = startOfWeek(parseISO(selectedWeek));
    const weekEnd = endOfWeek(weekStart);
    return { startDate: weekStart, endDate: weekEnd };
  };

  const getMonthlyPeriod = (): ChallengePeriod => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    return { startDate: monthStart, endDate: monthEnd };
  };

  const { startDate: dayStart, endDate: dayEnd } = getDailyPeriod();
  const { startDate: weekStart, endDate: weekEnd } = getWeeklyPeriod();
  const { startDate: monthStart, endDate: monthEnd } = getMonthlyPeriod();

  const { data: dailyChallenge } = useChallenge('daily', dayStart, dayEnd);
  const { data: weeklyChallenge } = useChallenge('weekly', weekStart, weekEnd);
  const { data: monthlyChallenge } = useChallenge('monthly', monthStart, monthEnd);

  return {
    daily_challenge: "Sälj för störst belopp under dagen",
    daily_reward: dailyChallenge ? `${dailyChallenge.reward} SEK bonus` : "Ingen tävling idag",
    weekly_challenge: "Sälj för störst belopp under veckan",
    weekly_reward: weeklyChallenge ? `${weeklyChallenge.reward} SEK bonus` : "Ingen tävling denna vecka",
    monthly_challenge: "Sälj för störst belopp under månaden",
    monthly_reward: monthlyChallenge ? `${monthlyChallenge.reward} SEK bonus` : "Ingen tävling denna månad"
  };
};