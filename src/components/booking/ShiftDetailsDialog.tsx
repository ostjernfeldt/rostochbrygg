
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
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
  
  const getUserBooking = () => {
    return shift.bookings.find(b => b.is_booked_by_current_user);
  };
  
  const formattedDate = format(new Date(shift.date), 'EEEE d MMMM', { locale: sv });
  const startTime = shift.start_time.substring(0, 5);
  const endTime = shift.end_time.substring(0, 5);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{formattedDate}</DialogTitle>
          <DialogDescription>
            {startTime} - {endTime}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {shift.description && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-1">Beskrivning</h3>
              <p className="text-sm text-muted-foreground">{shift.description}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">Platsinfo</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Totalt antal platser:</span>
              <span>{shift.available_slots}</span>
              <span className="text-muted-foreground">Bokade platser:</span>
              <span>{shift.bookings.length}</span>
              <span className="text-muted-foreground">Lediga platser:</span>
              <span>{shift.available_slots_remaining}</span>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Bokade säljare</h3>
            {shift.bookings.length > 0 ? (
              <ul className="space-y-1">
                {shift.bookings.map((booking) => (
                  <li key={booking.id} className="flex justify-between text-sm items-center">
                    <span>{booking.user_display_name || 'Okänd säljare'}</span>
                    
                    {isUserAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelBooking(booking.id)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? "Avbokar..." : "Avboka"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Inga bokningar ännu</p>
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
