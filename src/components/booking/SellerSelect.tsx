
import { useState, useRef, useEffect } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleSellerSelect = (seller: Seller) => {
    console.log("Handling seller selection for:", seller.user_display_name);
    onSellerSelect(seller);
    setOpen(false);
  };

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
      <PopoverContent 
        ref={popoverRef}
        className="w-[calc(100vw-2rem)] p-0 sm:w-auto" 
        align={isMobile ? "center" : "start"}
        side={isMobile ? "bottom" : undefined}
        sideOffset={isMobile ? 5 : 4}
      >
        <div className="w-full">
          {/* Search input */}
          <div className="flex items-center border-b px-3 bg-[#1A1F2C]">
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
            <div className="p-4 text-center bg-[#1A1F2C]">
              <div className="h-4 w-4 border-2 border-current/30 border-t-current/90 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Laddar säljare...</p>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && sellers.length === 0 && (
            <div className="py-6 text-center text-sm bg-[#1A1F2C] text-white">
              Ingen säljare hittades.
            </div>
          )}
          
          {/* Sellers list */}
          {!loading && sellers.length > 0 && (
            <div className="max-h-[40vh] overflow-y-auto overscroll-contain bg-[#1A1F2C]">
              {sellers.map((seller) => (
                <button
                  key={seller.user_display_name}
                  type="button"
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-3 sm:py-1.5 text-sm outline-none hover:bg-primary/20 hover:text-white data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 my-1"
                  onClick={() => handleSellerSelect(seller)}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-white mr-2">
                    {seller.user_display_name[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-white font-medium">{seller.user_display_name}</span>
                    <span className="text-xs text-primary">{seller.role}</span>
                  </div>
                  <Check className="ml-auto h-4 w-4 opacity-0 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
