
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);
      
      if (error) {
        console.error('Error deleting shift:', error);
        throw error;
      }
      
      return shiftId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({
        title: 'Säljpass borttaget',
        description: 'Säljpasset har tagits bort framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid borttagning av säljpass',
        description: error.message || 'Ett fel uppstod vid borttagning av säljpasset.',
      });
    },
  });
};
