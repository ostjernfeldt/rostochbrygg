
import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { AlertCircle, Calendar, CheckCircle, InfoIcon } from "lucide-react";
import { useWeeklyBookingSummary } from '@/hooks/useShiftBookings';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
    <Popover>
      <PopoverTrigger asChild>
        <div className="w-full bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 backdrop-blur-sm rounded-xl p-4 border border-[#33333A] shadow-lg cursor-pointer hover:border-primary/50 transition-colors">
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
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-gradient-to-br from-[#2A1F15] to-[#332210] border border-amber-600/30 shadow-xl rounded-xl p-0 overflow-hidden">
        <div className="relative">
          {/* Decorative top header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/80 via-amber-400 to-amber-500/80"></div>
          
          {/* Main content with improved spacing */}
          <div className="px-6 pt-6 pb-5">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <InfoIcon className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-300 mb-2">Viktigt om bokningar</h3>
                <p className="text-sm text-amber-100/80 leading-relaxed">
                  Kom ihåg att boka minst 2 pass per vecka. Om du behöver avboka ett pass måste du kontakta din säljledare direkt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
