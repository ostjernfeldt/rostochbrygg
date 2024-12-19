import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateFilterSection } from "@/components/overview/DateFilterSection";
import { DateRange } from "react-day-picker";
import { useState } from "react";

interface ShiftsListProps {
  shifts: any[];
}

export const ShiftsList = ({ shifts }: ShiftsListProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Sort shifts by date in descending order
  const sortedShifts = [...shifts].sort((a, b) => {
    return new Date(b.presence_start).getTime() - new Date(a.presence_start).getTime();
  });

  console.log("Sorted shifts:", sortedShifts);

  return (
    <div className="stat-card">
      <h3 className="text-gray-400 mb-4">Säljpass</h3>
      <DateFilterSection
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
      />
      
      <ScrollArea className="h-[400px] mt-4">
        <div className="space-y-4">
          {sortedShifts?.map((shift) => (
            <div 
              key={shift.id} 
              className="p-4 bg-card/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold">
                    {format(new Date(shift.presence_start), 'EEEE d MMMM', { locale: sv })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">SEK {Math.round(shift.totalSales / 100).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};