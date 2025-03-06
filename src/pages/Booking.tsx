
import React, { useState, Suspense } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ShiftWithBookings } from '@/types/booking';
import { ShiftDetailsDialog } from '@/components/booking/ShiftDetailsDialog';
import { BatchBookingConfirmDialog } from '@/components/booking/BatchBookingConfirmDialog';
import { PageLayout } from '@/components/PageLayout';
import { useShifts } from '@/hooks/useShifts';
import { useShiftDetails } from '@/hooks/useShiftDetails';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingFallback } from '@/components/common/LoadingFallback';
import { AuthError } from '@/components/common/AuthError';
import { AdminBookingView } from '@/components/booking/AdminBookingView';
import { UserBookingView } from '@/components/booking/UserBookingView';
import { useBookingAuth } from '@/hooks/booking/useBookingAuth';
import { useShiftSelection } from '@/hooks/booking/useShiftSelection';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Booking() {
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const {
    isAdmin,
    user,
    isLoading: authLoading,
    authError,
    isAuthenticated
  } = useBookingAuth();
  
  // Don't proceed with data fetching if user is not authenticated
  if (authLoading) {
    return (
      <PageLayout>
        <LoadingFallback message="Verifierar användardata..." />
      </PageLayout>
    );
  }

  if (authError || !isAuthenticated) {
    return (
      <PageLayout>
        <AuthError errorMessage={authError} />
      </PageLayout>
    );
  }
  
  // Only initialize date variables if we're authenticated
  const today = new Date();
  const currentWeekStart = startOfWeek(today, {
    weekStartsOn: 1
  });
  const weekEnd = endOfWeek(currentWeekStart, {
    weekStartsOn: 1
  });
  
  // Use a render function to create the main content to ensure
  // we don't try to use hooks conditionally
  return (
    <PageLayout>
      <BookingContent 
        isAdmin={isAdmin} 
        user={user}
        currentWeekStart={currentWeekStart}
        weekEnd={weekEnd}
      />
    </PageLayout>
  );
}

// Separate component to ensure hooks aren't called conditionally
function BookingContent({ 
  isAdmin, 
  user,
  currentWeekStart,
  weekEnd
}: { 
  isAdmin: boolean;
  user: any;
  currentWeekStart: Date;
  weekEnd: Date;
}) {
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const {
    shifts = [],
    isLoading: shiftsLoading,
    error: shiftsError
  } = useShifts(currentWeekStart, weekEnd, isAdmin);
  
  const {
    shift: selectedShift,
    isLoading: shiftDetailsLoading
  } = useShiftDetails(selectedShiftId || '');
  
  // Process shifts data with null checks
  const processedShifts: ShiftWithBookings[] = Array.isArray(shifts) ? shifts.map(shift => {
    return {
      ...shift,
      bookings: Array.isArray(shift.bookings) ? shift.bookings : [],
      available_slots_remaining: shift.available_slots_remaining !== undefined ? shift.available_slots_remaining : shift.available_slots,
      is_booked_by_current_user: shift.is_booked_by_current_user || false
    };
  }) : [];

  // Extract booked and available shifts with null checks
  const userBookedShifts = Array.isArray(processedShifts) 
    ? processedShifts.filter(shift => shift.is_booked_by_current_user)
    : [];
    
  const availableShifts = Array.isArray(processedShifts) 
    ? processedShifts.filter(shift => !shift.is_booked_by_current_user)
    : [];

  const {
    selectedShifts,
    confirmDialogOpen,
    setConfirmDialogOpen,
    isBatchBooking,
    handleSelectShift,
    handleOpenBookingDialog,
    handleConfirmBookings
  } = useShiftSelection(userBookedShifts);

  const handleViewShiftDetails = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setDialogOpen(true);
  };
  
  // Selected shifts data for confirmation dialog with null checks
  const selectedShiftsData = Array.isArray(processedShifts) && Array.isArray(selectedShifts) 
    ? processedShifts.filter(shift => selectedShifts.includes(shift.id))
    : [];

  if (shiftsError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-6">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-xl font-semibold mb-2">Kunde inte ladda bokningar</h2>
        <p className="text-muted-foreground mb-4">
          {shiftsError instanceof Error ? shiftsError.message : 'Ett fel uppstod vid laddning av bokningar'}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Försök igen
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {isAdmin ? (
        <AdminBookingView 
          shifts={processedShifts}
          isLoading={shiftsLoading}
          onViewShiftDetails={handleViewShiftDetails}
        />
      ) : (
        <UserBookingView
          availableShifts={availableShifts}
          userBookedShifts={userBookedShifts}
          selectedShifts={selectedShifts}
          onSelectShift={handleSelectShift}
          onViewShiftDetails={handleViewShiftDetails}
          onOpenBookingDialog={handleOpenBookingDialog}
          isLoading={shiftsLoading}
        />
      )}
      
      {selectedShift && (
        <ShiftDetailsDialog 
          shift={selectedShift} 
          isUserAdmin={isAdmin} 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
        />
      )}
      
      {Array.isArray(selectedShiftsData) && selectedShiftsData.length > 0 && (
        <BatchBookingConfirmDialog 
          shifts={selectedShiftsData} 
          isOpen={confirmDialogOpen} 
          onOpenChange={setConfirmDialogOpen} 
          onConfirm={handleConfirmBookings} 
          isPending={isBatchBooking}
          existingBookingsCount={userBookedShifts?.length || 0}
        />
      )}
    </ErrorBoundary>
  );
}
