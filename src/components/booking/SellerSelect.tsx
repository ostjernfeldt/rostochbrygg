
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before any interactions
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle manual closing of popover when clicking outside
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSellerSelect = (seller: Seller) => {
    console.log("Seller selection triggered for:", seller.user_display_name);
    // Use setTimeout to avoid race conditions with click events
    setTimeout(() => {
      onSellerSelect(seller);
      setOpen(false);
    }, 10);
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
      {mounted && (
        <PopoverContent 
          ref={contentRef}
          className="w-[calc(100vw-2rem)] p-0 sm:w-[300px] max-h-[80vh]" 
          align={isMobile ? "center" : "start"}
          side={isMobile ? "bottom" : undefined}
          sideOffset={isMobile ? 5 : 4}
          onInteractOutside={(e) => {
            // Prevent closing when interacting with content
            if (contentRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
          forceMount
        >
          <div className="flex flex-col w-full h-full max-h-[80vh]">
            {/* Search input */}
            <div className="flex items-center border-b px-3 py-2 bg-[#1A1F2C] sticky top-0 z-10">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Sök säljare..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground border-none focus-visible:ring-transparent"
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
              <div 
                className="overflow-y-auto overflow-x-hidden bg-[#1A1F2C] flex-1 max-h-[40vh]"
                style={{ overscrollBehavior: 'contain' }}
              >
                {sellers.map((seller) => (
                  <div
                    key={seller.user_display_name}
                    role="button"
                    tabIndex={0}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-3 text-sm outline-none hover:bg-primary/20 hover:text-white my-1 transition-colors"
                    onClick={() => handleSellerSelect(seller)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSellerSelect(seller);
                      }
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-white mr-2 flex-shrink-0">
                      {seller.user_display_name[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-white font-medium truncate">{seller.user_display_name}</span>
                      <span className="text-xs text-primary truncate">{seller.role}</span>
                    </div>
                    <Check className="ml-auto h-4 w-4 opacity-0 text-primary flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
