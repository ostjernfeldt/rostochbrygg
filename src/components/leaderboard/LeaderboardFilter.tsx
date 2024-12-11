import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface LeaderboardFilterProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}

export const LeaderboardFilter = ({ options, value, onValueChange, placeholder }: LeaderboardFilterProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[240px]'} bg-card border-gray-800`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-card border-gray-800">
        {options.map(option => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="focus:bg-gray-800"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};