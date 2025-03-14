
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ShiftWithBookings } from '@/types/booking';
import { ScrollArea } from "@/components/ui/scroll-area";

interface BatchBookingConfirmDialogProps {
  shifts: ShiftWithBookings[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  existingBookingsCount?: number;
}

export function BatchBookingConfirmDialog({ 
  shifts, 
  isOpen, 
  onOpenChange,
  onConfirm,
  isPending,
  existingBookingsCount = 0
}: BatchBookingConfirmDialogProps) {
  // Don't render at all if there are no shifts to show
  if (!shifts || shifts.length === 0) return null;

  const totalShifts = shifts.length + existingBookingsCount;
  const notEnoughShifts = totalShifts < 2;

  const handleOpenChange = (open: boolean) => {
    // Prevent closing dialog while booking is in progress
    if (isPending && !open) {
      return;
    }
    onOpenChange(open);
  };

  // Safely format shift data to avoid runtime errors
  const formatShiftData = (shift: ShiftWithBookings) => {
    try {
      const formattedDate = format(new Date(shift.date), 'EEEE d MMMM', { locale: sv });
      const startTime = shift.start_time?.substring(0, 5) || '';
      const endTime = shift.end_time?.substring(0, 5) || '';
      
      return { formattedDate, startTime, endTime };
    } catch (error) {
      console.error('Error formatting shift data:', error, shift);
      return { 
        formattedDate: 'Invalid date', 
        startTime: '', 
        endTime: '' 
      };
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-[#1A1F2C] border-[#33333A] shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Bekräfta bokningar
          </AlertDialogTitle>
          <AlertDialogDescription>
            Du är på väg att boka följande säljpass:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="max-h-60 mt-2">
          <div className="space-y-2 pr-4">
            {shifts.map((shift) => {
              const { formattedDate, startTime, endTime } = formatShiftData(shift);
              
              return (
                <div 
                  key={shift.id} 
                  className="bg-[#151A25] p-3 rounded-lg border border-[#33333A]/30 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium capitalize">{formattedDate}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                      <span>{startTime} - {endTime}</span>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {existingBookingsCount > 0 && (
          <div className="mt-4 p-3.5 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-lg shadow-inner flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary flex-shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-foreground">Du har redan {existingBookingsCount} pass bokat</p>
              <p className="text-xs text-primary-foreground/70">Totalt antal pass efter bokning: {totalShifts}</p>
            </div>
          </div>
        )}
        
        {notEnoughShifts && (
          <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-950/30 to-amber-900/20 border border-amber-700/30 rounded-lg shadow-inner flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/30 text-amber-400 flex-shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-300">Minst 2 pass krävs totalt</p>
              <p className="text-xs text-amber-300/70">Du behöver välja fler pass för att nå minimikravet på 2 pass</p>
            </div>
          </div>
        )}
        
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel 
            className="bg-[#151A25] border-[#33333A] text-white hover:bg-[#1A1F2C] hover:text-white"
            disabled={isPending}
          >
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={`${notEnoughShifts ? 
              'bg-gray-600/50 text-gray-300 cursor-not-allowed hover:bg-gray-600/50 border border-gray-600/30' : 
              'bg-primary hover:bg-primary/90 text-white'} transition-all duration-200`}
            disabled={isPending || notEnoughShifts}
          >
            {isPending ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bokar...
              </span>
            ) : "Bekräfta bokningar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
