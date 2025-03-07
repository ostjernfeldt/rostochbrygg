
import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useSellerSearch } from "@/hooks/booking/useSellerSearch";

interface Seller {
  user_display_name: string;
  email: string | null;
  role: string;
}

interface SellerSelectProps {
  onSellerSelect: (seller: Seller) => void;
  disabled?: boolean;
}

export function SellerSelect({ onSellerSelect, disabled = false }: SellerSelectProps) {
  const [open, setOpen] = useState(false);
  const { sellers, loading, search, setSearch } = useSellerSearch();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between border-[#33333A] bg-black/20 hover:bg-black/30 hover:border-primary/30"
          )}
        >
          {loading ? "Laddar säljare..." : "Välj säljare"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        {/* Search and List content */}
        <div className="w-full">
          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Sök säljare..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none focus-visible:ring-transparent"
            />
          </div>
          
          {/* Loading state */}
          {loading && (
            <div className="p-4 text-center">
              <div className="h-4 w-4 border-2 border-current/30 border-t-current/90 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Laddar säljare...</p>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && sellers.length === 0 && (
            <div className="py-6 text-center text-sm">
              Ingen säljare hittades.
            </div>
          )}
          
          {/* Sellers list */}
          {!loading && sellers.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto p-1">
              {sellers.map((seller) => (
                <div
                  key={seller.user_display_name}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                  onClick={() => {
                    onSellerSelect(seller);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col flex-1">
                    <span>{seller.user_display_name}</span>
                    <span className="text-xs text-muted-foreground">{seller.role}</span>
                  </div>
                  <Check className="ml-auto h-4 w-4 opacity-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
