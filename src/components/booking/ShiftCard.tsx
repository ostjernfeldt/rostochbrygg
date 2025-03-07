
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
  showDateInCard?: boolean;
}

export function ShiftCard({ 
  shift, 
  isUserAdmin, 
  onViewDetails, 
  isSelectable = false,
  isSelected = false,
  onSelectShift,
  showDateInCard = false
}: ShiftCardProps) {
  if (!shift || !shift.start_time || !shift.end_time || !shift.date) {
    return null;
  }

  const startTime = shift.start_time.substring(0, 5);
  const endTime = shift.end_time.substring(0, 5);
  
  let day = '';
  let dateNumber = '';
  
  try {
    day = format(new Date(shift.date), 'EEEE', { locale: sv });
    dateNumber = format(new Date(shift.date), 'd MMMM', { locale: sv });
  } catch (error) {
    console.error('Error formatting date:', error);
    day = 'Ogiltig dag';
    dateNumber = 'Ogiltigt datum';
  }

  const bookings = Array.isArray(shift.bookings) ? shift.bookings : [];
  const confirmedBookings = bookings.filter(booking => booking && booking.status === 'confirmed');
  
  const isBooked = !!shift.is_booked_by_current_user;
  const availableSlots = shift.available_slots || 0;
  const bookedSlots = confirmedBookings.length;
  const isFull = bookedSlots >= availableSlots;

  const handleCardClick = () => {
    if (isSelectable && onSelectShift && !isBooked && !isFull) {
      onSelectShift(shift.id);
    } else if (!isSelectable) {
      onViewDetails(shift.id);
    }
  };

  return (
    <div 
      className={`rounded-xl overflow-hidden transition-all duration-300 ${
        isSelected 
          ? 'bg-gradient-to-br from-[#1A467B] to-[#18365F] border border-primary/40 shadow-md shadow-primary/10'
          : isBooked 
            ? 'bg-gradient-to-br from-[#1F2937]/90 to-[#1A2333]/95 border border-primary/30 shadow-sm' 
            : isFull 
              ? 'bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 border border-[#33333A]/50 opacity-80' 
              : 'bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 border border-[#33333A] hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
      } ${(!isBooked && !isFull || isUserAdmin) ? 'cursor-pointer' : isFull ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleCardClick}
    >
      <div className="h-[2px] w-full bg-gradient-to-r from-primary/5 via-primary/30 to-primary/5"></div>
      
      <div className="p-4">
        {/* Show date for all shifts, not just booked ones */}
        <div className="flex items-center mb-3 text-white">
          <Calendar className="h-4 w-4 mr-2 text-primary" />
          <div>
            <span className="font-medium capitalize">{day}</span>
            <span className="ml-1 text-muted-foreground">{dateNumber}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-1 text-xs font-medium flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {startTime} - {endTime}
          </Badge>
          
          {isUserAdmin && (
            <Badge 
              variant={!isFull ? "outline" : "destructive"} 
              className={`text-xs px-2 py-1 flex items-center gap-1.5 ${!isFull ? 'bg-card/40 border-[#33333A]/50' : ''}`}
            >
              <Users className="h-3 w-3" />
              {bookedSlots}/{availableSlots}
            </Badge>
          )}
          
          {isSelected && (
            <Badge className="bg-primary text-white text-xs px-2 py-1 border-none">
              <Check className="h-3 w-3 mr-1" /> Vald
            </Badge>
          )}
        </div>
        
        {shift.description && (
          <p className="text-sm text-muted-foreground/90 mb-3 line-clamp-2">{shift.description}</p>
        )}
        
        <div className="flex justify-between items-center mt-2">
          {!isSelectable && !isUserAdmin && !isBooked && !isFull && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(shift.id);
              }} 
              size="sm"
              className="h-8 bg-primary hover:bg-primary/90 shadow-sm transition-all text-xs"
            >
              Visa detaljer
            </Button>
          )}
          
          {!isUserAdmin && isBooked && (
            <Badge variant="secondary" className="bg-primary/20 text-primary border border-primary/20 px-2 py-1 text-xs flex items-center gap-1.5">
              <Check className="h-3 w-3" />
              Bokad
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
