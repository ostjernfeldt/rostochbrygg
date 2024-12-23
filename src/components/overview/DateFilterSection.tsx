import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, setDate } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { LeaderboardFilter } from "@/components/leaderboard/LeaderboardFilter";

interface DateFilterSectionProps {
  salesDates?: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

export const DateFilterSection = ({
  salesDates,
  selectedDate,
  setSelectedDate,
  dateRange,
  setDateRange,
  selectedPeriod,
  setSelectedPeriod
}: DateFilterSectionProps) => {
  // Create period filter options
  const periodOptions = [
    { value: "day", label: "Säljdag" },
    { value: "week", label: "Vecka" },
    { value: "month", label: "Månad" },
    { value: "salary", label: "Löneperiod" },
    { value: "all", label: "All tid" },
    { value: "custom", label: "Anpassad period" }
  ];

  // Create date filter options with a clear option
  const dateFilterOptions = [
    { value: "none", label: "Välj datum" },
    ...(salesDates?.map(date => ({
      value: date,
      label: format(new Date(date), 'd MMMM yyyy', { locale: sv })
    })) || [])
  ];

  // Generate week options
  const weekOptions = Array.from({ length: 5 }, (_, i) => {
    const date = startOfWeek(new Date());
    date.setDate(date.getDate() - (i * 7));
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: `Vecka ${format(date, 'w')} (${format(date, 'd MMM')} - ${format(endOfWeek(date), 'd MMM')})`
    };
  });

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: sv })
    };
  });

  // Generate salary period options (21st to 20th next month)
  const salaryPeriodOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // Set to 21st of current month
    const startDate = setDate(date, 21);
    
    // Set to 20th of next month
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(20);

    return {
      value: format(startDate, 'yyyy-MM-dd'),
      label: `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy', { locale: sv })}`
    };
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setSelectedDate("");
    setDateRange(undefined);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <LeaderboardFilter
        options={periodOptions}
        value={selectedPeriod}
        onValueChange={handlePeriodChange}
        placeholder="Välj period"
      />

      {selectedPeriod === "day" && (
        <LeaderboardFilter
          options={dateFilterOptions}
          value={selectedDate || "none"}
          onValueChange={(value) => setSelectedDate(value === "none" ? "" : value)}
          placeholder="Välj säljdag"
        />
      )}

      {selectedPeriod === "week" && (
        <LeaderboardFilter
          options={weekOptions}
          value={selectedDate || "none"}
          onValueChange={(value) => setSelectedDate(value === "none" ? "" : value)}
          placeholder="Välj vecka"
        />
      )}

      {selectedPeriod === "month" && (
        <LeaderboardFilter
          options={monthOptions}
          value={selectedDate || "none"}
          onValueChange={(value) => setSelectedDate(value === "none" ? "" : value)}
          placeholder="Välj månad"
        />
      )}

      {selectedPeriod === "salary" && (
        <LeaderboardFilter
          options={salaryPeriodOptions}
          value={selectedDate || "none"}
          onValueChange={(value) => setSelectedDate(value === "none" ? "" : value)}
          placeholder="Välj löneperiod"
        />
      )}

      {selectedPeriod === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto justify-start text-left font-normal"
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
  );
};