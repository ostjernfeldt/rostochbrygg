

import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users, X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShiftWithBookings } from '@/types/booking';
import { useCancelBooking, useBookShift } from '@/hooks/useShiftBookings';
import { Separator } from '@/components/ui/separator';
import { useDeleteShift } from '@/hooks/useShifts';

interface ShiftDetailsDialogProps {
  shift: ShiftWithBookings;
  isUserAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShiftDetailsDialog({ 
  shift, 
  isUserAdmin, 
  open, 
  onOpenChange 
}: ShiftDetailsDialogProps) {
  const { mutate: bookShift, isPending: isBooking } = useBookShift();
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutate: deleteShift, isPending: isDeleting } = useDeleteShift();
  
  const handleBookShift = () => {
    bookShift(shift.id);
    onOpenChange(false);
  };
  
  const handleDeleteShift = () => {
    deleteShift(shift.id);
    onOpenChange(false);
  };
  
  const formattedDate = format(new Date(shift.date), 'EEEE d MMMM', { locale: sv });
  const startTime = shift.start_time.substring(0, 5);
  const endTime = shift.end_time.substring(0, 5);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1A1F2C]/95 to-[#222632]/98 backdrop-blur-sm border-[#404049] shadow-xl">
        <DialogHeader>
          <DialogTitle className="capitalize text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {formattedDate}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary/80" />
            {startTime} - {endTime}
          </DialogDescription>
        </DialogHeader>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-4 top-4 rounded-full h-8 w-8 hover:bg-card/50"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="py-2 space-y-4">
          {shift.description && (
            <div className="bg-gradient-to-br from-[#1A1F2C]/50 to-[#222632]/60 p-3.5 rounded-lg border border-[#33333A]/30">
              <h3 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary/80" />
                Beskrivning
              </h3>
              <p className="text-sm text-muted-foreground">{shift.description}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 bg-gradient-to-br from-[#1A1F2C]/50 to-[#222632]/60 p-3.5 rounded-lg border border-[#33333A]/30">
            <Users className="h-5 w-5 text-primary/80" />
            <span className="text-sm">
              {shift.bookings.length} av {shift.available_slots} platser bokade
              ({shift.available_slots_remaining} lediga)
            </span>
          </div>
          
          <Separator className="my-4 bg-[#33333A]/50" />
          
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary/80" />
              Bokade säljare
            </h3>
            {shift.bookings.length > 0 ? (
              <ul className="space-y-2">
                {shift.bookings.map((booking) => (
                  <li key={booking.id} className="flex justify-between text-sm items-center bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 p-3 rounded-lg border border-[#33333A]/30">
                    <span>{booking.user_display_name || 'Okänd säljare'}</span>
                    
                    {isUserAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelBooking(booking.id)}
                        disabled={isCancelling}
                        className="h-7 text-xs"
                      >
                        {isCancelling ? "Avbokar..." : "Avboka"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground bg-gradient-to-br from-[#1A1F2C]/80 to-[#222632]/90 p-3 rounded-lg border border-[#33333A]/30">
                Inga bokningar ännu
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          {!isUserAdmin && !shift.is_booked_by_current_user && shift.available_slots_remaining > 0 && (
            <Button 
              onClick={handleBookShift} 
              disabled={isBooking}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
            >
              {isBooking ? "Bokar..." : "Boka pass"}
            </Button>
          )}
          
          {isUserAdmin && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteShift}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? "Tar bort..." : "Ta bort pass"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

