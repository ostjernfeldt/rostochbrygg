import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";

interface PeriodFilterProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  uniquePeriods: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

// Helper function to generate salary period options
const generateSalaryPeriods = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // Set to 21st of current month
    const startDate = new Date(date);
    startDate.setDate(21);
    
    // Set to 20th of next month
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(20);

    return {
      value: format(startDate, 'yyyy-MM-dd'),
      label: `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy', { locale: sv })}`
    };
  });
};

export const PeriodFilter = ({ 
  selectedPeriod, 
  setSelectedPeriod, 
  uniquePeriods,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange
}: PeriodFilterProps) => {
  const salaryPeriods = generateSalaryPeriods();

  return (
    <div className="flex flex-col gap-4 w-full">
      <Select
        value={selectedPeriod}
        onValueChange={(value) => {
          setSelectedPeriod(value);
          if (value !== "custom") {
            setDateRange(undefined);
          }
        }}
      >
        <SelectTrigger className="w-full bg-card border-gray-800">
          <SelectValue placeholder="Välj löneperiod" />
        </SelectTrigger>
        <SelectContent className="bg-card border-gray-800">
          {salaryPeriods.map((period) => (
            <SelectItem 
              key={period.value} 
              value={period.value}
              className="focus:bg-gray-800"
            >
              {period.label}
            </SelectItem>
          ))}
          <SelectItem value="custom" className="focus:bg-gray-800">Anpassad period</SelectItem>
          <SelectItem value="all" className="focus:bg-gray-800">Alla perioder</SelectItem>
        </SelectContent>
      </Select>

      {selectedPeriod === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-card border-gray-800"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "d MMM y", { locale: sv })} -{" "}
                    {format(dateRange.to, "d MMM y", { locale: sv })}
                  </>
                ) : (
                  format(dateRange.from, "d MMM y", { locale: sv })
                )
              ) : (
                <span>Välj period</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-gray-800" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={sv}
              className="bg-card rounded-md"
            />
          </PopoverContent>
        </Popover>
      )}

      <Input
        placeholder="Sök säljare..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-card border-gray-800"
      />
    </div>
  );
};