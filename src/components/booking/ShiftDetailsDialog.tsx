
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users, Info, Trash2, CheckCircle, XCircle, AlertTriangle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShiftWithBookings } from '@/types/booking';
import { useCancelBooking, useBookShift, useBatchBookShifts } from '@/hooks/booking';
import { Separator } from '@/components/ui/separator';
import { useDeleteShift } from '@/hooks/useShifts';
import { toast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { SellerSelect } from './SellerSelect';
import { SelectedSellersList } from './SelectedSellersList';

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
  const [showSellerSelect, setShowSellerSelect] = useState(false);
  const [selectedSellers, setSelectedSellers] = useState<{ user_display_name: string; email: string | null; role: string }[]>([]);
  
  const {
    mutate: bookShift,
    isPending: isBooking
  } = useBookShift();
  const {
    mutate: cancelBooking,
    isPending: isCancelling
  } = useCancelBooking();
  const {
    mutate: deleteShift,
    isPending: isDeleting
  } = useDeleteShift();
  const {
    mutate: batchBookShifts,
    isPending: isBatchBooking
  } = useBatchBookShifts();

  if (!shift) {
    return null;
  }

  const handleBookShift = () => {
    bookShift(shift.id, {
      onSuccess: () => {
        console.log("Booking successfully completed");
        toast({
          title: "Pass bokat",
          description: "Du har bokat passet framgångsrikt"
        });
        onOpenChange(false);
      },
      onError: error => {
        console.error("Error booking shift:", error);
        toast({
          variant: "destructive",
          title: "Fel vid bokning",
          description: error instanceof Error ? error.message : "Ett fel uppstod vid bokningen av passet"
        });
      }
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    console.log("Cancelling booking:", bookingId);
    cancelBooking(bookingId, {
      onSuccess: () => {
        console.log("Booking successfully cancelled");
        toast({
          title: "Bokning avbokad",
          description: "Säljaren har avbokats från passet"
        });
        onOpenChange(false);
      },
      onError: error => {
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
    const confirmedBookings = shift.bookings?.filter(booking => booking.status === 'confirmed') || [];
    if (confirmedBookings.length > 0) {
      if (window.confirm(`Detta säljpass har ${confirmedBookings.length} bokningar som också kommer att tas bort. Vill du fortsätta?`)) {
        deleteShift(shift.id);
        onOpenChange(false);
      }
    } else {
      deleteShift(shift.id);
      onOpenChange(false);
    }
  };

  const formatShiftData = () => {
    try {
      return {
        formattedDate: format(new Date(shift.date), 'EEEE d MMMM', {
          locale: sv
        }),
        startTime: shift.start_time?.substring(0, 5) || '',
        endTime: shift.end_time?.substring(0, 5) || ''
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

  const {
    formattedDate,
    startTime,
    endTime
  } = formatShiftData();

  const confirmedBookings = shift.bookings?.filter(booking => booking.status === 'confirmed') || [];

  const handleOpenChange = (open: boolean) => {
    if ((isBooking || isCancelling || isDeleting || isBatchBooking) && !open) {
      return;
    }
    if (!open) {
      // Reset state when closing dialog
      setShowSellerSelect(false);
      setSelectedSellers([]);
    }
    onOpenChange(open);
  };

  const handleSellerSelect = (seller: { user_display_name: string; email: string | null; role: string }) => {
    // Check if seller is already in the list
    if (!selectedSellers.some(s => s.user_display_name === seller.user_display_name)) {
      setSelectedSellers([...selectedSellers, seller]);
    }
  };

  const handleRemoveSeller = (index: number) => {
    const newSellers = [...selectedSellers];
    newSellers.splice(index, 1);
    setSelectedSellers(newSellers);
  };

  const handleBatchBookSellers = () => {
    if (selectedSellers.length === 0) {
      toast({
        title: "Inga säljare valda",
        description: "Du måste välja minst en säljare.",
        variant: "destructive"
      });
      return;
    }

    // Available slots check
    const availableSlots = shift.available_slots - confirmedBookings.length;
    if (selectedSellers.length > availableSlots) {
      toast({
        title: "För många säljare",
        description: `Det finns endast plats för ${availableSlots} fler säljare.`,
        variant: "destructive"
      });
      return;
    }

    // Convert selected sellers to SellerBooking format
    const sellerBookings = selectedSellers.map(seller => ({
      shiftId: shift.id,
      userDisplayName: seller.user_display_name,
      userEmail: seller.email
    }));

    batchBookShifts(sellerBookings, {
      onSuccess: (data) => {
        console.log("Batch booking success:", data);
        
        // Handle success with potential partial failures
        if (data.errors && data.errors.length > 0 && data.results && data.results.length > 0) {
          toast({
            title: "Delvis framgång",
            description: `${data.results.length} säljare bokades framgångsrikt, men ${data.errors.length} kunde inte bokas.`
          });
        } else if (!data.errors || data.errors.length === 0) {
          toast({
            title: "Säljare tillagda",
            description: `${data.results.length} säljare har lagts till i passet.`
          });
        }
        
        // Reset the selected sellers
        setSelectedSellers([]);
        setShowSellerSelect(false);
      },
      onError: (error) => {
        console.error("Batch booking error:", error);
        toast({
          variant: "destructive",
          title: "Fel vid tillägg av säljare",
          description: error instanceof Error ? error.message : "Ett fel uppstod vid tillägg av säljare"
        });
      }
    });
  };
  
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1e253a]/95 to-[#252a3d]/98 border-[#33333A]/80 shadow-xl rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5"></div>
        
        <DialogHeader className="pb-2">
          <DialogTitle className="capitalize text-lg flex items-center gap-2">
            
            {formattedDate}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary/70" />
            {startTime} - {endTime}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 space-y-5">
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
          
          {shift.description && <div className="bg-black/20 p-4 rounded-lg border border-[#33333A]/50">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary/70" />
                Beskrivning
              </h3>
              <p className="text-sm text-muted-foreground">{shift.description}</p>
            </div>}
          
          <Separator className="my-5 bg-[#33333A]/40" />
          
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary/70" />
              Bokade säljare
            </h3>
            {confirmedBookings.length > 0 ? <ul className="space-y-2">
                {confirmedBookings.map(booking => <li key={booking.id} className="flex justify-between text-sm items-center bg-black/20 p-3.5 rounded-lg border border-[#33333A]/40">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {(booking.user_display_name || 'U')[0].toUpperCase()}
                      </div>
                      <span>{booking.user_display_name || 'Okänd säljare'}</span>
                    </div>
                    
                    {isUserAdmin && <Button variant="outline" size="sm" onClick={() => handleCancelBooking(booking.id)} disabled={isCancelling} className="h-8 text-xs bg-black/20 border-[#33333A]/80 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-all">
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        {isCancelling ? "Avbokar..." : "Avboka"}
                      </Button>}
                  </li>)}
              </ul> : <div className="flex flex-col items-center justify-center py-6 text-center bg-black/20 rounded-lg border border-[#33333A]/40">
                <div className="h-12 w-12 rounded-full bg-black/30 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Inga bokningar gjorda ännu
                </p>
              </div>}
          </div>
          
          {/* Admin Seller Selection Section */}
          {isUserAdmin && (
            <>
              <Separator className="my-5 bg-[#33333A]/40" />
              
              {!showSellerSelect ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowSellerSelect(true)}
                  className="w-full bg-black/20 border-[#33333A]/80 hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till säljare
                </Button>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary/70" />
                    Lägg till säljare
                  </h3>
                  
                  <SellerSelect 
                    onSellerSelect={handleSellerSelect} 
                    disabled={isBatchBooking}
                  />
                  
                  <SelectedSellersList 
                    sellers={selectedSellers} 
                    onRemove={handleRemoveSeller} 
                  />
                  
                  {selectedSellers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button 
                        onClick={handleBatchBookSellers} 
                        disabled={isBatchBooking || selectedSellers.length === 0}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isBatchBooking ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin mr-2"></div>
                            Lägger till...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Lägg till säljare
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowSellerSelect(false);
                          setSelectedSellers([]);
                        }}
                        disabled={isBatchBooking}
                        className="bg-black/20 border-[#33333A]/80"
                      >
                        Avbryt
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          {!isUserAdmin && !shift.is_booked_by_current_user && shift.available_slots - confirmedBookings.length > 0 && <Button onClick={handleBookShift} disabled={isBooking} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5">
              {isBooking ? <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin"></div>
                  Bokar...
                </> : <>
                  <CheckCircle className="h-4 w-4" />
                  Boka pass
                </>}
            </Button>}
          
          {isUserAdmin && <Button variant="outline" onClick={handleDeleteShift} disabled={isDeleting} className="w-full sm:w-auto bg-black/20 border-[#33333A]/80 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-all">
              {isDeleting ? <>
                  <div className="h-4 w-4 border-2 border-current/30 border-t-current/90 rounded-full animate-spin mr-1.5"></div>
                  Tar bort...
                </> : <>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Ta bort pass
                </>}
            </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
