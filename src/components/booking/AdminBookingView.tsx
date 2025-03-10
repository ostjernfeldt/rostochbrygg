import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isThisWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users, PlusCircle, GanttChartSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShiftCard } from '@/components/booking/ShiftCard';
import { ShiftWithBookings } from '@/types/booking';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { CreateShiftSheet } from '@/components/booking/CreateShiftSheet';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface AdminBookingViewProps {
  shifts: ShiftWithBookings[];
  isLoading: boolean;
  onViewShiftDetails: (shiftId: string) => void;
  currentWeekStart: Date;
  weekEnd: Date;
  onWeekChange: (newWeekStart: Date) => void;
}

export const AdminBookingView = ({ 
  shifts, 
  isLoading, 
  onViewShiftDetails,
  currentWeekStart,
  weekEnd,
  onWeekChange
}: AdminBookingViewProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const formattedDateRange = `${format(currentWeekStart, 'd MMM', {
    locale: sv
  })} - ${format(weekEnd, 'd MMM yyyy', {
    locale: sv
  })}`;

  const handlePreviousWeek = () => {
    const newWeekStart = subWeeks(currentWeekStart, 1);
    onWeekChange(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = addWeeks(currentWeekStart, 1);
    onWeekChange(newWeekStart);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const newWeekStart = startOfWeek(date, { weekStartsOn: 1 });
      onWeekChange(newWeekStart);
      setCalendarOpen(false);
    }
  };

  const isCurrentWeek = isThisWeek(currentWeekStart, { weekStartsOn: 1 });

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
    <div className="space-y-6">
      <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex justify-between items-center'}`}>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bokningshantering</h1>
          <p className="text-muted-foreground mt-1">Hantera säljpass och bokningar</p>
        </div>
        
        <div className={`${isMobile ? 'flex flex-col space-y-3 w-full' : 'flex items-center gap-3'}`}>
          <div className={`flex items-center ${isMobile ? 'justify-between w-full' : 'gap-2'}`}>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePreviousWeek}
              className="h-10 w-10 bg-primary/10 text-primary hover:bg-primary/15 border-primary/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`${isCurrentWeek 
                    ? 'bg-primary/30 text-primary-foreground border-primary/50 ring-2 ring-primary/20' 
                    : 'bg-primary/10 text-primary border-primary/20'} 
                    px-3 py-2 text-sm font-medium 
                    flex items-center gap-2 cursor-pointer hover:bg-primary/15 transition-all
                    ${isMobile ? 'flex-1 justify-center' : ''}`}
                >
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{formattedDateRange}</span>
                  {isCurrentWeek && !isMobile && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-white rounded-sm whitespace-nowrap">
                      Nuvarande vecka
                    </span>
                  )}
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarComponent
                  mode="single"
                  selected={currentWeekStart}
                  onSelect={handleCalendarSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextWeek}
              className="h-10 w-10 bg-primary/10 text-primary hover:bg-primary/15 border-primary/20"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <Button 
            onClick={() => setSheetOpen(true)}
            size="sm"
            className={`h-10 gap-2 relative overflow-hidden 
              bg-primary/90 hover:bg-primary/80 text-white font-medium 
              shadow-md hover:shadow-lg shadow-primary/20 
              border border-primary/20 hover:border-primary/30 
              transition-all duration-200 rounded-md
              ${isMobile ? 'w-full justify-center' : 'px-5'}
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent 
              before:via-white/20 before:to-transparent before:translate-x-[-200%] 
              hover:before:animate-[shimmer_1.5s_infinite] before:transition-all before:duration-1000`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70 opacity-80" />
            <div className="relative flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Nytt pass</span>
            </div>
          </Button>
        </div>
      </div>
      
      <Card className={`bg-gradient-to-br from-[#1e253a]/90 to-[#252a3d]/95 backdrop-blur-sm border-[#33333A]/60 shadow-lg overflow-hidden ${isCurrentWeek ? 'relative' : ''}`}>
        {isCurrentWeek && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
        )}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/15">
              <GanttChartSquare className="h-4 w-4 text-primary" />
            </div>
            Schemalagda säljpass
            {isCurrentWeek && isMobile && (
              <Badge variant="default" className="ml-2 bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-xs">
                Nu
              </Badge>
            )}
            {isCurrentWeek && !isMobile && (
              <Badge variant="default" className="ml-auto bg-primary/20 text-primary border border-primary/30 px-2 py-0.5">
                Nuvarande vecka
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card/40 h-36 rounded-xl animate-pulse border border-[#33333A]/50"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {datesInWeek.map(dateKey => {
                const dayShifts = groupedShifts[dateKey] || [];
                if (dayShifts.length === 0) return null;
                
                return (
                  <div key={dateKey} className="space-y-5">                    
                    <div className="grid grid-cols-1 gap-5">
                      {dayShifts.map(shift => (
                        <ShiftCard 
                          key={shift.id} 
                          shift={shift} 
                          isUserAdmin={true} 
                          onViewDetails={onViewShiftDetails}
                          showDateInCard={true} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {processedShifts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-primary/40" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Inga säljpass schemalagda</h3>
                  <p className="text-muted-foreground max-w-md">
                    Det finns inga säljpass schemalagda för denna vecka. Skapa nya pass med knappen ovan.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <CreateShiftSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
};
