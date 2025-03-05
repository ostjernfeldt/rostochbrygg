
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users, X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
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
      <DialogContent className="sm:max-w-md bg-card border-[#33333A]">
        <DialogHeader className="flex-row justify-between items-start">
          <div>
            <DialogTitle className="capitalize flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </DialogTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Clock className="h-4 w-4" />
              {startTime} - {endTime}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-6 w-6"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="py-4">
          {shift.description && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-1">Beskrivning</h3>
              <p className="text-sm text-muted-foreground">{shift.description}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {shift.bookings.length} av {shift.available_slots} platser bokade
              ({shift.available_slots_remaining} lediga)
            </span>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Bokade säljare</h3>
            {shift.bookings.length > 0 ? (
              <ul className="space-y-2">
                {shift.bookings.map((booking) => (
                  <li key={booking.id} className="flex justify-between text-sm items-center bg-background/20 p-2 rounded-md">
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
              <p className="text-sm text-muted-foreground bg-background/20 p-2 rounded-md">
                Inga bokningar ännu
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          {!isUserAdmin && !shift.is_booked_by_current_user && shift.available_slots_remaining > 0 && (
            <Button 
              onClick={handleBookShift} 
              disabled={isBooking}
            >
              {isBooking ? "Bokar..." : "Boka pass"}
            </Button>
          )}
          
          {isUserAdmin && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteShift}
              disabled={isDeleting}
            >
              {isDeleting ? "Tar bort..." : "Ta bort pass"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
