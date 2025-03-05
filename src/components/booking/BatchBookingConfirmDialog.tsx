
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle, AlertTriangle } from "lucide-react";
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
}

export function BatchBookingConfirmDialog({ 
  shifts, 
  isOpen, 
  onOpenChange,
  onConfirm,
  isPending
}: BatchBookingConfirmDialogProps) {
  if (shifts.length === 0) return null;

  const notEnoughShifts = shifts.length < 2;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
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
              const formattedDate = format(new Date(shift.date), 'EEEE d MMMM', { locale: sv });
              const startTime = shift.start_time.substring(0, 5);
              const endTime = shift.end_time.substring(0, 5);
              
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
        
        {notEnoughShifts && (
          <div className="mt-4 p-3 bg-amber-950/20 border border-amber-600/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-200">Du behöver välja minst 2 pass för att kunna boka</p>
          </div>
        )}
        
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel 
            className="bg-[#151A25] border-[#33333A] text-white hover:bg-[#1A1F2C] hover:text-white"
          >
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={`${notEnoughShifts ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'} text-white`}
            disabled={isPending || notEnoughShifts}
          >
            {isPending ? "Bokar..." : "Bekräfta bokningar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
