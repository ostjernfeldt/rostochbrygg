
import { CheckCircle, XCircle, Clock, Info } from "lucide-react";
import { formatSEK } from "@/utils/formatters";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { TotalPurchase } from "@/types/purchase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TransactionCardProps {
  transaction: TotalPurchase;
}

const PaymentMethodIcon = ({ paymentType }: { paymentType: string | null }) => {
  if (!paymentType) return null;
  
  if (paymentType.includes('SWISH')) {
    return <span className="bg-swish text-white text-xs font-medium px-2 py-0.5 rounded">Swish</span>;
  } else if (paymentType.includes('IZETTLE_CASH')) {
    return <span className="bg-cash text-white text-xs font-medium px-2 py-0.5 rounded">Kontant</span>;
  } else if (paymentType.includes('IZETTLE_CARD')) {
    return <span className="bg-card text-white text-xs font-medium px-2 py-0.5 rounded">Kort</span>;
  }
  
  return <span className="bg-gray-500 text-white text-xs font-medium px-2 py-0.5 rounded">{paymentType}</span>;
};

const VerificationStatusIcon = ({ status }: { status?: string }) => {
  if (!status || status === 'pending') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Clock className="h-4 w-4 text-yellow-400" aria-label="Väntar på verifiering" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Väntar på verifiering</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else if (status === 'verified') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle className="h-4 w-4 text-green-400" aria-label="Verifierad" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Verifierad</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else if (status === 'rejected') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <XCircle className="h-4 w-4 text-red-400" aria-label="Avvisad" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Avvisad</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return null;
};

export function TransactionCard({ transaction }: TransactionCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Use Swedish locale for dates
  const formattedDate = format(new Date(transaction.timestamp), 'HH:mm', { locale: sv });
  const fullFormattedDate = format(new Date(transaction.timestamp), 'yyyy-MM-dd HH:mm', { locale: sv });
  
  // Determine if the transaction needs verification icon
  const showVerificationStatus = transaction.payment_type === 'SWISH' || transaction.payment_type === 'IZETTLE_CASH';
  
  return (
    <>
      <div 
        className="bg-card shadow-sm rounded-lg p-3 cursor-pointer hover:bg-card/80 transition-colors" 
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-medium">{transaction.user_display_name || 'Unknown'}</span>
              {showVerificationStatus && 
                <VerificationStatusIcon status={transaction.verification_status} />
              }
            </div>
            <div className="text-sm text-gray-400 mt-0.5 flex items-center space-x-2">
              <span>{formattedDate}</span>
              <PaymentMethodIcon paymentType={transaction.payment_type} />
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatSEK(transaction.amount)}</div>
            <div className="text-sm text-gray-400">{transaction.product_name || ''}</div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Transaktionsdetaljer</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Köpare</div>
              <div className="text-sm font-medium">{transaction.user_display_name || 'Unknown'}</div>
              
              <div className="text-sm text-muted-foreground">Tidpunkt</div>
              <div className="text-sm font-medium">{fullFormattedDate}</div>
              
              <div className="text-sm text-muted-foreground">Belopp</div>
              <div className="text-sm font-medium">{formatSEK(transaction.amount)}</div>
              
              <div className="text-sm text-muted-foreground">Produkt</div>
              <div className="text-sm font-medium">{transaction.product_name || 'Ej angiven'}</div>
              
              <div className="text-sm text-muted-foreground">Betalningsmetod</div>
              <div className="text-sm font-medium flex items-center">
                <PaymentMethodIcon paymentType={transaction.payment_type} />
              </div>

              {showVerificationStatus && (
                <>
                  <div className="text-sm text-muted-foreground">Verifieringsstatus</div>
                  <div className="text-sm font-medium flex items-center space-x-2">
                    <VerificationStatusIcon status={transaction.verification_status} />
                    <span>
                      {transaction.verification_status === 'verified' && 'Verifierad'}
                      {transaction.verification_status === 'rejected' && 'Avvisad'}
                      {(!transaction.verification_status || transaction.verification_status === 'pending') && 'Väntar på verifiering'}
                    </span>
                  </div>
                </>
              )}
              
              {transaction.verification_note && (
                <>
                  <div className="text-sm text-muted-foreground">Anteckning</div>
                  <div className="text-sm font-medium">{transaction.verification_note}</div>
                </>
              )}
              
              {transaction.refunded && (
                <>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="text-sm font-medium text-red-500">Återbetalad</div>
                  
                  {transaction.refund_timestamp && (
                    <>
                      <div className="text-sm text-muted-foreground">Återbetalningsdatum</div>
                      <div className="text-sm font-medium">
                        {format(new Date(transaction.refund_timestamp), 'yyyy-MM-dd HH:mm', { locale: sv })}
                      </div>
                    </>
                  )}
                </>
              )}
              
              <div className="text-sm text-muted-foreground">Köp-ID</div>
              <div className="text-sm font-medium text-xs text-gray-500 truncate">{transaction.purchase_uuid}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
