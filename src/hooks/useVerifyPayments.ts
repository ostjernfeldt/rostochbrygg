
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface VerifyPaymentsParams {
  date: Date;
  paymentTypes: string[];
  status: 'verified' | 'rejected' | 'pending';
}

interface UndoVerificationParams {
  purchaseUuid: string;
}

interface SingleTransactionVerifyParams {
  purchaseUuid: string;
  paymentType: string;
  status: 'verified' | 'rejected';
}

export function useVerifyPayments() {
  const queryClient = useQueryClient();
  
  const verifyMutation = useMutation({
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
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['unverifiedPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['latestTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['latestTransactionDate'] });
      
      // Show success toast
      const action = variables.status === 'verified' ? 'Verifierade' : 
                     variables.status === 'rejected' ? 'Avvisade' : 'Återställde';
      toast({
        title: `${action} betalningar`,
        description: `${count} ${variables.paymentTypes.join(', ')} betalningar har ${
          variables.status === 'verified' ? 'verifierats' : 
          variables.status === 'rejected' ? 'avvisats' : 'återställts till overifierade'
        }`,
        className: variables.status === 'verified' 
          ? "bg-green-500 text-white border-none rounded-xl shadow-lg" 
          : variables.status === 'rejected'
          ? "bg-orange-500 text-white border-none rounded-xl shadow-lg"
          : "bg-blue-500 text-white border-none rounded-xl shadow-lg",
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

  const undoVerificationMutation = useMutation({
    mutationFn: async ({ purchaseUuid }: UndoVerificationParams) => {
      console.log(`Undoing verification for transaction: ${purchaseUuid}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in to undo verification');
      
      const { data, error } = await supabase
        .from('total_purchases')
        .update({ 
          verification_status: 'pending',
          verified_by: null,
          verified_at: null
        })
        .eq('purchase_uuid', purchaseUuid)
        .select();
      
      if (error) {
        console.error('Error undoing verification:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['unverifiedPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['latestTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['latestTransactionDate'] });
      
      // Show success toast
      toast({
        title: "Verifiering ångrades",
        description: "Transaktionen har återställts till overifierad status",
        className: "bg-blue-500 text-white border-none rounded-xl shadow-lg",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Error in undo verification mutation:', error);
      toast({
        title: "Fel vid ångra verifiering",
        description: error instanceof Error ? error.message : "Ett oväntat fel uppstod",
        variant: "destructive",
        duration: 3000,
      });
    }
  });
  
  const singleTransactionVerifyMutation = useMutation({
    mutationFn: async ({ purchaseUuid, paymentType, status }: SingleTransactionVerifyParams) => {
      console.log(`Verifying single transaction: ${purchaseUuid}, type: ${paymentType}, status: ${status}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in to verify payments');
      
      const { data, error } = await supabase
        .from('total_purchases')
        .update({ 
          verification_status: status,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('purchase_uuid', purchaseUuid)
        .select();
      
      if (error) {
        console.error('Error verifying single transaction:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['unverifiedPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['latestTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['latestTransactionDate'] });
      
      // Show success toast
      const action = variables.status === 'verified' ? 'Verifierad' : 'Avvisad';
      const type = variables.paymentType === 'SWISH' ? 'Swish' : 
                  variables.paymentType === 'IZETTLE_CASH' ? 'Kontant' : variables.paymentType;
      
      toast({
        title: `Transaktion ${variables.status === 'verified' ? 'verifierad' : 'avvisad'}`,
        description: `${type}-betalningen har ${variables.status === 'verified' ? 'verifierats' : 'avvisats'}`,
        className: variables.status === 'verified' 
          ? "bg-green-500 text-white border-none rounded-xl shadow-lg" 
          : "bg-orange-500 text-white border-none rounded-xl shadow-lg",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Error in single transaction verification mutation:', error);
      toast({
        title: "Fel vid verifiering",
        description: error instanceof Error ? error.message : "Ett oväntat fel uppstod",
        variant: "destructive",
        duration: 3000,
      });
    }
  });
  
  return {
    verify: verifyMutation.mutate,
    undoVerification: undoVerificationMutation.mutate,
    verifySingleTransaction: singleTransactionVerifyMutation.mutate,
    isVerifying: verifyMutation.isPending,
    isUndoing: undoVerificationMutation.isPending,
    isVerifyingSingle: singleTransactionVerifyMutation.isPending
  };
}
