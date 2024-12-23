import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, isValid, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

export interface SalaryDetailProps {
  title: string;
  children: React.ReactNode;
  trigger: React.ReactNode;
}

export const SalaryDetail = ({ title, children, trigger }: SalaryDetailProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-card border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ShiftDetailProps {
  shifts: any[];
  baseAmount: number;
}

export const ShiftDetail = ({ shifts, baseAmount }: ShiftDetailProps) => {
  console.log('Received shifts:', shifts); // Debug log to see the shifts data

  // Get unique dates from shifts using timestamp
  const uniqueDates = Array.from(new Set(
    shifts.filter(shift => shift && shift.timestamp) // Ensure shift and timestamp exist
      .map(shift => {
        const date = new Date(shift.timestamp);
        console.log('Processing shift date:', {
          timestamp: shift.timestamp,
          parsed: date,
          isValid: isValid(date)
        });
        return isValid(date) ? date.toISOString().split('T')[0] : null;
      })
      .filter(Boolean)
  )).sort();

  console.log('Unique shift dates:', uniqueDates);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400">
        Beräkning: {uniqueDates.length} pass × 140 kr = {baseAmount} kr
      </div>
      <div className="space-y-2">
        {uniqueDates.map((date, index) => (
          <div key={index} className="text-sm">
            {format(parseISO(date), 'd MMMM yyyy', { locale: sv })}
          </div>
        ))}
      </div>
    </div>
  );
};

interface SalesDetailProps {
  sales: any[];
  totalSales: number;
}

export const SalesDetail = ({ sales, totalSales }: SalesDetailProps) => {
  // Group sales by date and calculate total for each date
  const salesByDate = sales.reduce((acc, sale) => {
    const date = new Date(sale.timestamp);
    if (!isValid(date)) {
      console.warn('Invalid date found:', sale.timestamp);
      return acc;
    }
    
    const dateKey = date.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = 0;
    }
    acc[dateKey] += Number(sale.amount) || 0;
    return acc;
  }, {} as Record<string, number>);

  // Sort dates
  const sortedDates = Object.keys(salesByDate).sort();

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400">
        Total försäljning: {totalSales.toLocaleString()} kr
      </div>
      <div className="space-y-2">
        {sortedDates.map((date) => (
          <div key={date} className="text-sm flex justify-between">
            <span>{format(parseISO(date), 'd MMMM yyyy', { locale: sv })}</span>
            <span>{salesByDate[date].toLocaleString()} kr</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CommissionDetailProps {
  totalSales: number;
  commission: number;
  rate: number;
}

export const CommissionDetail = ({ totalSales, commission, rate }: CommissionDetailProps) => {
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400">
        Beräkning: {totalSales.toLocaleString()} kr × {rate}% = {commission.toLocaleString()} kr
      </div>
    </div>
  );
};

interface BonusDetailProps {
  bonuses: any[];
}

export const BonusDetail = ({ bonuses }: BonusDetailProps) => {
  return (
    <div className="space-y-4">
      {bonuses.map((bonus, index) => (
        <div key={index} className="text-sm">
          <div>{format(new Date(bonus.bonus_date), 'd MMMM yyyy', { locale: sv })}</div>
          <div className="text-gray-400">{bonus.amount.toLocaleString()} kr - {bonus.description}</div>
        </div>
      ))}
    </div>
  );
};

interface SubtotalDetailProps {
  baseAmount: number;
  commission: number;
  bonusAmount: number;
  subtotal: number;
}

export const SubtotalDetail = ({ baseAmount, commission, bonusAmount, subtotal }: SubtotalDetailProps) => {
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400">
        Beräkning: Grundlön ({baseAmount.toLocaleString()} kr) + Provision ({commission.toLocaleString()} kr) + Bonus ({bonusAmount.toLocaleString()} kr) = {subtotal.toLocaleString()} kr
      </div>
    </div>
  );
};

interface VacationPayDetailProps {
  subtotal: number;
  vacationPay: number;
}

export const VacationPayDetail = ({ subtotal, vacationPay }: VacationPayDetailProps) => {
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400">
        Beräkning: {subtotal.toLocaleString()} kr × 12% = {vacationPay.toLocaleString()} kr
      </div>
    </div>
  );
};

interface TotalSalaryDetailProps {
  subtotal: number;
  vacationPay: number;
  totalSalary: number;
}

export const TotalSalaryDetail = ({ subtotal, vacationPay, totalSalary }: TotalSalaryDetailProps) => {
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400">
        Beräkning: Delsumma ({subtotal.toLocaleString()} kr) + Semesterersättning ({vacationPay.toLocaleString()} kr) = {totalSalary.toLocaleString()} kr
      </div>
    </div>
  );
};

export default SalaryDetail;