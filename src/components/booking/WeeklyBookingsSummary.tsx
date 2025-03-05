import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import { useWeeklyBookingSummary } from '@/hooks/useShiftBookings';
export function WeeklyBookingsSummary() {
  // Always use the current week's start date
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  // Adjust to Monday as first day (1 = Monday, 0 = Sunday)
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const {
    summary,
    isLoading
  } = useWeeklyBookingSummary(undefined, startOfWeek);
  if (isLoading) {
    return <div className="w-full bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 backdrop-blur-sm rounded-xl p-4 border border-[#33333A] animate-pulse shadow-lg">
        <div className="h-16"></div>
      </div>;
  }
  const endDate = addDays(startOfWeek, 6);

  // Check if requirement is met
  const requirementMet = (summary?.total_bookings || 0) >= 2;
  return;
}