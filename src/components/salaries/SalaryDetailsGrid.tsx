import { Percent, Gift } from "lucide-react";
import { SalaryDetail } from "./SalaryDetailDialog";
import { ShiftDetail, CommissionDetail, BonusDetail, SubtotalDetail, VacationPayDetail, TotalSalaryDetail, SalesDetail } from "./SalaryDetailDialog";

interface SalaryDetailsGridProps {
  shiftsCount: number;
  baseAmount: number;
  totalSales: number;
  accumulatedSales: number;
  commission: number;
  commissionRate: number;
  hasIncreasedCommission: boolean;
  bonus: number;
  subtotal: number;
  vacationPay: number;
  totalSalary: number;
  shifts: any[];
  bonuses: any[];
  sales: any[];
}

export const SalaryDetailsGrid = ({
  shiftsCount,
  baseAmount,
  totalSales,
  accumulatedSales,
  commission,
  commissionRate,
  hasIncreasedCommission,
  bonus,
  subtotal,
  vacationPay,
  totalSalary,
  shifts,
  bonuses,
  sales
}: SalaryDetailsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <SalaryDetail 
        title="Antal pass" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
            <div className="text-sm text-gray-400 mb-1">Antal pass</div>
            <div className="text-lg font-semibold">
              {shiftsCount} st
            </div>
          </div>
        }
      >
        <ShiftDetail shifts={shifts} baseAmount={baseAmount} />
      </SalaryDetail>
      
      <SalaryDetail 
        title="Grundlön" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
            <div className="text-sm text-gray-400 mb-1">Grundlön</div>
            <div className="text-lg font-semibold">
              {baseAmount.toLocaleString()} kr
            </div>
          </div>
        }
      >
        <ShiftDetail shifts={shifts} baseAmount={baseAmount} />
      </SalaryDetail>

      <SalaryDetail 
        title="Total försäljning" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
              <span>Total försäljning</span>
            </div>
            <div className="text-lg font-semibold">
              {totalSales.toLocaleString()} kr
            </div>
          </div>
        }
      >
        <SalesDetail sales={sales} totalSales={totalSales} />
      </SalaryDetail>

      <div className="bg-background p-3 rounded-lg">
        <div className="text-sm text-gray-400 mb-1">
          <span>Ackumulerad försäljning</span>
        </div>
        <div className="text-lg font-semibold">
          {accumulatedSales.toLocaleString()} kr
        </div>
      </div>

      <SalaryDetail 
        title="Provision" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
              <span>Provision</span>
              <Percent className="h-3 w-3" />
              <span>{commissionRate}</span>
            </div>
            <div className="text-lg font-semibold">
              {commission.toLocaleString()} kr
            </div>
          </div>
        }
      >
        <CommissionDetail 
          totalSales={totalSales} 
          commission={commission} 
          rate={commissionRate} 
        />
      </SalaryDetail>

      <SalaryDetail 
        title="Provision 15%" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
            <div className="text-sm text-gray-400 mb-1">
              <span>Provision 15%</span>
            </div>
            <div className="text-lg font-semibold">
              {hasIncreasedCommission ? (totalSales * 0.15).toLocaleString() : '0'} kr
            </div>
          </div>
        }
      >
        <CommissionDetail 
          totalSales={totalSales} 
          commission={hasIncreasedCommission ? totalSales * 0.15 : 0} 
          rate={15} 
        />
      </SalaryDetail>

      <SalaryDetail 
        title="Bonus" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
              <Gift className="h-4 w-4" />
              <span>Bonus</span>
            </div>
            <div className="text-lg font-semibold">
              {bonus.toLocaleString()} kr
            </div>
          </div>
        }
      >
        <BonusDetail bonuses={bonuses} />
      </SalaryDetail>

      <SalaryDetail 
        title="Delsumma" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
            <div className="text-sm text-gray-400 mb-1">
              <span>Delsumma</span>
            </div>
            <div className="text-lg font-semibold">
              {subtotal.toLocaleString()} kr
            </div>
          </div>
        }
      >
        <SubtotalDetail 
          baseAmount={baseAmount}
          commission={commission}
          bonusAmount={bonus}
          subtotal={subtotal}
        />
      </SalaryDetail>

      <SalaryDetail 
        title="Semesterersättning" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
              <span>Semesterersättning</span>
              <Percent className="h-3 w-3" />
              <span>12</span>
            </div>
            <div className="text-lg font-semibold">
              {vacationPay.toLocaleString()} kr
            </div>
          </div>
        }
      >
        <VacationPayDetail 
          subtotal={subtotal}
          vacationPay={vacationPay}
        />
      </SalaryDetail>

      <SalaryDetail 
        title="Total lön" 
        trigger={
          <div className="bg-background p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
              <span>Total lön</span>
            </div>
            <div className="text-lg font-semibold text-primary">
              {totalSalary.toLocaleString()} kr
            </div>
          </div>
        }
      >
        <TotalSalaryDetail 
          subtotal={subtotal}
          vacationPay={vacationPay}
          totalSalary={totalSalary}
        />
      </SalaryDetail>
    </div>
  );
};