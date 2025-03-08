import { supabase } from '@/integrations/supabase/client';
import { ShiftBooking } from '@/types/booking';
import { SellerBooking, BatchBookingResult } from '@/hooks/booking/useBatchBookShifts';
import { toast } from '@/hooks/use-toast';

/**
 * Checks if there are enough available slots for the bookings
 */
export async function checkAvailableSlots(shiftId: string, bookingsCount: number): Promise<void> {
  // Check if there are enough available slots
  const { data: shiftData, error: shiftError } = await supabase
    .from('shifts')
    .select('available_slots, id')
    .eq('id', shiftId)
    .single();

  if (shiftError) {
    throw new Error(`Kunde inte hämta information om passet: ${shiftError.message}`);
  }

  // Get all current bookings for this shift
  const { data: existingBookings, error: existingError } = await supabase
    .from('shift_bookings')
    .select('*')
    .eq('shift_id', shiftId)
    .eq('status', 'confirmed');

  if (existingError) {
    throw new Error(`Kunde inte kontrollera befintliga bokningar: ${existingError.message}`);
  }

  const existingCount = existingBookings?.length || 0;
  const availableSlots = shiftData?.available_slots || 0;
  
  if (existingCount + bookingsCount > availableSlots) {
    throw new Error(`För många säljare valda. Det finns endast plats för ${availableSlots - existingCount} fler.`);
  }
}

/**
 * Check for existing bookings for a seller on a shift
 */
export async function checkExistingSellerBookings(shiftId: string, userDisplayName: string): Promise<ShiftBooking[] | null> {
  const { data: existingSellerBookings, error } = await supabase
    .from('shift_bookings')
    .select('*')
    .eq('shift_id', shiftId)
    .eq('user_display_name', userDisplayName);
    
  if (error) {
    console.error("Error checking existing bookings:", error);
    return null;
  }
    
  if (existingSellerBookings) {
    return existingSellerBookings.map(booking => ({
      ...booking,
      status: booking.status === 'cancelled' ? 'cancelled' : 'confirmed'
    } as ShiftBooking));
  }
    
  return [];
}

/**
 * Update a cancelled booking to confirmed status
 */
export async function reactivateCancelledBooking(bookingId: string): Promise<ShiftBooking | null> {
  console.log('Found cancelled booking, updating to confirmed:', bookingId);
  
  const { data, error } = await supabase
    .from('shift_bookings')
    .update({ 
      status: 'confirmed' as const,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .select()
    .single();
    
  if (error) {
    console.error('Error reactivating cancelled booking:', error);
    return null;
  }
  
  return data ? {
    ...data,
    status: data.status === 'cancelled' ? 'cancelled' : 'confirmed'
  } as ShiftBooking : null;
}

/**
 * Try to find a user ID from staff_roles table using email
 */
export async function findUserIdByEmail(email: string | undefined): Promise<string | null> {
  if (!email) return null;
  
  const { data: userData, error: userError } = await supabase
    .from('staff_roles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
    
  if (!userError && userData?.id) {
    return userData.id;
  }
  
  return null;
}

/**
 * Create a new booking
 */
export async function createNewBooking(
  shiftId: string, 
  userDisplayName: string, 
  userEmail: string | undefined, 
  userId: string
): Promise<ShiftBooking | null> {
  try {
    const { data, error } = await supabase
      .from('shift_bookings')
      .insert([{
        shift_id: shiftId,
        user_display_name: userDisplayName,
        user_email: userEmail,
        user_id: userId,
        status: 'confirmed' as const
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return null;
    }

    return data ? {
      ...data,
      status: data.status === 'cancelled' ? 'cancelled' : 'confirmed'
    } as ShiftBooking : null;
  } catch (insertError) {
    console.error('Exception during booking creation:', insertError);
    return null;
  }
}

/**
 * Retry creating a booking with admin ID as fallback
 */
export async function retryBookingWithAdminId(
  shiftId: string,
  userDisplayName: string,
  userEmail: string | undefined,
  adminId: string
): Promise<ShiftBooking | null> {
  console.log('Constraint error, retrying with admin ID');
  
  try {
    const { data: retryResult, error: retryError } = await supabase
      .from('shift_bookings')
      .insert([{
        shift_id: shiftId,
        user_display_name: userDisplayName,
        user_email: userEmail,
        user_id: adminId,
        status: 'confirmed' as const
      }])
      .select()
      .single();
      
    if (retryError) {
      console.error('Error on retry booking:', retryError);
      return null;
    }
    
    return retryResult ? {
      ...retryResult,
      status: retryResult.status === 'cancelled' ? 'cancelled' : 'confirmed'
    } as ShiftBooking : null;
  } catch (retryException) {
    console.error('Exception during retry booking:', retryException);
    return null;
  }
}

/**
 * Process a batch of bookings and return results
 */
export async function processBatchBookings(bookings: SellerBooking[]): Promise<BatchBookingResult> {
  if (!bookings.length) {
    return { results: [], errors: [] };
  }

  // Get current user for audit purposes
  const { data: { user } } = await supabase.auth.getUser();
  const adminId = user?.id || '00000000-0000-0000-0000-000000000000';

  // Check if there are enough slots available first
  await checkAvailableSlots(bookings[0].shiftId, bookings.length);

  const results: ShiftBooking[] = [];
  const errors: string[] = [];

  // Process each booking
  for (const booking of bookings) {
    try {
      // Check for existing bookings for this seller
      const existingSellerBookings = await checkExistingSellerBookings(booking.shiftId, booking.userDisplayName);
      
      // If there's an existing CONFIRMED booking for this seller, skip
      if (existingSellerBookings && existingSellerBookings.some(b => b.status === 'confirmed')) {
        errors.push(`${booking.userDisplayName} har redan bokat detta pass`);
        continue;
      }
      
      // If there's a cancelled booking, update it to confirmed
      const cancelledBooking = existingSellerBookings?.find(b => b.status === 'cancelled');
      if (cancelledBooking) {
        const reactivatedBooking = await reactivateCancelledBooking(cancelledBooking.id);
        
        if (reactivatedBooking) {
          results.push(reactivatedBooking);
        } else {
          errors.push(`Fel vid återaktivering av bokning för ${booking.userDisplayName}`);
        }
        continue;
      }
      
      // Try to find the user ID from staff_roles table using email
      let userId = await findUserIdByEmail(booking.userEmail);
      
      // Use adminId as fallback
      if (!userId) {
        userId = adminId;
      }
      
      // Create new booking
      const newBooking = await createNewBooking(
        booking.shiftId, 
        booking.userDisplayName, 
        booking.userEmail, 
        userId
      );
      
      if (newBooking) {
        results.push(newBooking);
      } else {
        // Retry with admin ID as a fallback if first attempt failed
        const retryBooking = await retryBookingWithAdminId(
          booking.shiftId,
          booking.userDisplayName,
          booking.userEmail,
          adminId
        );
        
        if (retryBooking) {
          results.push(retryBooking);
        } else {
          errors.push(`Fel vid bokning för ${booking.userDisplayName}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
      errors.push(`Fel för ${booking.userDisplayName}: ${message}`);
    }
  }

  // If there were any errors, show them in a toast
  if (errors.length > 0) {
    console.error('Booking errors:', errors);
    const errorMessage = errors.join('\n');
    toast({
      variant: 'destructive',
      title: `${errors.length} fel vid bokning av säljare`,
      description: errorMessage,
    });
  }

  // Return both results and errors
  return { results, errors };
}
