
import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import { useWeeklyBookingSummary } from '@/hooks/useShiftBookings';

interface WeeklyBookingsSummaryProps {
  weekStartDate?: Date;
}

export function WeeklyBookingsSummary({ weekStartDate }: WeeklyBookingsSummaryProps) {
  const { summary, isLoading } = useWeeklyBookingSummary(undefined, weekStartDate);
  
  if (isLoading) {
    return (
      <div className="w-full bg-card/50 rounded-xl p-4 border border-[#33333A] animate-pulse">
        <div className="h-16"></div>
      </div>
    );
  }
  
  const startDate = weekStartDate || new Date(Date.now());
  const endDate = addDays(startDate, 6);
  
  // Check if requirement is met
  const requirementMet = (summary?.total_bookings || 0) >= 2;
  
  return (
    <div className={`w-full rounded-xl p-5 border shadow-md transition-all ${requirementMet ? 'bg-[#1A2E22]/90 border-emerald-800/20 hover:shadow-emerald-900/10' : 'bg-[#2E1A1A]/90 border-amber-800/20 hover:shadow-amber-900/10'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="font-medium text-[15px]">Dina pass</h2>
      </div>
      
      {requirementMet ? (
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Du har bokat {summary?.total_bookings || 0} pass denna vecka
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Tvåpassregeln: Boka minst {2 - (summary?.total_bookings || 0)} pass till
          </span>
        </div>
      )}
    </div>
  );
}
