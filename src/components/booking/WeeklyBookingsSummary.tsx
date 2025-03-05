
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
  
  const { summary, isLoading } = useWeeklyBookingSummary(undefined, startOfWeek);
  
  if (isLoading) {
    return <div className="w-full bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 backdrop-blur-sm rounded-xl p-4 border border-[#33333A] animate-pulse shadow-lg">
        <div className="h-16"></div>
      </div>;
  }
  
  const endDate = addDays(startOfWeek, 6);

  // Check if requirement is met
  const requirementMet = (summary?.total_bookings || 0) >= 2;
  
  return (
    <div className="w-full bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 backdrop-blur-sm rounded-xl p-4 border border-[#33333A] shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Denna vecka</h3>
        </div>
        <div className="flex items-center gap-1">
          {requirementMet ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span className={`text-sm ${requirementMet ? 'text-green-500' : 'text-amber-500'}`}>
            {summary?.total_bookings || 0}/2 pass
          </span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        {format(startOfWeek, 'd MMM', { locale: sv })} - {format(endDate, 'd MMM', { locale: sv })}
      </div>
    </div>
  );
}
