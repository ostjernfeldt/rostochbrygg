import { format } from "date-fns";
import { TotalPurchase } from "@/types/purchase";

interface TransactionCardProps {
  transaction: TotalPurchase;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const isRefunded = transaction.refunded || transaction.amount < 0;
  const isRefund = transaction.amount < 0;
  
  return (
    <div 
      className={`bg-card rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200 ${
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
            SEK {Math.abs(Number(transaction.amount))?.toLocaleString()}
          </span>
          {isRefunded && (
            <span className="text-sm text-red-500">
              {isRefund ? 'Återbetalad' : 'Återbetald'}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-primary">{transaction.user_display_name}</span>
          <span className="text-gray-400">{transaction.payment_type || "Okänd betalningsmetod"}</span>
        </div>
        <div className="text-sm text-gray-400">
          Produkt: {transaction.product_name || "Okänd produkt"}
        </div>
      </div>
    </div>
  );
};