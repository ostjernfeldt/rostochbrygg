import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PageLayout } from "@/components/PageLayout";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

const Leaderboard = () => {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return `${format(startOfWeek(now), 'yyyy-MM-dd')}`;
  });

  // Generate last 12 months for the dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  // Generate weeks for the current month
  const weekOptions = Array.from({ length: 5 }, (_, i) => {
    const date = startOfWeek(new Date());
    date.setDate(date.getDate() - (i * 7));
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: `Vecka ${format(date, 'w')} (${format(date, 'd MMM')} - ${format(endOfWeek(date), 'd MMM')})`
    };
  });

  const { data: dailyLeaderboard, isLoading: isDailyLoading } = useQuery({
    queryKey: ["dailyLeaderboard"],
    queryFn: async () => {
      console.log("Fetching daily leaderboard data...");
      
      const { data: dateData, error: dateError } = await supabase
        .from("purchases")
        .select("Timestamp")
        .order("Timestamp", { ascending: false })
        .limit(1);

      if (dateError) throw dateError;
      if (!dateData?.length) return [];

      const latestDate = new Date(dateData[0].Timestamp);
      const startOfDay = new Date(latestDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(latestDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", startOfDay.toISOString())
        .lte("Timestamp", endOfDay.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData);
    }
  });

  const { data: weeklyLeaderboard, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ["weeklyLeaderboard", selectedWeek],
    queryFn: async () => {
      console.log("Fetching weekly leaderboard data...");
      const weekStart = new Date(selectedWeek);
      const weekEnd = endOfWeek(weekStart);

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", weekStart.toISOString())
        .lte("Timestamp", weekEnd.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData);
    }
  });

  const { data: monthlyLeaderboard, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ["monthlyLeaderboard", selectedMonth],
    queryFn: async () => {
      console.log("Fetching monthly leaderboard data...");
      const [year, month] = selectedMonth.split('-');
      const monthStart = startOfMonth(new Date(Number(year), Number(month) - 1));
      const monthEnd = endOfMonth(monthStart);

      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .gte("Timestamp", monthStart.toISOString())
        .lte("Timestamp", monthEnd.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) throw salesError;
      return processLeaderboardData(salesData);
    }
  });

  const processLeaderboardData = (salesData: any[]): UserSales[] => {
    const userSales = salesData.reduce((acc: { [key: string]: UserSales }, sale) => {
      const userName = sale["User Display Name"] as string;
      const amount = Number(sale.Amount || 0);

      if (!acc[userName]) {
        acc[userName] = {
          "User Display Name": userName,
          totalAmount: 0,
          salesCount: 0
        };
      }

      acc[userName].totalAmount += amount;
      acc[userName].salesCount += 1;

      return acc;
    }, {});

    return Object.values(userSales).sort((a, b) => b.totalAmount - a.totalAmount);
  };

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

  const renderLeaderboard = (data: UserSales[] | undefined, isLoading: boolean, title: string) => {
    if (isLoading) {
      return <div className="p-4">Laddar data...</div>;
    }

    if (!data || data.length === 0) {
      return <div className="p-4">Ingen försäljningsdata tillgänglig.</div>;
    }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(data, title)}
            className="w-10 h-10"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        {data.map((user, index) => (
          <div 
            key={user["User Display Name"]} 
            className={`leaderboard-item ${index === 0 ? 'first-place' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className={`leaderboard-rank ${
                index === 0 ? 'gold' : 
                index === 1 ? 'silver' : 
                index === 2 ? 'bronze' : ''
              }`}>#{index + 1}</span>
              <div className="text-left">
                <h3 className="font-bold text-lg">{user["User Display Name"]}</h3>
                <p className="leaderboard-sales">{user.salesCount} sälj</p>
              </div>
            </div>
            <span className="leaderboard-amount">SEK {user.totalAmount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PageLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Dagens topplista</h2>
          {renderLeaderboard(dailyLeaderboard, isDailyLoading, "Dagens topplista")}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Veckans topplista</h2>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Välj vecka" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map(week => (
                  <SelectItem key={week.value} value={week.value}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {renderLeaderboard(weeklyLeaderboard, isWeeklyLoading, `Veckans topplista (${
            format(new Date(selectedWeek), 'w')
          })`)}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Månadens topplista</h2>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Välj månad" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {renderLeaderboard(monthlyLeaderboard, isMonthlyLoading, `Månadens topplista (${
            format(new Date(selectedMonth + '-01'), 'MMMM yyyy')
          })`)}
        </div>
      </div>
    </PageLayout>
  );
};

export default Leaderboard;