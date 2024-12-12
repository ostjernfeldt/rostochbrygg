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

export const PeriodFilter = ({ 
  selectedPeriod, 
  setSelectedPeriod, 
  uniquePeriods,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange
}: PeriodFilterProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
        >
          <SelectTrigger className="w-[180px] bg-card border-gray-800">
            <SelectValue placeholder="Välj period" />
          </SelectTrigger>
          <SelectContent className="bg-card border-gray-800">
            <SelectItem value="custom" className="focus:bg-gray-800">Anpassad period</SelectItem>
            <SelectItem value="all" className="focus:bg-gray-800">Alla perioder</SelectItem>
            {uniquePeriods.map((period) => (
              <SelectItem 
                key={period} 
                value={period}
                className="focus:bg-gray-800"
              >
                {format(new Date(period), 'MMMM yyyy', { locale: sv })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPeriod === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[300px] justify-start text-left font-normal bg-card border-gray-800"
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
      </div>

      <Input
        placeholder="Sök säljare..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full sm:w-[300px] bg-card border-gray-800"
      />
    </div>
  );
};