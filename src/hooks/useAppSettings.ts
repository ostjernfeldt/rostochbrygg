
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
      console.log(`Fetching app setting for key: ${key}`);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', key)
        .single();
      
      if (error) {
        console.error(`Error fetching app setting ${key}:`, error);
        throw error;
      }
      
      console.log(`Fetched app setting data for ${key}:`, data);
      return data as AppSetting;
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (newValue: any) => {
      console.log(`Updating app setting ${key} with value:`, newValue, 'type:', typeof newValue);
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
      
      console.log(`Successfully updated app setting ${key}:`, data);
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
      // Add detailed console logging to diagnose the issue
      console.log('Booking system enabled raw value:', value);
      console.log('Value type:', typeof value);
      console.log('Value stringified:', JSON.stringify(value));
      
      // Handle various formats the value might be in
      if (typeof value === 'boolean') {
        console.log('Value is boolean, setting directly:', value);
        setIsEnabled(value);
      } else if (typeof value === 'string') {
        const lowercaseValue = value.toLowerCase();
        console.log('Value is string:', value, 'lowercase:', lowercaseValue);
        setIsEnabled(lowercaseValue === 'true' || lowercaseValue === '1' || lowercaseValue === 'yes');
      } else if (typeof value === 'number') {
        console.log('Value is number:', value);
        setIsEnabled(value === 1);
      } else if (value === null) {
        console.log('Value is null, setting to false');
        setIsEnabled(false);
      } else {
        // For JSON values or objects stored in Supabase
        try {
          console.log('Attempting to interpret complex value:', value);
          // If value is a string that might be JSON
          if (typeof value === 'string') {
            try {
              const parsedValue = JSON.parse(value);
              console.log('Successfully parsed JSON string:', parsedValue);
              setIsEnabled(!!parsedValue);
            } catch (jsonError) {
              // If not valid JSON, just do a direct check
              console.log('Not valid JSON, using direct string check');
              setIsEnabled(value.toLowerCase() === 'true');
            }
          } else if (typeof value === 'object') {
            // If already an object
            console.log('Value is an object, using truthiness check');
            setIsEnabled(!!value);
          } else {
            // For any other type, use truthiness
            console.log('Using direct truthiness check for value type:', typeof value);
            setIsEnabled(!!value);
          }
        } catch (e) {
          // If any parsing fails, log error and treat as falsy
          console.error('Error interpreting booking system value:', e);
          setIsEnabled(false);
        }
      }
      
      // Final result
      console.log('Final isEnabled value set to:', isEnabled);
    } else {
      console.log('Value is undefined, setting isEnabled to false');
      setIsEnabled(false);
    }
  }, [value]);
  
  const setEnabled = (enabled: boolean) => {
    console.log('Setting booking system enabled to:', enabled, 'type:', typeof enabled);
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
