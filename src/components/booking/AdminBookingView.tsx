
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users, PlusCircle, GanttChartSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShiftCard } from '@/components/booking/ShiftCard';
import { CreateShiftForm } from '@/components/booking/CreateShiftForm';
import { ShiftWithBookings } from '@/types/booking';
import { Badge } from '@/components/ui/badge';

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

  // Group shifts by date to display in a cleaner format
  const groupShiftsByDate = () => {
    const groupedShifts: Record<string, ShiftWithBookings[]> = {};
    
    if (Array.isArray(shifts)) {
      shifts.forEach(shift => {
        if (shift && shift.date) {
          const dateKey = shift.date;
          if (!groupedShifts[dateKey]) {
            groupedShifts[dateKey] = [];
          }
          groupedShifts[dateKey].push(shift);
        }
      });
    }
    
    return groupedShifts;
  };
  
  const groupedShifts = groupShiftsByDate();
  const datesInWeek = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return format(date, 'yyyy-MM-dd');
  });

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
    <div className="space-y-8">
      {/* Header with title and week info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bokningshantering</h1>
          <p className="text-muted-foreground mt-1">Hantera säljpass och bokningar</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formattedDateRange}
        </Badge>
      </div>
      
      {/* Create new shift card */}
      <Card className="bg-gradient-to-br from-[#1e253a]/90 to-[#252a3d]/95 backdrop-blur-sm border-[#33333A]/60 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/15">
              <PlusCircle className="h-4 w-4 text-primary" />
            </div>
            Skapa nytt säljpass
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateShiftForm />
        </CardContent>
      </Card>
      
      {/* Weekly shifts view */}
      <Card className="bg-gradient-to-br from-[#1e253a]/90 to-[#252a3d]/95 backdrop-blur-sm border-[#33333A]/60 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/15">
              <GanttChartSquare className="h-4 w-4 text-primary" />
            </div>
            Schemalagda säljpass
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card/40 h-36 rounded-xl animate-pulse border border-[#33333A]/50"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {datesInWeek.map(dateKey => {
                const dayShifts = groupedShifts[dateKey] || [];
                if (dayShifts.length === 0) return null;
                
                const dayDate = new Date(dateKey);
                const dayName = format(dayDate, 'EEEE', { locale: sv });
                const dayNumber = format(dayDate, 'd MMMM', { locale: sv });
                
                return (
                  <div key={dateKey} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium capitalize">{dayName}</h3>
                        <p className="text-sm text-muted-foreground">{dayNumber}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {dayShifts.map(shift => (
                        <ShiftCard 
                          key={shift.id} 
                          shift={shift} 
                          isUserAdmin={true} 
                          onViewDetails={onViewShiftDetails} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* When no shifts are available for the week */}
              {processedShifts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-primary/40" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Inga säljpass schemalagda</h3>
                  <p className="text-muted-foreground max-w-md">
                    Det finns inga säljpass schemalagda för denna vecka. Skapa nya pass med formuläret ovan.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
