
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users } from "lucide-react";
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
import { toast } from '@/hooks/use-toast';

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
  
  // Safeguard against undefined shift data
  if (!shift) {
    return null;
  }
  
  const handleBookShift = () => {
    bookShift(shift.id);
    onOpenChange(false);
  };
  
  const handleCancelBooking = (bookingId: string) => {
    console.log("Cancelling booking:", bookingId);
    
    cancelBooking(bookingId, {
      onSuccess: () => {
        console.log("Booking successfully cancelled");
        toast({
          title: "Bokning avbokad",
          description: "Säljaren har avbokats från passet",
        });
        // Close the dialog to force a refresh of the data
        onOpenChange(false);
      },
      onError: (error) => {
        console.error("Error cancelling booking:", error);
        toast({
          variant: "destructive",
          title: "Fel vid avbokning",
          description: error.message || "Ett fel uppstod vid avbokning"
        });
      }
    });
  };
  
  const handleDeleteShift = () => {
    deleteShift(shift.id);
    onOpenChange(false);
  };
  
  // Safely format shift data to avoid runtime errors
  const formatShiftData = () => {
    try {
      return {
        formattedDate: format(new Date(shift.date), 'EEEE d MMMM', { locale: sv }),
        startTime: shift.start_time?.substring(0, 5) || '',
        endTime: shift.end_time?.substring(0, 5) || '',
      };
    } catch (error) {
      console.error('Error formatting shift data:', error, shift);
      return { 
        formattedDate: 'Invalid date', 
        startTime: '', 
        endTime: '' 
      };
    }
  };
  
  const { formattedDate, startTime, endTime } = formatShiftData();
  
  // Filter to only show confirmed bookings
  const confirmedBookings = shift.bookings?.filter(booking => booking.status === 'confirmed') || [];
  
  // Custom handler to prevent closing while operations are pending
  const handleOpenChange = (open: boolean) => {
    if ((isBooking || isCancelling || isDeleting) && !open) {
      return;
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-[#1A1F2C] border-[#33333A] shadow-xl"
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="capitalize text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {formattedDate}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary/80" />
            {startTime} - {endTime}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 space-y-4">
          {shift.description && (
            <div className="bg-[#151A25] p-3.5 rounded-lg border border-[#33333A]/30">
              <h3 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary/80" />
                Beskrivning
              </h3>
              <p className="text-sm text-muted-foreground">{shift.description}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 bg-[#151A25] p-3.5 rounded-lg border border-[#33333A]/30">
            <Users className="h-5 w-5 text-primary/80" />
            <span className="text-sm">
              {confirmedBookings.length} av {shift.available_slots} platser bokade
              ({shift.available_slots - confirmedBookings.length} lediga)
            </span>
          </div>
          
          <Separator className="my-4 bg-[#33333A]/50" />
          
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary/80" />
              Bokade säljare
            </h3>
            {confirmedBookings.length > 0 ? (
              <ul className="space-y-2">
                {confirmedBookings.map((booking) => (
                  <li key={booking.id} className="flex justify-between text-sm items-center bg-[#151A25] p-3 rounded-lg border border-[#33333A]/30">
                    <span>{booking.user_display_name || 'Okänd säljare'}</span>
                    
                    {isUserAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
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
              <p className="text-sm text-muted-foreground bg-[#151A25] p-3 rounded-lg border border-[#33333A]/30">
                Inga bokningar ännu
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          {!isUserAdmin && !shift.is_booked_by_current_user && (shift.available_slots - confirmedBookings.length) > 0 && (
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
