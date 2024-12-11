import { format, startOfWeek, endOfWeek, subMonths } from "date-fns";

interface ChallengeDateFilterProps {
  type: 'day' | 'week' | 'month';
  salesDates?: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export const ChallengeDateFilter = ({ 
  type, 
  salesDates, 
  selectedValue, 
  onValueChange 
}: ChallengeDateFilterProps) => {
  // Generate options based on filter type
  const getOptions = () => {
    switch (type) {
      case 'day':
        return (salesDates || []).map(date => ({
          value: date,
          label: format(new Date(date), 'd MMMM yyyy')
        }));
      case 'week':
        return Array.from({ length: 5 }, (_, i) => {
          const date = startOfWeek(new Date());
          date.setDate(date.getDate() - (i * 7));
          return {
            value: format(date, 'yyyy-MM-dd'),
            label: `Vecka ${format(date, 'w')} (${format(date, 'd MMM')} - ${format(endOfWeek(date), 'd MMM')})`
          };
        });
      case 'month':
        return Array.from({ length: 12 }, (_, i) => {
          const date = subMonths(new Date(), i);
          return {
            value: format(date, 'yyyy-MM'),
            label: format(date, 'MMMM yyyy')
          };
        });
      default:
        return [];
    }
  };

  return {
    options: getOptions(),
    value: selectedValue,
    onValueChange,
    placeholder: `Välj ${type === 'day' ? 'datum' : type === 'week' ? 'vecka' : 'månad'}`
  };
};