
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShiftWithBookings } from '@/types/booking';
import { useBookShift } from '@/hooks/useShiftBookings';

interface ShiftCardProps {
  shift: ShiftWithBookings;
  isUserAdmin: boolean;
  onViewDetails: (shiftId: string) => void;
}

export function ShiftCard({ shift, isUserAdmin, onViewDetails }: ShiftCardProps) {
  const { mutate: bookShift, isPending } = useBookShift();
  
  const handleBookShift = () => {
    bookShift(shift.id);
  };
  
  const formattedDate = format(new Date(shift.date), 'EEEE d MMMM', { locale: sv });
  const startTime = shift.start_time.substring(0, 5);
  const endTime = shift.end_time.substring(0, 5);
  
  const day = format(new Date(shift.date), 'EEEE', { locale: sv });
  const dateNumber = format(new Date(shift.date), 'd MMMM', { locale: sv });

  const isBooked = shift.is_booked_by_current_user;
  const isFull = shift.available_slots_remaining === 0;

  return (
    <div 
      className={`rounded-xl p-4 border shadow-sm transition-all duration-200 ${
        isBooked 
          ? 'bg-card/90 border-primary/40 shadow-primary/5' 
          : isFull 
            ? 'bg-card/70 border-[#33333A]/50 opacity-80' 
            : 'bg-card/80 border-[#33333A] hover:border-primary/30 hover:shadow-md'
      } cursor-pointer`}
      onClick={() => onViewDetails(shift.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-base capitalize">{day}</h3>
          <p className="text-sm text-muted-foreground">{dateNumber}</p>
        </div>
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary/80" />
          <span>{startTime} - {endTime}</span>
        </div>
      </div>
      
      {shift.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{shift.description}</p>
      )}
      
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-primary/80" />
          <span>{shift.bookings.length} / {shift.available_slots}</span>
        </div>
        
        {!isUserAdmin && !shift.is_booked_by_current_user && shift.available_slots_remaining > 0 && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleBookShift();
            }} 
            size="sm"
            disabled={isPending}
            className="text-xs h-8 bg-primary hover:bg-primary/90 shadow-sm transition-all"
          >
            {isPending ? "Bokar..." : "Boka"}
          </Button>
        )}
        
        {!isUserAdmin && shift.is_booked_by_current_user && (
          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border border-primary/20 shadow-sm">Bokad</Badge>
        )}
        
        {isUserAdmin && (
          <Badge 
            variant={shift.available_slots_remaining > 0 ? "outline" : "destructive"} 
            className={`text-xs shadow-sm ${shift.available_slots_remaining > 0 ? 'bg-card/50' : ''}`}
          >
            {shift.available_slots_remaining} platser kvar
          </Badge>
        )}
      </div>
    </div>
  );
}
