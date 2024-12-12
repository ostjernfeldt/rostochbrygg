import { DateRange } from "react-day-picker";
import { PeriodFilter } from "./PeriodFilter";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SalaryFiltersProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  uniquePeriods: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

export const SalaryFilters = ({
  selectedPeriod,
  setSelectedPeriod,
  uniquePeriods,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange
}: SalaryFiltersProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Löner</h1>
        <PeriodFilter
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          uniquePeriods={uniquePeriods}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </div>
    </div>
  );
};