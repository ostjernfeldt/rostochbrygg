import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
interface DateFilterSectionProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}
export const DateFilterSection = ({
  selectedDate,
  setSelectedDate,
  dateRange,
  setDateRange,
  selectedPeriod,
  setSelectedPeriod
}: DateFilterSectionProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  return <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        
        
      </div>

      {selectedPeriod === "custom" && <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? dateRange.to ? <>
                    {format(dateRange.from, "LLL dd, y", {
              locale: sv
            })} -{" "}
                    {format(dateRange.to, "LLL dd, y", {
              locale: sv
            })}
                  </> : format(dateRange.from, "LLL dd, y", {
            locale: sv
          }) : <span>Välj datum</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={sv} />
          </PopoverContent>
        </Popover>}
    </div>;
};