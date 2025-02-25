
import { format } from "date-fns";
import { TotalPurchase, Product } from "@/types/purchase";
import { calculatePoints, calculateProductPoints } from "@/utils/pointsCalculation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { List } from "lucide-react";

interface TransactionCardProps {
  transaction: TotalPurchase;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const isRefunded = transaction.refunded || transaction.amount < 0;
  const isRefund = transaction.amount < 0;
  
  // Calculate points based on products if available, otherwise fall back to quantity
  const points = transaction.products && Array.isArray(transaction.products)
    ? (transaction.products as Product[]).reduce((total, product) => total + calculateProductPoints(product), 0)
    : calculatePoints(transaction.quantity);

  const formatPaymentType = (paymentType: string | null) => {
    if (!paymentType) return "Okänd betalningsmetod";
    if (paymentType === "IZETTLE_CASH") return "KONTANT";
    return paymentType;
  };
  
  return (
    <>
      <div 
        onClick={() => setShowDetails(true)}
        className={`bg-card rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200 cursor-pointer ${
          isRefunded ? 'border-red-500 border' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <span className="text-gray-400">
              {isRefund ? 'Återbetalning' : 'Köp'}: {format(new Date(transaction.timestamp), "HH:mm")}
            </span>
            {isRefunded && transaction.refund_timestamp && !isRefund && (
              <span className="text-red-500 text-sm">
                Återbetalning: {format(new Date(transaction.refund_timestamp), "HH:mm")}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xl font-bold ${isRefunded ? 'text-red-500' : ''}`}>
              {Math.abs(points)} poäng
            </span>
            {isRefunded && (
              <span className="text-sm text-red-500">
                {isRefund ? 'Återbetalad' : 'Återbetald'}
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-primary">{transaction.user_display_name}</span>
          <span className="text-gray-400">{formatPaymentType(transaction.payment_type)}</span>
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
            <div className="text-sm text-gray-400">
              {format(new Date(transaction.timestamp), "yyyy-MM-dd HH:mm")}
            </div>
            
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
