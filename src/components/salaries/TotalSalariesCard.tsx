import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface TotalSalariesCardProps {
  totalSalaries: number;
  salaryDetails?: Array<{
    name: string;
    total: number;
    periodStart: string;
    periodEnd: string;
  }>;
}

export const TotalSalariesCard = ({ totalSalaries, salaryDetails = [] }: TotalSalariesCardProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="bg-card p-4 sm:p-6 mb-6 mt-6 border-0 cursor-pointer hover:bg-gray-900 transition-colors">
          <div className="text-sm text-gray-400 mb-1">Total löner för perioden</div>
          <div className="text-2xl font-semibold text-primary">
            {totalSalaries.toLocaleString()} kr
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="bg-card border-gray-800">
        <DialogHeader>
          <DialogTitle>Lönefördelning</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {salaryDetails.map((detail, index) => (
            <div key={index} className="border-b border-gray-800 last:border-0 pb-4 last:pb-0">
              <div className="font-semibold text-lg">{detail.name}</div>
              <div className="text-gray-400 text-sm">
                {format(new Date(detail.periodStart), 'd MMMM', { locale: sv })} - {format(new Date(detail.periodEnd), 'd MMMM yyyy', { locale: sv })}
              </div>
              <div className="text-primary font-semibold mt-1">
                {detail.total.toLocaleString()} kr
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};