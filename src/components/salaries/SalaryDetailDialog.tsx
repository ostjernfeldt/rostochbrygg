import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SalaryDetailProps {
  title: string;
  children: React.ReactNode;
  trigger: React.ReactNode;
}

const SalaryDetail = ({ title, children, trigger }: SalaryDetailProps) => {
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
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400">
        Beräkning: {shifts.length} pass × 140 kr = {baseAmount} kr
      </div>
      <div className="space-y-2">
        {shifts.map((shift, index) => (
          <div key={index} className="text-sm">
            {format(new Date(shift.presence_start), 'd MMMM yyyy', { locale: sv })}
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