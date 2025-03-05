
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { AppSetting } from '@/types/booking';

export const useAppSettings = (key: string) => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['appSettings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', key)
        .single();
      
      if (error) {
        console.error(`Error fetching app setting ${key}:`, error);
        throw error;
      }
      
      return data as AppSetting;
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (newValue: any) => {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ value: newValue })
        .eq('key', key)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating app setting ${key}:`, error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings', key] });
      toast({
        title: 'Inställning uppdaterad',
        description: 'Inställningen har uppdaterats framgångsrikt.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Fel vid uppdatering',
        description: error.message || 'Ett fel uppstod vid uppdatering av inställningen.',
      });
    },
  });
  
  const value = data?.value;
  const updateSetting = (newValue: any) => updateMutation.mutate(newValue);
  
  return {
    value,
    setValue: updateSetting,
    isLoading,
    error,
    isUpdating: updateMutation.isPending,
  };
};

export const useBookingSystemEnabled = () => {
  const { value, setValue, isLoading, error, isUpdating } = useAppSettings('booking_system_enabled');
  const [isEnabled, setIsEnabled] = useState(false);
  
  useEffect(() => {
    if (value !== undefined) {
      // Handle the value being a string "true"/"false" or a boolean
      setIsEnabled(value === true || value === 'true');
    }
  }, [value]);
  
  const setEnabled = (enabled: boolean) => {
    setValue(enabled);
  };
  
  return {
    isEnabled,
    setEnabled,
    isLoading,
    error,
    isUpdating,
  };
};
