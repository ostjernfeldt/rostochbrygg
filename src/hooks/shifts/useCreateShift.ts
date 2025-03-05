
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shift } from '@/types/booking';
import { toast } from '@/components/ui/use-toast';

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftData: Omit<Shift, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du måste vara inloggad för att skapa säljpass');
      
      const { data, error } = await supabase
        .from('shifts')
        .insert([{ ...shiftData, created_by: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating shift:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: 'Säljpass skapat',
        description: 'Säljpasset har skapats framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid skapande av säljpass',
        description: error.message || 'Ett fel uppstod vid skapande av säljpasset.',
      });
    },
  });
};
