
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { formatSEK } from "@/utils/formatters";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { TotalPurchase } from "@/types/purchase";

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
    return <Clock className="h-4 w-4 text-yellow-400" title="Väntar på verifiering" />;
  } else if (status === 'verified') {
    return <CheckCircle className="h-4 w-4 text-green-400" title="Verifierad" />;
  } else if (status === 'rejected') {
    return <XCircle className="h-4 w-4 text-red-400" title="Avvisad" />;
  }
  return null;
};

export function TransactionCard({ transaction }: TransactionCardProps) {
  // Use Swedish locale for dates
  const formattedDate = format(new Date(transaction.timestamp), 'HH:mm', { locale: sv });
  
  return (
    <div className="bg-card shadow-sm rounded-lg p-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-medium">{transaction.user_display_name || 'Unknown'}</span>
            {(transaction.payment_type === 'SWISH' || transaction.payment_type === 'IZETTLE_CASH') && 
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
  );
}
