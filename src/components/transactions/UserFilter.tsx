
import { useState } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { TotalPurchase } from "@/types/purchase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface UserFilterProps {
  transactions: TotalPurchase[];
  selectedUser: string;
  onUserChange: (value: string) => void;
}

export const UserFilter = ({ transactions, selectedUser, onUserChange }: UserFilterProps) => {
  const [open, setOpen] = useState(false);
  const uniqueUsers = Array.from(new Set(transactions.map(t => t.user_display_name)));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-card border-primary/20"
        >
          <div className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">
              {selectedUser === "all" 
                ? "Filtrera på säljare" 
                : selectedUser || "Okänd säljare"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[240px] bg-card border-primary/20">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Sök säljare..."
            className="border-none focus:ring-0 h-9"
          />
          <CommandEmpty className="py-3 text-center text-sm">
            Inga säljare hittades.
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            <CommandItem
              value="all"
              onSelect={() => {
                onUserChange("all");
                setOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer"
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  selectedUser === "all" ? "opacity-100" : "opacity-0"
                )}
              />
              <User className="h-4 w-4 shrink-0 opacity-50 mr-1" />
              <span>Alla säljare</span>
            </CommandItem>
            {uniqueUsers.map((user) => (
              <CommandItem
                key={user}
                value={user || ''}
                onSelect={() => {
                  onUserChange(user || '');
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer"
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    selectedUser === user ? "opacity-100" : "opacity-0"
                  )}
                />
                <User className="h-4 w-4 shrink-0 opacity-50 mr-1" />
                <span>{user || 'Okänd säljare'}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
