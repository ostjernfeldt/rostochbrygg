import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TotalPurchase } from "@/types/purchase";

interface UserFilterProps {
  transactions: TotalPurchase[];
  selectedUser: string;
  onUserChange: (value: string) => void;
}

export const UserFilter = ({ transactions, selectedUser, onUserChange }: UserFilterProps) => {
  const uniqueUsers = Array.from(new Set(transactions.map(t => t.user_display_name)));

  return (
    <Select
      value={selectedUser}
      onValueChange={onUserChange}
    >
      <SelectTrigger className="w-full bg-card border-primary/20">
        <SelectValue placeholder="Filtrera på säljare" />
      </SelectTrigger>
      <SelectContent className="bg-card border-primary/20">
        <SelectItem value="all">Alla säljare</SelectItem>
        {uniqueUsers.map((user) => (
          <SelectItem key={user} value={user || ''}>
            {user || 'Okänd säljare'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};