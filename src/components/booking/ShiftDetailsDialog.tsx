
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users, Info, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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
import { useCancelBooking, useBookShift } from '@/hooks/booking';
import { Separator } from '@/components/ui/separator';
import { useDeleteShift } from '@/hooks/useShifts';
import { toast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";

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
    // Get the confirmed bookings count
    const confirmedBookings = shift.bookings?.filter(booking => booking.status === 'confirmed') || [];
    
    if (confirmedBookings.length > 0) {
      // If there are bookings, show a warning toast before deleting
      if (window.confirm(
        `Detta säljpass har ${confirmedBookings.length} bokningar som också kommer att tas bort. Vill du fortsätta?`
      )) {
        deleteShift(shift.id);
        onOpenChange(false);
      }
    } else {
      // If no bookings, just delete the shift
      deleteShift(shift.id);
      onOpenChange(false);
    }
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
        className="sm:max-w-md bg-gradient-to-br from-[#1e253a]/95 to-[#252a3d]/98 border-[#33333A]/80 shadow-xl rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Top highlight line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5"></div>
        
        <DialogHeader className="pb-2">
          <DialogTitle className="capitalize text-lg flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            {formattedDate}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary/70" />
            {startTime} - {endTime}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 space-y-5">
          {/* Meta information badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/30 flex items-center gap-1.5 px-2.5 py-1">
              <Users className="h-3.5 w-3.5" />
              <span>
                {confirmedBookings.length} av {shift.available_slots} bokade
              </span>
            </Badge>
            
            <Badge variant="outline" className="bg-primary/5 border-[#33333A]/50 flex items-center gap-1.5 px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {startTime} - {endTime}
              </span>
            </Badge>
          </div>
          
          {/* Description section */}
          {shift.description && (
            <div className="bg-black/20 p-4 rounded-lg border border-[#33333A]/50">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary/70" />
                Beskrivning
              </h3>
              <p className="text-sm text-muted-foreground">{shift.description}</p>
            </div>
          )}
          
          <Separator className="my-5 bg-[#33333A]/40" />
          
          {/* Booked sellers section */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary/70" />
              Bokade säljare
            </h3>
            {confirmedBookings.length > 0 ? (
              <ul className="space-y-2">
                {confirmedBookings.map((booking) => (
                  <li key={booking.id} className="flex justify-between text-sm items-center bg-black/20 p-3.5 rounded-lg border border-[#33333A]/40">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {(booking.user_display_name || 'U')[0].toUpperCase()}
                      </div>
                      <span>{booking.user_display_name || 'Okänd säljare'}</span>
                    </div>
                    
                    {isUserAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={isCancelling}
                        className="h-8 text-xs bg-black/20 border-[#33333A]/80 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-all"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        {isCancelling ? "Avbokar..." : "Avboka"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center bg-black/20 rounded-lg border border-[#33333A]/40">
                <div className="h-12 w-12 rounded-full bg-black/30 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Inga bokningar gjorda ännu
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          {!isUserAdmin && !shift.is_booked_by_current_user && (shift.available_slots - confirmedBookings.length) > 0 && (
            <Button 
              onClick={handleBookShift} 
              disabled={isBooking}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
            >
              {isBooking ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin"></div>
                  Bokar...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Boka pass
                </>
              )}
            </Button>
          )}
          
          {isUserAdmin && (
            <Button 
              variant="outline" 
              onClick={handleDeleteShift}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-black/20 border-[#33333A]/80 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-all"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 border-2 border-current/30 border-t-current/90 rounded-full animate-spin mr-1.5"></div>
                  Tar bort...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Ta bort pass
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
