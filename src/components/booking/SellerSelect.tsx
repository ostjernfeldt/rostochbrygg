
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchSellers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("staff_roles")
          .select("user_display_name, email, role")
          .eq("hidden", false)
          .order("user_display_name");

        if (error) throw error;
        setSellers(data || []);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSellers();
  }, []);

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
        <Command>
          <CommandInput 
            placeholder="Sök säljare..." 
            className="h-9" 
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>Ingen säljare hittades.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {sellers.map((seller) => (
              <CommandItem
                key={seller.user_display_name}
                value={seller.user_display_name}
                onSelect={() => {
                  onSellerSelect(seller);
                  setOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span>{seller.user_display_name}</span>
                  <span className="text-xs text-muted-foreground">{seller.role}</span>
                </div>
                <Check className="ml-auto h-4 w-4 opacity-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
