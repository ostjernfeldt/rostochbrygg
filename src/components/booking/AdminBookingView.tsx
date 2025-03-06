
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShiftCard } from '@/components/booking/ShiftCard';
import { CreateShiftForm } from '@/components/booking/CreateShiftForm';
import { ShiftWithBookings } from '@/types/booking';
import { LoadingFallback } from '@/components/common/LoadingFallback';

interface AdminBookingViewProps {
  shifts: ShiftWithBookings[];
  isLoading: boolean;
  onViewShiftDetails: (shiftId: string) => void;
}

export const AdminBookingView = ({ 
  shifts, 
  isLoading, 
  onViewShiftDetails 
}: AdminBookingViewProps) => {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  
  const formattedDateRange = `${format(currentWeekStart, 'd MMM', {
    locale: sv
  })} - ${format(weekEnd, 'd MMM yyyy', {
    locale: sv
  })}`;

  const processedShifts: ShiftWithBookings[] = Array.isArray(shifts) ? shifts.map(shift => {
    return {
      ...shift,
      bookings: Array.isArray(shift.bookings) ? shift.bookings : [],
      available_slots_remaining: shift.available_slots_remaining !== undefined 
        ? shift.available_slots_remaining 
        : shift.available_slots,
      is_booked_by_current_user: shift.is_booked_by_current_user || false
    };
  }) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm border-[#33333A] shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-medium">Skapa nytt säljpass</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CreateShiftForm />
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm border-[#33333A] shadow-lg">
        <CardHeader className="flex-row justify-between items-center pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-medium">Säljpass denna vecka</CardTitle>
              <div className="text-sm text-muted-foreground">{formattedDateRange}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card/50 h-32 rounded-xl animate-pulse border border-[#33333A]"></div>
              ))}
            </div>
          ) : Array.isArray(processedShifts) && processedShifts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {processedShifts.map(shift => (
                <ShiftCard 
                  key={shift.id} 
                  shift={shift} 
                  isUserAdmin={true} 
                  onViewDetails={onViewShiftDetails} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">Inga säljpass schemalagda för denna vecka.</p>
              <p className="text-xs text-muted-foreground mt-1">Skapa nya pass med formuläret ovan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
