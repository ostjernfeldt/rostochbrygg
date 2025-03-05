
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useState } from 'react';
import { Calendar, Clock, Users, Plus, X } from "lucide-react";
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
import { useDeleteShift, useAddUserToShift } from '@/hooks/shifts';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

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
  const { mutate: addUserToShift, isPending: isAddingUser } = useAddUserToShift();
  
  const [newUserName, setNewUserName] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  
  const handleBookShift = () => {
    bookShift(shift.id);
    onOpenChange(false);
  };
  
  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(bookingId, {
      onSuccess: () => {
        toast({
          title: "Bokning avbokad",
          description: "Säljaren har avbokats från passet",
        });
        // Keep the dialog open so admin can see the updated list
      },
      onError: (error) => {
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
  
  const handleAddUser = () => {
    if (!newUserName.trim()) {
      toast({
        variant: "destructive",
        title: "Inget namn angivet",
        description: "Du måste ange ett namn på säljaren"
      });
      return;
    }
    
    addUserToShift({
      shiftId: shift.id,
      userDisplayName: newUserName.trim()
    });
    
    setNewUserName('');
    setShowAddUserForm(false);
  };
  
  const formattedDate = format(new Date(shift.date), 'EEEE d MMMM', { locale: sv });
  const startTime = shift.start_time.substring(0, 5);
  const endTime = shift.end_time.substring(0, 5);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-[#1A1F2C] border-[#33333A] shadow-xl"
        onInteractOutside={(e) => e.preventDefault()}
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
              {shift.bookings.length} av {shift.available_slots} platser bokade
              ({shift.available_slots_remaining} lediga)
            </span>
          </div>
          
          <Separator className="my-4 bg-[#33333A]/50" />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary/80" />
                Bokade säljare
              </h3>
              
              {isUserAdmin && shift.available_slots_remaining > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowAddUserForm(!showAddUserForm)}
                >
                  {showAddUserForm ? (
                    <X className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 mr-1" />
                  )}
                  {showAddUserForm ? "Avbryt" : "Lägg till säljare"}
                </Button>
              )}
            </div>
            
            {isUserAdmin && showAddUserForm && (
              <div className="flex gap-2 mb-3 bg-[#151A25] p-3 rounded-lg border border-[#33333A]/30">
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Namn på säljare"
                  className="h-8 text-sm flex-1"
                />
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleAddUser}
                  disabled={isAddingUser || !newUserName.trim()}
                  className="h-8 text-xs whitespace-nowrap"
                >
                  {isAddingUser ? "Lägger till..." : "Lägg till"}
                </Button>
              </div>
            )}
            
            {shift.bookings.length > 0 ? (
              <ul className="space-y-2">
                {shift.bookings.map((booking) => (
                  <li key={booking.id} className="flex justify-between text-sm items-center bg-[#151A25] p-3 rounded-lg border border-[#33333A]/30">
                    <span>{booking.user_display_name}</span>
                    
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
