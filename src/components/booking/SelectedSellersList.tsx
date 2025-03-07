
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Seller {
  user_display_name: string;
  email: string | null;
  role: string;
}

interface SelectedSellersListProps {
  sellers: Seller[];
  onRemove: (index: number) => void;
}

export function SelectedSellersList({ sellers, onRemove }: SelectedSellersListProps) {
  if (sellers.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sellers.map((seller, index) => (
        <Badge 
          key={index} 
          variant="secondary"
          className="flex items-center gap-1 bg-black/20 hover:bg-black/30 text-xs"
        >
          {seller.user_display_name}
          <button 
            onClick={() => onRemove(index)} 
            className="ml-1 rounded-full p-0.5 hover:bg-black/20"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Ta bort</span>
          </button>
        </Badge>
      ))}
    </div>
  );
}
