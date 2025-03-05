
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { ShiftBooking, WeeklyBookingSummary } from '@/types/booking';

export const useUserBookings = (userId?: string, startDate?: Date, endDate?: Date) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['userBookings', userId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      // If no user ID is provided, get the current user
      let userIdToUse = userId;
      if (!userIdToUse) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Du måste vara inloggad för att se dina bokningar');
        userIdToUse = user.id;
      }
      
      let query = supabase
        .from('shift_bookings')
        .select(`
          *,
          shifts(*)
        `)
        .eq('user_id', userIdToUse)
        .order('created_at', { ascending: false });
      
      // Add date filters if provided
      if (startDate && endDate) {
        query = query.gte('shifts.date', startDate.toISOString().split('T')[0])
                     .lte('shifts.date', endDate.toISOString().split('T')[0]);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching user bookings:', error);
        throw error;
      }
      
      return data as (ShiftBooking & { shifts: any })[];
    },
    enabled: !!userId || true, // Enable if userId is provided or we'll get the current user
  });
  
  return {
    bookings: data || [],
    isLoading,
    error,
  };
};

export const useWeeklyBookingSummary = (userId?: string, weekStartDate?: Date) => {
  const queryClient = useQueryClient();
  
  // Get the start and end of the current week if not provided
  const getWeekDates = (date?: Date) => {
    const now = date || new Date();
    const dayOfWeek = now.getDay();
    const startDay = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as first day
    const startDate = new Date(now.setDate(startDay));
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getWeekDates(weekStartDate);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['weeklyBookingSummary', userId, startDate.toISOString()],
    queryFn: async () => {
      // If no user ID is provided, get the current user
      let userIdToUse = userId;
      if (!userIdToUse) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Du måste vara inloggad för att se din bokningsöversikt');
        userIdToUse = user.id;
      }
      
      const { data, error } = await supabase
        .from('shift_bookings')
        .select(`
          *,
          shifts(*)
        `)
        .eq('user_id', userIdToUse)
        .eq('status', 'confirmed')
        .gte('shifts.date', startDate.toISOString().split('T')[0])
        .lte('shifts.date', endDate.toISOString().split('T')[0]);
      
      if (error) {
        console.error('Error fetching weekly booking summary:', error);
        throw error;
      }
      
      const meetsMinimumRequirement = data.length >= 2;
      
      return {
        week_start: startDate.toISOString(),
        week_end: endDate.toISOString(),
        total_bookings: data.length,
        meets_minimum_requirement: meetsMinimumRequirement
      } as WeeklyBookingSummary;
    },
    enabled: !!userId || true, // Enable if userId is provided or we'll get the current user
  });
  
  return {
    summary: data,
    isLoading,
    error,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['weeklyBookingSummary'] }),
  };
};

export const useBookShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du måste vara inloggad för att boka säljpass');
      
      // Check if the user already has booked this shift
      const { data: existingBooking, error: checkError } = await supabase
        .from('shift_bookings')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      if (existingBooking) throw new Error('Du har redan bokat detta säljpass');
      
      // Check if the shift has available slots
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();
      
      if (shiftError) throw shiftError;
      
      // Count existing bookings
      const { count, error: countError } = await supabase
        .from('shift_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('shift_id', shiftId)
        .eq('status', 'confirmed');
      
      if (countError) throw countError;
      
      if (count !== null && count >= shift.available_slots) {
        throw new Error('Detta säljpass är fullbokat');
      }
      
      // Create the booking
      const { data, error } = await supabase
        .from('shift_bookings')
        .insert([
          {
            shift_id: shiftId,
            user_id: user.id,
            status: 'confirmed'
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error booking shift:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift', variables] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyBookingSummary'] });
      toast({
        title: 'Säljpass bokat',
        description: 'Du har bokat säljpasset framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid bokning av säljpass',
        description: error.message || 'Ett fel uppstod vid bokning av säljpasset.',
      });
    },
  });
};

export const useBatchBookShifts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftIds: string[]) => {
      if (shiftIds.length === 0) {
        throw new Error('Inga säljpass valda för bokning');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du måste vara inloggad för att boka säljpass');
      
      // Validate and book all shifts
      const bookings = [];
      const errors = [];
      
      for (const shiftId of shiftIds) {
        try {
          // Check if the user already has booked this shift
          const { data: existingBooking, error: checkError } = await supabase
            .from('shift_bookings')
            .select('*')
            .eq('shift_id', shiftId)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (checkError) throw checkError;
          if (existingBooking) throw new Error(`Du har redan bokat detta säljpass`);
          
          // Check if the shift has available slots
          const { data: shift, error: shiftError } = await supabase
            .from('shifts')
            .select('*')
            .eq('id', shiftId)
            .single();
          
          if (shiftError) throw shiftError;
          
          // Count existing bookings
          const { count, error: countError } = await supabase
            .from('shift_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('shift_id', shiftId)
            .eq('status', 'confirmed');
          
          if (countError) throw countError;
          
          if (count !== null && count >= shift.available_slots) {
            throw new Error(`Detta säljpass är fullbokat`);
          }
          
          bookings.push({
            shift_id: shiftId,
            user_id: user.id,
            status: 'confirmed'
          });
          
        } catch (error: any) {
          errors.push({
            shiftId,
            message: error.message || 'Ett fel uppstod'
          });
        }
      }
      
      if (bookings.length === 0) {
        throw new Error('Kunde inte boka några av de valda passen');
      }
      
      // Create all bookings
      const { data, error } = await supabase
        .from('shift_bookings')
        .insert(bookings)
        .select();
      
      if (error) {
        console.error('Error batch booking shifts:', error);
        throw error;
      }
      
      return {
        bookings: data,
        successCount: bookings.length,
        errorCount: errors.length,
        errors
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyBookingSummary'] });
      
      if (result.errors.length > 0) {
        toast({
          title: `${result.successCount} pass bokade`,
          description: `${result.errorCount} pass kunde inte bokas.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Alla pass bokade',
          description: `Du har bokat ${result.successCount} säljpass framgångsrikt.`,
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid bokning av säljpass',
        description: error.message || 'Ett fel uppstod vid bokning av säljpassen.',
      });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du måste vara inloggad för att avboka säljpass');
      
      // Check if the user has admin permissions
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const isAdmin = roleData?.role === 'admin';
      
      // If not admin, throw error - regular users cannot cancel bookings
      if (!isAdmin) {
        throw new Error('Du måste vara admin för att avboka säljpass');
      }
      
      // Update the booking status
      const { data, error } = await supabase
        .from('shift_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyBookingSummary'] });
      toast({
        title: 'Bokning avbokad',
        description: 'Säljpasset har avbokats framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid avbokning',
        description: error.message || 'Ett fel uppstod vid avbokning av säljpasset.',
      });
    },
  });
};
