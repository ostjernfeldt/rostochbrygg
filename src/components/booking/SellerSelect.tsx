
import { useState } from 'react';
import { Check, ChevronsUpDown, User } from "lucide-react";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Seller {
  id: string;
  user_display_name: string;
}

interface SellerSelectProps {
  sellers: Seller[];
  selectedSellerId: string;
  onSellerChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SellerSelect({ 
  sellers, 
  selectedSellerId, 
  onSellerChange,
  isLoading = false,
  placeholder = "Välj säljare..."
}: SellerSelectProps) {
  const [open, setOpen] = useState(false);
  
  // Get the selected seller's name for display
  const selectedSeller = sellers.find(seller => seller.id === selectedSellerId);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-[#151A25] border-[#33333A]/30 h-10"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">
              {selectedSeller ? selectedSeller.user_display_name : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[240px] bg-[#1A1F2C] border-[#33333A]/30">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Sök säljare..."
            className="border-none focus:ring-0 h-9"
          />
          <CommandEmpty className="py-3 text-center text-sm">
            Inga säljare hittades.
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {sellers.map((seller) => (
              <CommandItem
                key={seller.id}
                value={seller.user_display_name}
                onSelect={() => {
                  onSellerChange(seller.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer"
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    selectedSellerId === seller.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <User className="h-4 w-4 shrink-0 opacity-50 mr-1" />
                <span>{seller.user_display_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
