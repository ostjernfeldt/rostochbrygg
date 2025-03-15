
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface VerifyPaymentsParams {
  date: Date;
  paymentTypes: string[];
  status: 'verified' | 'rejected';
}

export function useVerifyPayments() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ date, paymentTypes, status }: VerifyPaymentsParams) => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log(`Verifying payments for date: ${formattedDate}, types: ${paymentTypes.join(', ')}, status: ${status}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in to verify payments');
      
      const { data, error } = await supabase
        .rpc('verify_payments', { 
          verification_date: formattedDate,
          payment_types: paymentTypes,
          user_id: user.id,
          status: status
        }) as {
          data: number | null;
          error: Error | null;
        };
      
      if (error) {
        console.error('Error verifying payments:', error);
        throw error;
      }
      
      return data as number;
    },
    onSuccess: (count, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['unverifiedPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['latestTransactionDate'] });
      
      // Show success toast
      const action = variables.status === 'verified' ? 'Verifierade' : 'Avvisade';
      toast({
        title: `${action} betalningar`,
        description: `${count} ${variables.paymentTypes.join(', ')} betalningar har ${variables.status === 'verified' ? 'verifierats' : 'avvisats'}`,
        className: variables.status === 'verified' 
          ? "bg-green-500 text-white border-none rounded-xl shadow-lg" 
          : "bg-orange-500 text-white border-none rounded-xl shadow-lg",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Error in verification mutation:', error);
      toast({
        title: "Fel vid verifiering",
        description: error instanceof Error ? error.message : "Ett oväntat fel uppstod",
        variant: "destructive",
        duration: 3000,
      });
    }
  });
}
