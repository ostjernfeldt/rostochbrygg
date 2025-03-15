
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface UnverifiedPaymentTotals {
  payment_type: string;
  total_amount: number;
}

export function useUnverifiedPayments(selectedDate: Date | undefined) {
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['unverifiedPayments', formattedDate],
    queryFn: async (): Promise<UnverifiedPaymentTotals[]> => {
      console.log(`Fetching unverified payment totals for date: ${formattedDate}`);
      
      const { data, error } = await supabase
        .rpc('get_unverified_payment_totals', { check_date: formattedDate });
      
      if (error) {
        console.error('Error fetching unverified payment totals:', error);
        throw error;
      }

      // Format data for display
      return data as UnverifiedPaymentTotals[] || [];
    },
  });
}
