
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBatchBookShifts } from '@/hooks/booking';
import { ShiftWithBookings } from '@/types/booking';
import { toast } from '@/hooks/use-toast';

export const useShiftSelection = (userBookedShifts: ShiftWithBookings[] = []) => {
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const {
    mutate: batchBookShifts,
    isPending: isBatchBooking
  } = useBatchBookShifts();
  
  const handleSelectShift = (shiftId: string) => {
    if (!shiftId) return;
    
    setSelectedShifts(prevSelected => {
      // Ensure prevSelected is an array
      const safeArray = Array.isArray(prevSelected) ? prevSelected : [];
      
      if (safeArray.includes(shiftId)) {
        return safeArray.filter(id => id !== shiftId);
      } else {
        return [...safeArray, shiftId];
      }
    });
  };

  const hasMinimumBookings = (selectedCount: number, existingCount: number) => {
    return (selectedCount + existingCount) >= 2;
  };

  const handleOpenBookingDialog = () => {
    // Ensure we're working with arrays
    const safeUserBookedShifts = Array.isArray(userBookedShifts) ? userBookedShifts : [];
    const safeSelectedShifts = Array.isArray(selectedShifts) ? selectedShifts : [];
    
    const existingBookingsCount = safeUserBookedShifts.length;
    const totalBookedOrSelected = safeSelectedShifts.length + existingBookingsCount;
    
    if (safeSelectedShifts.length === 0) {
      toast({
        title: "Inga pass valda",
        description: "Du behöver välja minst ett pass för att kunna boka",
        variant: "destructive"
      });
      return;
    }
    
    if (totalBookedOrSelected < 2) {
      toast({
        title: "För få pass valda",
        description: "Du behöver välja fler pass, totalt behöver du ha bokat minst 2 pass per vecka",
        variant: "destructive"
      });
      return;
    }
    
    setConfirmDialogOpen(true);
  };
  
  const handleConfirmBookings = () => {
    // Ensure selectedShifts is an array
    const safeSelectedShifts = Array.isArray(selectedShifts) ? selectedShifts : [];
    
    if (safeSelectedShifts.length === 0) {
      toast({
        title: "Inga pass valda",
        description: "Det finns inga pass att boka",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Confirming batch bookings for shifts:', safeSelectedShifts);
    batchBookShifts(safeSelectedShifts, {
      onSuccess: data => {
        console.log('Batch booking success:', data);
        setConfirmDialogOpen(false);
        setSelectedShifts([]);

        queryClient.invalidateQueries({
          queryKey: ['shifts']
        });
        queryClient.invalidateQueries({
          queryKey: ['weekly-booking-summary']
        });

        if (data.errors && data.errors.length > 0 && data.results && data.results.length > 0) {
          setTimeout(() => {
            toast({
              title: "Delvis framgång",
              description: `${data.results.length} pass bokades framgångsrikt, men ${data.errors.length} pass kunde inte bokas.`
            });
          }, 300);
        } else if (!data.errors || data.errors.length === 0) {
          setTimeout(() => {
            toast({
              title: "Bokningar genomförda",
              description: "Dina pass har bokats framgångsrikt"
            });
          }, 300);
        }
      },
      onError: error => {
        console.error('Batch booking error:', error);
        toast({
          variant: "destructive",
          title: "Fel vid bokning",
          description: error instanceof Error ? error.message : "Ett fel uppstod vid bokning av passen"
        });
      }
    });
  };
  
  return {
    selectedShifts,
    setSelectedShifts,
    confirmDialogOpen,
    setConfirmDialogOpen,
    isBatchBooking,
    handleSelectShift,
    handleOpenBookingDialog,
    handleConfirmBookings,
    hasMinimumBookings
  };
};
