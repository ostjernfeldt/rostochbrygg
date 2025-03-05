
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg capitalize">{formattedDate}</CardTitle>
          <Badge variant={shift.available_slots_remaining > 0 ? "outline" : "destructive"}>
            {shift.available_slots_remaining} / {shift.available_slots} platser
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tid:</span>
            <span>{startTime} - {endTime}</span>
          </div>
          {shift.description && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Info:</span>
              <span>{shift.description}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bokningar:</span>
            <span>{shift.bookings.length} säljare</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => onViewDetails(shift.id)}
        >
          Visa detaljer
        </Button>
        
        {!isUserAdmin && !shift.is_booked_by_current_user && shift.available_slots_remaining > 0 && (
          <Button 
            onClick={handleBookShift} 
            disabled={isPending}
          >
            {isPending ? "Bokar..." : "Boka pass"}
          </Button>
        )}
        
        {!isUserAdmin && shift.is_booked_by_current_user && (
          <Badge variant="secondary">Bokad</Badge>
        )}
      </CardFooter>
    </Card>
  );
}
