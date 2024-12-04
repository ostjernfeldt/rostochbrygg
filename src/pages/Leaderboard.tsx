import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserSales {
  "User Display Name": string;
  totalAmount: number;
  salesCount: number;
}

const Leaderboard = () => {
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      console.log("Fetching leaderboard data...");
      
      // First, get the latest date
      const { data: dateData, error: dateError } = await supabase
        .from("purchases")
        .select("Timestamp")
        .order("Timestamp", { ascending: false })
        .limit(1);

      if (dateError) {
        console.error("Error fetching latest date:", dateError);
        throw dateError;
      }

      if (!dateData || dateData.length === 0) {
        console.log("No sales data found");
        return [];
      }

      const latestDate = new Date(dateData[0].Timestamp);
      console.log("Latest date found:", latestDate);

      // Create start and end of day dates
      const startOfDay = new Date(latestDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(latestDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Then get all sales for that date
      const { data: salesData, error: salesError } = await supabase
        .from("purchases")
        .select("Amount, User Display Name")
        .gte("Timestamp", startOfDay.toISOString())
        .lte("Timestamp", endOfDay.toISOString())
        .not("User Display Name", "is", null);

      if (salesError) {
        console.error("Error fetching sales data:", salesError);
        throw salesError;
      }

      console.log("Sales data fetched:", salesData);

      // Group and sum sales by user
      const userSales = salesData.reduce((acc: { [key: string]: UserSales }, sale) => {
        const userName = sale["User Display Name"] as string;
        const amount = sale.Amount ? Number(sale.Amount) : 0;

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

      // Convert to array and sort by total amount
      return Object.values(userSales).sort((a, b) => b.totalAmount - a.totalAmount);
    }
  });

  if (isLoading) {
    return <div className="p-4">Loading leaderboard data...</div>;
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return <div className="p-4">No sales data available for today.</div>;
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Dagens topplista</h1>
      <div className="space-y-3">
        {leaderboardData.map((user, index) => (
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
    </div>
  );
};

export default Leaderboard;