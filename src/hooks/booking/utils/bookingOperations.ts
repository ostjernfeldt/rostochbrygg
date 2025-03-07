
import { supabase } from '@/integrations/supabase/client';
import { ShiftBooking } from '@/types/booking';

/**
 * Fetches a user's existing booking for a shift
 */
export async function fetchExistingBooking(shiftId: string, userId: string, status: 'confirmed' | 'cancelled') {
  console.log(`Checking for ${status} booking for shift: ${shiftId}, user: ${userId}`);
  
  const { data, error } = await supabase
    .from('shift_bookings')
    .select('*')
    .eq('shift_id', shiftId)
    .eq('user_id', userId)
    .eq('status', status);
    
  if (error) {
    console.error(`Error checking ${status} bookings:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Gets user staff role data (display name)
 */
export async function fetchUserStaffRole(userEmail: string) {
  const { data, error } = await supabase
    .from('staff_roles')
    .select('user_display_name')
    .eq('email', userEmail)
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching staff role:', error);
    throw new Error('Du måste vara registrerad som säljare för att boka pass');
  }
  
  if (!data) {
    throw new Error('Du måste vara registrerad som säljare för att boka pass');
  }
  
  return data;
}

/**
 * Updates an existing cancelled booking to confirmed status
 */
export async function updateCancelledBooking(
  bookingId: string, 
  displayName: string, 
  originalBooking: ShiftBooking
) {
  console.log('Updating cancelled booking to confirmed:', bookingId);
  
  // Update with returning data in the same query
  const { data, error } = await supabase
    .from('shift_bookings')
    .update({ 
      status: 'confirmed' as const,
      user_display_name: displayName,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .select('*')
    .maybeSingle();
    
  if (error) {
    console.error('Error updating cancelled booking:', error);
    throw error;
  }
  
  console.log('Update operation completed, returned data:', data);
  
  if (!data) {
    console.log('No data returned from update operation, fetching booking explicitly');
    return await fetchBookingById(bookingId, originalBooking, displayName);
  }
  
  return data as ShiftBooking;
}

/**
 * Creates a new booking for a shift
 */
export async function createNewBooking(
  shiftId: string, 
  userId: string, 
  userEmail: string, 
  displayName: string
) {
  console.log('Creating new booking for shift:', shiftId);
  
  // Prepare the new booking data
  const newBookingData = { 
    shift_id: shiftId, 
    user_id: userId,
    user_email: userEmail,
    user_display_name: displayName,
    status: 'confirmed' as const
  };
  
  // Insert with returning
  const { data, error } = await supabase
    .from('shift_bookings')
    .insert([newBookingData])
    .select('*')
    .maybeSingle();
  
  if (error) {
    console.error('Error booking shift:', error);
    throw error;
  }
  
  console.log('Insert operation completed, returned data:', data);
  
  if (!data) {
    console.log('No data returned from insert operation, fetching booking explicitly');
    return await fetchNewlyCreatedBooking(shiftId, userId, newBookingData);
  }
  
  return data as ShiftBooking;
}

/**
 * Fetches booking by ID with fallback
 */
async function fetchBookingById(
  bookingId: string, 
  originalBooking: ShiftBooking, 
  displayName: string
) {
  // Explicit fetch to get the latest data
  const { data, error } = await supabase
    .from('shift_bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching updated booking:', error);
    // Return manually updated object as fallback
    return createFallbackBooking(originalBooking, displayName);
  }
  
  if (!data) {
    console.error('Updated booking not found in database');
    // Return manually updated object as fallback
    return createFallbackBooking(originalBooking, displayName);
  }
  
  console.log('Successfully fetched updated booking:', data);
  return data as ShiftBooking;
}

/**
 * Fetches a newly created booking with fallback
 */
async function fetchNewlyCreatedBooking(
  shiftId: string, 
  userId: string, 
  newBookingData: any
) {
  // Explicit fetch to get the latest data
  const { data, error } = await supabase
    .from('shift_bookings')
    .select('*')
    .eq('shift_id', shiftId)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching new booking:', error);
    // Fallback: use what we know about the booking
    return createFallbackNewBooking(newBookingData);
  }
  
  if (!data) {
    console.error('New booking created but not found in fetch');
    // Fallback: use what we know about the booking
    return createFallbackNewBooking(newBookingData);
  }
  
  console.log('Successfully fetched new booking:', data);
  return data as ShiftBooking;
}

/**
 * Creates a fallback booking object for an updated booking
 */
function createFallbackBooking(originalBooking: ShiftBooking, displayName: string): ShiftBooking {
  const fallback: ShiftBooking = {
    ...originalBooking,
    status: 'confirmed',
    user_display_name: displayName,
    updated_at: new Date().toISOString()
  };
  console.log('Using fallback booking data:', fallback);
  return fallback;
}

/**
 * Creates a fallback booking object for a new booking
 */
function createFallbackNewBooking(newBookingData: any): ShiftBooking {
  const fallback: ShiftBooking = {
    id: 'temporary-id', // Will be replaced when data is refetched
    ...newBookingData,
    status: 'confirmed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  console.log('Using fallback booking data:', fallback);
  return fallback;
}

/**
 * Gets the current authenticated user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Authentication error:', error);
    throw new Error('Autentiseringsfel: Du måste vara inloggad för att boka pass');
  }
  
  if (!data.user) {
    throw new Error('Du måste vara inloggad för att boka pass');
  }
  
  return data.user;
}
