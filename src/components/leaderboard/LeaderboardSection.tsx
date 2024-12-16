import { LeaderboardItem } from "./LeaderboardItem";
import { LeaderboardFilter } from "./LeaderboardFilter";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

interface LeaderboardSectionProps {
  title: string;
  data: UserSales[] | undefined;
  isLoading: boolean;
  onUserClick?: (userName: string) => void;
  filter?: {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
  };
}

export const LeaderboardSection = ({ 
  title, 
  data, 
  isLoading, 
  filter,
  onUserClick 
}: LeaderboardSectionProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const copyToClipboard = (data: UserSales[] | undefined) => {
    if (!data) return;

    const formattedData = data
      .map((user, index) => 
        `${index + 1}. ${user["User Display Name"]}: ${user.totalAmount.toLocaleString()} kr`
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
    <div className="mb-8">
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'} mb-4`}>
        <h2 className="text-2xl font-bold">{title}</h2>
        {filter && (
          <div className={`${isMobile ? 'w-full' : 'w-auto'}`}>
            <LeaderboardFilter {...filter} />
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(data)}
            className="w-10 h-10 bg-primary hover:bg-primary/80 border-none rounded-lg"
          >
            <Copy className="h-4 w-4 text-white" />
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
              onClick={() => onUserClick?.(user["User Display Name"])}
            />
          ))
        )}
      </div>
    </div>
  );
};