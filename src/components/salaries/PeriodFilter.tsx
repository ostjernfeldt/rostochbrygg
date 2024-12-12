import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodFilterProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  uniquePeriods: string[];
}

export const PeriodFilter = ({ selectedPeriod, setSelectedPeriod, uniquePeriods }: PeriodFilterProps) => {
  return (
    <Select
      value={selectedPeriod}
      onValueChange={setSelectedPeriod}
    >
      <SelectTrigger className="w-[180px] bg-card border-gray-800">
        <SelectValue placeholder="Välj period" />
      </SelectTrigger>
      <SelectContent className="bg-card border-gray-800">
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
  );
};