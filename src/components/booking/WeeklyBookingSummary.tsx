
import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import { useWeeklyBookingSummary } from '@/hooks/useShiftBookings';

export function WeeklyBookingSummary() {
  // Always use the current week's start date
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  // Adjust to Monday as first day (1 = Monday, 0 = Sunday)
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { data: summary, isLoading } = useWeeklyBookingSummary(undefined, startOfWeek);
  
  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 backdrop-blur-sm rounded-xl p-4 border border-[#33333A] animate-pulse shadow-lg">
        <div className="h-16"></div>
      </div>
    );
  }
  
  const endDate = addDays(startOfWeek, 6);
  
  // Check if requirement is met
  const requirementMet = (summary?.total_bookings || 0) >= 2;
  
  return (
    <div className={`w-full rounded-xl p-5 border shadow-lg transition-all duration-300 ${
      requirementMet 
        ? 'bg-gradient-to-br from-[#1A2E22]/90 to-[#152218]/95 backdrop-blur-sm border-emerald-800/30 hover:shadow-emerald-900/10' 
        : 'bg-gradient-to-br from-[#2E1A1A]/90 to-[#251512]/95 backdrop-blur-sm border-amber-800/30 hover:shadow-amber-900/10'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="font-medium text-[15px]">Dina pass denna vecka</h2>
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
