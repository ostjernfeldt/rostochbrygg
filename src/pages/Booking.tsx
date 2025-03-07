
import React, { useState, Suspense, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ShiftWithBookings } from '@/types/booking';
import { ShiftDetailsDialog } from '@/components/booking/ShiftDetailsDialog';
import { BatchBookingConfirmDialog } from '@/components/booking/BatchBookingConfirmDialog';
import { PageLayout } from '@/components/PageLayout';
import { useShifts, useShiftDetails } from '@/hooks/useShifts';
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
  const {
    isAdmin,
    user,
    isLoading: authLoading,
    authError,
    isAuthenticated
  } = useBookingAuth();
  
  if (authLoading) {
    return (
      <PageLayout>
        <LoadingFallback message="Verifying user data..." />
      </PageLayout>
    );
  }

  if (authError || !isAuthenticated) {
    return (
      <PageLayout>
        <AuthError errorMessage={authError || "You need to be logged in to access this page"} />
      </PageLayout>
    );
  }
  
  // Always use the current week for initial load
  const today = new Date();
  const initialWeekStart = startOfWeek(today, {
    weekStartsOn: 1
  });
  
  return (
    <PageLayout>
      <BookingContent 
        isAdmin={isAdmin ?? false} 
        user={user}
        initialWeekStart={initialWeekStart}
      />
    </PageLayout>
  );
}

function BookingContent({ 
  isAdmin, 
  user,
  initialWeekStart
}: { 
  isAdmin: boolean;
  user: any;
  initialWeekStart: Date;
}) {
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(initialWeekStart);
  
  // Calculate week end based on current week start
  const weekEnd = endOfWeek(currentWeekStart, {
    weekStartsOn: 1
  });
  
  const {
    shifts = [],
    isLoading: shiftsLoading,
    error: shiftsError
  } = useShifts(currentWeekStart, weekEnd, isAdmin);
  
  // Use null coalescing to ensure shifts is always an array
  const safeShifts = Array.isArray(shifts) ? shifts : [];
  
  const {
    shift: selectedShift,
    isLoading: shiftDetailsLoading
  } = useShiftDetails(selectedShiftId || '');
  
  // Ensure shifts is always an array and process each shift safely
  const processedShifts: ShiftWithBookings[] = safeShifts.map(shift => {
    if (!shift) return null as unknown as ShiftWithBookings;
    
    return {
      ...shift,
      // Ensure bookings is always an array
      bookings: Array.isArray(shift.bookings) ? shift.bookings : [],
      // Ensure available_slots_remaining has a value
      available_slots_remaining: shift.available_slots_remaining !== undefined 
        ? shift.available_slots_remaining 
        : shift.available_slots,
      // Ensure is_booked_by_current_user has a value
      is_booked_by_current_user: shift.is_booked_by_current_user || false
    };
  }).filter(Boolean); // Filter out any null values

  // Create safe arrays with null checks
  const userBookedShifts = processedShifts.filter(shift => shift.is_booked_by_current_user);
  const availableShifts = processedShifts.filter(shift => !shift.is_booked_by_current_user);

  const {
    selectedShifts,
    confirmDialogOpen,
    setConfirmDialogOpen,
    isBatchBooking,
    handleSelectShift,
    handleOpenBookingDialog,
    handleConfirmBookings,
    hasMinimumBookings
  } = useShiftSelection(userBookedShifts);

  const handleViewShiftDetails = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setDialogOpen(true);
  };
  
  const handleWeekChange = (newWeekStart: Date) => {
    setCurrentWeekStart(newWeekStart);
  };
  
  // Create a safe array for selected shifts data
  const safeSelectedShifts = Array.isArray(selectedShifts) ? selectedShifts : [];
  const selectedShiftsData = processedShifts.filter(shift => 
    shift && safeSelectedShifts.includes(shift.id)
  );

  if (shiftsError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-6">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-xl font-semibold mb-2">Could not load bookings</h2>
        <p className="text-muted-foreground mb-4">
          {shiftsError instanceof Error ? shiftsError.message : 'An error occurred while loading bookings'}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try again
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
          currentWeekStart={currentWeekStart}
          weekEnd={weekEnd}
          onWeekChange={handleWeekChange}
        />
      ) : (
        <UserBookingView
          availableShifts={availableShifts}
          userBookedShifts={userBookedShifts}
          selectedShifts={safeSelectedShifts}
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
