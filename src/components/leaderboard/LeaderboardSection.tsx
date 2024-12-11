import { LeaderboardItem } from "./LeaderboardItem";
import { LeaderboardFilter } from "./LeaderboardFilter";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

interface LeaderboardSectionProps {
  title: string;
  data: UserSales[] | undefined;
  isLoading: boolean;
  filter?: {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
  };
}

export const LeaderboardSection = ({ title, data, isLoading, filter }: LeaderboardSectionProps) => {
  const { toast } = useToast();

  const copyToClipboard = (data: UserSales[] | undefined, title: string) => {
    if (!data) return;

    const formattedData = `${title}\n\n` + data
      .map((user, index) => 
        `${index + 1}. ${user["User Display Name"]}: ${user.salesCount} sälj - SEK ${user.totalAmount.toLocaleString()}`
      )
      .join('\n');

    navigator.clipboard.writeText(formattedData).then(() => {
      toast({
        title: "Kopierat!",
        description: "Leaderboard data har kopierats till urklipp",
        className: "bg-green-500 text-white border-none",
        duration: 1000,
      });
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {filter && <LeaderboardFilter {...filter} />}
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(data, title)}
            className="w-10 h-10"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        {isLoading ? (
          <div className="p-4">Laddar data...</div>
        ) : !data || data.length === 0 ? (
          <div className="p-4">Ingen försäljningsdata tillgänglig.</div>
        ) : (
          data.map((user, index) => (
            <LeaderboardItem
              key={user["User Display Name"]}
              rank={index + 1}
              displayName={user["User Display Name"]}
              salesCount={user.salesCount}
              totalAmount={user.totalAmount}
            />
          ))
        )}
      </div>
    </div>
  );
};