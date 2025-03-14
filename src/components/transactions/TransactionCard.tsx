import { CheckCircle, XCircle, Clock, Info, RotateCcw } from "lucide-react";
import { formatSEK } from "@/utils/formatters";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { TotalPurchase, Product } from "@/types/purchase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useVerifyPayments } from "@/hooks/useVerifyPayments";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { calculateProductPoints, calculatePoints } from "@/utils/pointsCalculation";
import { Json } from "@/types/json";

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
  const { isAdmin } = useAuth();
  const { undoVerification, isUndoing, verifySingleTransaction, isVerifyingSingle } = useVerifyPayments();
  
  const formattedDate = format(new Date(transaction.timestamp), 'HH:mm', { locale: sv });
  const fullFormattedDate = format(new Date(transaction.timestamp), 'yyyy-MM-dd HH:mm', { locale: sv });
  
  const needsVerification = transaction.payment_type === 'SWISH' || transaction.payment_type === 'IZETTLE_CASH';
  const isPending = needsVerification && (!transaction.verification_status || transaction.verification_status === 'pending');
  const canUndoVerification = isAdmin && needsVerification && 
    (transaction.verification_status === 'verified' || transaction.verification_status === 'rejected');
  
  const calculateTransactionPoints = () => {
    if (transaction.products && Array.isArray(transaction.products) && transaction.products.length > 0) {
      return transaction.products.reduce((total: number, item) => {
        if (
          typeof item === 'object' && 
          item !== null && 
          'name' in item && 
          'quantity' in item && 
          typeof item.name === 'string' && 
          (typeof item.quantity === 'string' || typeof item.quantity === 'number')
        ) {
          const product = item as Product;
          return total + calculateProductPoints(product);
        }
        return total;
      }, 0);
    }
    
    return calculatePoints(transaction.quantity);
  };
  
  const transactionPoints = calculateTransactionPoints();
  
  const handleUndoVerification = () => {
    if (transaction.purchase_uuid) {
      undoVerification({ purchaseUuid: transaction.purchase_uuid });
      setIsDialogOpen(false);
    }
  };
  
  const handleVerifySingle = (status: 'verified' | 'rejected') => {
    if (transaction.purchase_uuid && transaction.payment_type) {
      verifySingleTransaction({
        purchaseUuid: transaction.purchase_uuid,
        paymentType: transaction.payment_type,
        status: status
      });
      setIsDialogOpen(false);
    }
  };
  
  const isValidProduct = (item: unknown): item is Product => {
    return (
      typeof item === 'object' && 
      item !== null && 
      'name' in item && 
      'quantity' in item &&
      typeof item.name === 'string'
    );
  };
  
  const renderProductItem = (product: unknown, index: number) => {
    if (isValidProduct(product)) {
      return (
        <li key={index}>
          {product.name} {product.quantity && product.quantity !== "1" ? `× ${product.quantity}` : ""}
        </li>
      );
    }
    return null;
  };
  
  const renderProductsList = () => {
    if (transaction.products && Array.isArray(transaction.products) && transaction.products.length > 0) {
      return (
        <>
          <div className="text-sm text-muted-foreground">Produkt</div>
          <div className="text-sm font-medium">
            <ul className="list-none space-y-1">
              {transaction.products.map((product, index) => {
                return renderProductItem(product as unknown, index);
              })}
            </ul>
          </div>
        </>
      );
    } else if (transaction.product_name) {
      return (
        <>
          <div className="text-sm text-muted-foreground">Produkt</div>
          <div className="text-sm font-medium">{transaction.product_name}</div>
        </>
      );
    }
    return null;
  };
  
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
              {needsVerification && 
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
            <div className="text-sm text-gray-400">{transactionPoints} poäng</div>
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
              
              <div className="text-sm text-muted-foreground">Poäng</div>
              <div className="text-sm font-medium">{transactionPoints} poäng</div>
              
              {renderProductsList()}
              
              <div className="text-sm text-muted-foreground">Betalningsmetod</div>
              <div className="text-sm font-medium flex items-center">
                <PaymentMethodIcon paymentType={transaction.payment_type} />
              </div>

              {needsVerification && (
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
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {isAdmin && isPending && (
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerifySingle('rejected')}
                  disabled={isVerifyingSingle}
                  className="bg-red-950/30 hover:bg-red-900/50 border-red-900/50 flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  <span>{isVerifyingSingle ? "Avvisar..." : "Avvisa"}</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleVerifySingle('verified')}
                  disabled={isVerifyingSingle}
                  className="bg-green-950/30 hover:bg-green-900/50 border-green-900/50 flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>{isVerifyingSingle ? "Verifierar..." : "Verifiera"}</span>
                </Button>
              </div>
            )}
            
            {canUndoVerification && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndoVerification}
                disabled={isUndoing}
                className="flex items-center space-x-1 ml-auto"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                <span>{isUndoing ? "Återställer..." : "Ångra verifiering"}</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
