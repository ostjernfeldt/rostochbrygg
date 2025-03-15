import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useUnverifiedPayments } from "@/hooks/useUnverifiedPayments";
import { useVerifyPayments } from "@/hooks/useVerifyPayments";
import { formatSEK } from "@/utils/formatters";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

interface PaymentVerificationProps {
  selectedDate: Date | undefined;
  isAdmin: boolean;
}

export function PaymentVerification({ selectedDate, isAdmin }: PaymentVerificationProps) {
  const { data: unverifiedTotals = [], isLoading } = useUnverifiedPayments(selectedDate);
  const { mutate: verifyPayments, isPending } = useVerifyPayments();
  const [openDialog, setOpenDialog] = useState<{ open: boolean; action: 'verify' | 'reject'; type: string | null }>({ 
    open: false, action: 'verify', type: null 
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const displayDate = selectedDate || new Date();
  const formattedDate = format(displayDate, 'd MMMM yyyy', { locale: sv });
  
  const swishTotal = unverifiedTotals.find(t => t.payment_type === 'SWISH')?.total_amount || 0;
  const cashTotal = unverifiedTotals.find(t => t.payment_type === 'IZETTLE_CASH')?.total_amount || 0;
  
  const handleVerifyClick = (type: string, action: 'verify' | 'reject') => {
    setOpenDialog({ open: true, action, type });
  };
  
  const handleConfirm = () => {
    if (!openDialog.type) return;
    
    const paymentTypes = openDialog.type === 'all' 
      ? ['SWISH', 'IZETTLE_CASH'] 
      : [openDialog.type];
    
    verifyPayments({
      date: displayDate,
      paymentTypes,
      status: openDialog.action === 'verify' ? 'verified' : 'rejected'
    });
    
    setOpenDialog({ open: false, action: 'verify', type: null });
  };
  
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['unverifiedPayments'] });
    toast({
      title: "Data uppdaterad",
      description: "Verifieringsdata har uppdaterats",
      className: "bg-primary text-white border-none rounded-xl shadow-lg",
      duration: 1500,
    });
  };
  
  if (!isAdmin) return null;
  if (!isLoading && swishTotal === 0 && cashTotal === 0) return null;
  
  return (
    <>
      <div className="border-t border-gray-800 pt-4 pb-2 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Overifierade betalningar</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshData}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-400 mb-3">{formattedDate}</p>
        
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 bg-gray-800 animate-pulse rounded-md"></div>
            <div className="h-12 bg-gray-800 animate-pulse rounded-md"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {swishTotal > 0 && (
              <div className="bg-card p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Swish</span>
                    <p className="text-sm text-gray-400">{formatSEK(swishTotal)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 bg-red-950/30 hover:bg-red-900/50 border-red-900/50"
                      onClick={() => handleVerifyClick('SWISH', 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Avvisa
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8 bg-green-950/30 hover:bg-green-900/50 border-green-900/50"
                      onClick={() => handleVerifyClick('SWISH', 'verify')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Verifiera
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {cashTotal > 0 && (
              <div className="bg-card p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Kontant</span>
                    <p className="text-sm text-gray-400">{formatSEK(cashTotal)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 bg-red-950/30 hover:bg-red-900/50 border-red-900/50"
                      onClick={() => handleVerifyClick('IZETTLE_CASH', 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Avvisa
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8 bg-green-950/30 hover:bg-green-900/50 border-green-900/50"
                      onClick={() => handleVerifyClick('IZETTLE_CASH', 'verify')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Verifiera
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {swishTotal > 0 && cashTotal > 0 && (
              <div className="flex justify-end mt-2">
                <Button 
                  className="w-full bg-primary hover:bg-primary/80"
                  onClick={() => handleVerifyClick('all', 'verify')}
                >
                  Verifiera alla
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Dialog open={openDialog.open} onOpenChange={(open) => setOpenDialog({ ...openDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {openDialog.action === 'verify' ? 'Verifiera betalningar' : 'Avvisa betalningar'}
            </DialogTitle>
            <DialogDescription>
              {openDialog.action === 'verify' 
                ? 'Detta bekräftar att betalningarna har mottagits.' 
                : 'Detta markerar betalningarna som avvisade.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-orange-400" />
              <div>
                <p className="font-medium">
                  {openDialog.type === 'SWISH' 
                    ? 'Swish' 
                    : openDialog.type === 'IZETTLE_CASH' 
                      ? 'Kontant' 
                      : 'Alla betalningar'}
                </p>
                <p className="text-sm text-gray-400">
                  {openDialog.type === 'SWISH' 
                    ? formatSEK(swishTotal)
                    : openDialog.type === 'IZETTLE_CASH'
                      ? formatSEK(cashTotal)
                      : formatSEK(swishTotal + cashTotal)}
                </p>
              </div>
            </div>
            
            <p className="text-sm">
              {openDialog.action === 'verify'
                ? 'Är du säker på att alla betalningar har mottagits?'
                : 'Är du säker på att dessa betalningar ska avvisas?'}
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog({ open: false, action: 'verify', type: null })}
            >
              Avbryt
            </Button>
            <Button
              onClick={handleConfirm}
              className={openDialog.action === 'verify' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-orange-600 hover:bg-orange-700"}
              disabled={isPending}
            >
              {isPending ? "Arbetar..." : (openDialog.action === 'verify' ? "Verifiera" : "Avvisa")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
