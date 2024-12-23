import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Users } from "lucide-react";

interface SellerFilterProps {
  sellers: string[];
  selectedSeller: string;
  onSellerChange: (value: string) => void;
}

export const SellerFilter = ({ sellers, selectedSeller, onSellerChange }: SellerFilterProps) => {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <ToggleGroup 
        type="single" 
        value={selectedSeller} 
        onValueChange={onSellerChange}
        className="inline-flex min-w-full md:min-w-0 bg-card/50 p-1 rounded-full"
      >
        <ToggleGroupItem 
          value="all" 
          className="rounded-full px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-white"
        >
          <Users className="h-4 w-4 mr-2" />
          Allt
        </ToggleGroupItem>
        {sellers.map((seller) => (
          <ToggleGroupItem
            key={seller}
            value={seller}
            className="rounded-full px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-white whitespace-nowrap"
          >
            {seller}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};