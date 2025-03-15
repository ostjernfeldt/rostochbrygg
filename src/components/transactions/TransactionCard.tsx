
import { format } from "date-fns";
import { TotalPurchase, Product } from "@/types/purchase";
import { calculatePoints, calculateProductPoints } from "@/utils/pointsCalculation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { List, CheckCircle2, AlertCircle, CircleAlert } from "lucide-react";

interface TransactionCardProps {
  transaction: TotalPurchase;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const isRefunded = transaction.refunded || false;
  
  // Calculate points based on products if available, otherwise fall back to quantity
  const points = transaction.products && Array.isArray(transaction.products)
    ? (transaction.products as Product[]).reduce((total, product) => total + calculateProductPoints(product), 0)
    : calculatePoints(transaction.quantity);

  const formatPaymentType = (paymentType: string | null) => {
    if (!paymentType) return "Okänd betalningsmetod";
    if (paymentType === "IZETTLE_CASH") return "KONTANT";
    if (paymentType === "IZETTLE_CARD") return "KORT";
    if (paymentType === "SWISH") return "SWISH";
    return paymentType;
  };
  
  // Check if payment type requires verification
  const requiresVerification = transaction.payment_type === "SWISH" || transaction.payment_type === "IZETTLE_CASH";
  
  // Get verification status
  const verificationStatus = transaction.verification_status || "pending";
  
  // Helper to determine verification status icon and color
  const getVerificationStatusDetails = () => {
    if (!requiresVerification) return { icon: null, title: null };
    
    switch (verificationStatus) {
      case "verified":
        return { 
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
          title: "Betalning verifierad"
        };
      case "rejected":
        return { 
          icon: <CircleAlert className="h-3.5 w-3.5 text-red-500" />,
          title: "Betalning avvisad"
        };
      default:
        return { 
          icon: <AlertCircle className="h-3.5 w-3.5 text-orange-400" />,
          title: "Betalning ej verifierad"
        };
    }
  };
  
  const { icon, title } = getVerificationStatusDetails();

  return (
    <>
      <div 
        onClick={() => setShowDetails(true)}
        className={`bg-card rounded-xl p-3 sm:p-4 hover:scale-[1.02] transition-transform duration-200 cursor-pointer ${
          isRefunded ? 'border-red-500 border' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <span className="text-gray-400 text-sm sm:text-base">
              Köp: {format(new Date(transaction.timestamp), "HH:mm")}
            </span>
            {isRefunded && transaction.refund_timestamp && (
              <span className="text-red-500 text-xs sm:text-sm">
                Återbetalning: {format(new Date(transaction.refund_timestamp), "HH:mm")}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-lg sm:text-xl font-bold ${isRefunded ? 'text-red-500' : ''}`}>
              {Math.abs(points)} poäng
            </span>
            {isRefunded && (
              <span className="text-xs sm:text-sm text-red-500">
                Återbetald
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-primary text-sm sm:text-base truncate">{transaction.user_display_name}</span>
          <div className="flex items-center gap-1.5">
            {icon && <div title={title}>{icon}</div>}
            <span className="text-gray-400 text-sm sm:text-base whitespace-nowrap">{formatPaymentType(transaction.payment_type)}</span>
          </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Transaktionsdetaljer
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col text-sm">
              <span className="text-gray-400">
                Köp: {format(new Date(transaction.timestamp), "yyyy-MM-dd HH:mm")}
              </span>
              {isRefunded && transaction.refund_timestamp && (
                <span className="text-red-500">
                  Återbetalning: {format(new Date(transaction.refund_timestamp), "yyyy-MM-dd HH:mm")}
                </span>
              )}
            </div>
            
            {requiresVerification && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-gray-900">
                {icon}
                <span>
                  {verificationStatus === "verified" 
                    ? "Betalning verifierad" 
                    : verificationStatus === "rejected"
                      ? "Betalning avvisad"
                      : "Betalning ej verifierad"}
                </span>
                {transaction.verified_at && (
                  <span className="text-gray-400 ml-auto text-xs">
                    {format(new Date(transaction.verified_at), "yyyy-MM-dd")}
                  </span>
                )}
              </div>
            )}
            
            {transaction.products && Array.isArray(transaction.products) ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Produkter:</h3>
                {(transaction.products as Product[]).map((product, index) => (
                  <div key={index} className="bg-card p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-400">Antal: {product.quantity}</div>
                      </div>
                      <div className="text-primary font-semibold">
                        {calculateProductPoints(product)} poäng
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold">Totalt:</span>
                  <span className="text-lg font-bold text-primary">
                    {points} poäng
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                Inga produktdetaljer tillgängliga
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
