
import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { AlertCircle, Calendar, CheckCircle, InfoIcon, Clock } from "lucide-react";
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
        <div className="w-full bg-gradient-to-br from-[#151a29]/95 to-[#1e2235]/95 backdrop-blur-sm rounded-xl border border-[#33333A]/80 shadow-lg cursor-pointer hover:border-primary/50 transition-all duration-300 overflow-hidden group relative">
          {/* Top highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/5 via-primary/30 to-primary/5"></div>
          
          {/* Side highlight */}
          <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent"></div>
          
          {/* Content with better padding */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-full">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-[15px]">Denna vecka</h3>
              </div>
              <div className="flex items-center gap-2 bg-black/20 px-2.5 py-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">
                  {summary?.total_bookings || 0}/2 pass
                </span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-400 font-medium">
              {format(startOfWeek, 'd', { locale: sv })} mars - {format(endDate, 'd', { locale: sv })} mars
            </div>
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
