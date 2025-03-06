
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShiftWithBookings } from '@/types/booking';

interface ShiftCardProps {
  shift: ShiftWithBookings;
  isUserAdmin: boolean;
  onViewDetails: (shiftId: string) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectShift?: (shiftId: string) => void;
}

export function ShiftCard({ 
  shift, 
  isUserAdmin, 
  onViewDetails, 
  isSelectable = false,
  isSelected = false,
  onSelectShift 
}: ShiftCardProps) {
  const startTime = shift.start_time.substring(0, 5);
  const endTime = shift.end_time.substring(0, 5);
  
  const day = format(new Date(shift.date), 'EEEE', { locale: sv });
  const dateNumber = format(new Date(shift.date), 'd MMMM', { locale: sv });

  // Filter to only display confirmed bookings
  const confirmedBookings = shift.bookings.filter(booking => booking.status === 'confirmed');
  
  const isBooked = shift.is_booked_by_current_user;
  const isFull = shift.available_slots - confirmedBookings.length === 0;

  const handleCardClick = () => {
    if (isSelectable && onSelectShift && !isBooked && !isFull) {
      onSelectShift(shift.id);
    } else if (!isSelectable) {
      onViewDetails(shift.id);
    }
  };

  return (
    <div 
      className={`rounded-xl p-4 border shadow-sm transition-all duration-300 ${
        isSelected 
          ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/40 shadow-primary/20'
          : isBooked 
            ? 'bg-gradient-to-br from-[#1F2937]/90 to-[#1A2333]/95 backdrop-blur-sm border-primary/40 shadow-primary/10' 
            : isFull 
              ? 'bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 backdrop-blur-sm border-[#33333A]/50 opacity-80' 
              : 'bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm border-[#33333A] hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
      } ${(!isBooked && !isFull) ? 'cursor-pointer' : isFull ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-base capitalize">{day}</h3>
          <p className="text-sm text-muted-foreground">{dateNumber}</p>
        </div>
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>{startTime} - {endTime}</span>
        </div>
      </div>
      
      {shift.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{shift.description}</p>
      )}
      
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>{confirmedBookings.length} / {shift.available_slots}</span>
        </div>
        
        {isSelected && (
          <Badge className="bg-primary text-white border-none">
            <Check className="h-3 w-3 mr-1" /> Vald
          </Badge>
        )}
        
        {!isSelectable && !isUserAdmin && !shift.is_booked_by_current_user && (shift.available_slots - confirmedBookings.length) > 0 && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(shift.id);
            }} 
            size="sm"
            className="text-xs h-8 bg-primary hover:bg-primary/90 shadow-sm transition-all"
          >
            Detaljer
          </Button>
        )}
        
        {!isUserAdmin && shift.is_booked_by_current_user && (
          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border border-primary/20 shadow-sm">Bokad</Badge>
        )}
        
        {isUserAdmin && (
          <Badge 
            variant={shift.available_slots - confirmedBookings.length > 0 ? "outline" : "destructive"} 
            className={`text-xs shadow-sm ${shift.available_slots - confirmedBookings.length > 0 ? 'bg-card/50' : ''}`}
          >
            {shift.available_slots - confirmedBookings.length} platser kvar
          </Badge>
        )}
      </div>
    </div>
  );
}
