import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

interface TopPerformer {
  "User Display Name": string;
  value: number;
}

export const AllTimeStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["allTimeStats"],
    queryFn: async () => {
      console.log("Fetching all-time stats...");
      
      // Get top total sales
      const { data: topSales, error: salesError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .not("User Display Name", "is", null)
        .not("Amount", "is", null);

      if (salesError) throw salesError;

      // Calculate accumulated sales per user
      const accumulatedSales = topSales.reduce((acc: { [key: string]: number }, sale) => {
        const userName = sale["User Display Name"] as string;
        acc[userName] = (acc[userName] || 0) + Number(sale.Amount);
        return acc;
      }, {});

      const topAccumulatedSeller = Object.entries(accumulatedSales)
        .map(([name, total]) => ({ "User Display Name": name, value: total }))
        .sort((a, b) => b.value - a.value)[0] as TopPerformer;

      // Get highest single sale
      const { data: highestSale, error: highestError } = await supabase
        .from("purchases")
        .select('"User Display Name", Amount')
        .not("User Display Name", "is", null)
        .not("Amount", "is", null)
        .order("Amount", { ascending: false })
        .limit(1)
        .single();

      if (highestError) throw highestError;

      // Calculate average order value per user
      const userSales = topSales.reduce((acc: { [key: string]: { total: number; count: number } }, sale) => {
        const userName = sale["User Display Name"] as string;
        if (!acc[userName]) {
          acc[userName] = { total: 0, count: 0 };
        }
        acc[userName].total += Number(sale.Amount);
        acc[userName].count += 1;
        return acc;
      }, {});

      const averageValues = Object.entries(userSales).map(([name, { total, count }]) => ({
        "User Display Name": name,
        value: total / count
      }));

      const topAverageValue = averageValues.sort((a, b) => b.value - a.value)[0] as TopPerformer;

      // Get presence data and calculate average weekly sessions
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      console.log("Fetching presence data from:", thirtyDaysAgo.toISOString(), "to:", now.toISOString());

      const { data: presenceData, error: presenceError } = await supabase
        .from("user_presence")
        .select('user_display_name, presence_start')
        .gte('presence_start', thirtyDaysAgo.toISOString())
        .lte('presence_start', now.toISOString());

      if (presenceError) throw presenceError;

      console.log("Raw presence data:", presenceData);

      // Early return for empty presence data
      if (!presenceData || presenceData.length === 0) {
        console.log("No presence data found");
        return {
          topAccumulatedSeller,
          highestSale: {
            "User Display Name": highestSale["User Display Name"],
            value: highestSale.Amount
          } as TopPerformer,
          topAverageValue,
          topPresence: { "User Display Name": "Ingen data", value: 0 }
        };
      }

      const userPresence = presenceData.reduce((acc: { [key: string]: { sessions: Map<string, Set<string>> } }, record) => {
        const userName = record.user_display_name;
        if (!acc[userName]) {
          acc[userName] = { sessions: new Map() };
        }

        const date = new Date(record.presence_start);
        // Calculate week number relative to current date
        const weeksDiff = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekKey = `week-${weeksDiff}`;
        const dateKey = date.toISOString().split('T')[0];

        if (!acc[userName].sessions.has(weekKey)) {
          acc[userName].sessions.set(weekKey, new Set());
        }
        acc[userName].sessions.get(weekKey)?.add(dateKey);
        
        return acc;
      }, {});

      console.log("Processed user presence:", userPresence);

      const averageWeeklySessions = Object.entries(userPresence).map(([name, { sessions }]) => {
        let totalDays = 0;
        sessions.forEach((datesSet) => {
          totalDays += datesSet.size;
        });

        const averageSessions = sessions.size > 0 ? totalDays / sessions.size : 0;
        console.log(`${name}: ${totalDays} total days over ${sessions.size} weeks = ${averageSessions} avg sessions/week`);

        return {
          "User Display Name": name,
          value: averageSessions
        };
      });

      const topPresence = averageWeeklySessions.length > 0 
        ? averageWeeklySessions.sort((a, b) => b.value - a.value)[0]
        : { "User Display Name": "Ingen data", value: 0 };

      console.log("Top presence:", topPresence);

      return {
        topAccumulatedSeller,
        highestSale: {
          "User Display Name": highestSale["User Display Name"],
          value: highestSale.Amount
        } as TopPerformer,
        topAverageValue,
        topPresence
      };
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="text-yellow-500" size={24} />
        All-time Topplista
      </h2>

      <div className="stat-card animate-fade-in">
        <h3 className="text-gray-400">Högst ackumulerad försäljning</h3>
        <div className="mt-2">
          <div className="font-bold text-xl">{stats.topAccumulatedSeller["User Display Name"]}</div>
          <div className="text-green-500">SEK {Math.round(stats.topAccumulatedSeller.value).toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:200ms]">
        <h3 className="text-gray-400">Högsta registrerade sälj</h3>
        <div className="mt-2">
          <div className="font-bold text-xl">{stats.highestSale["User Display Name"]}</div>
          <div className="text-green-500">SEK {Math.round(stats.highestSale.value).toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:400ms]">
        <h3 className="text-gray-400">Högsta snittordervärde</h3>
        <div className="mt-2">
          <div className="font-bold text-xl">{stats.topAverageValue["User Display Name"]}</div>
          <div className="text-green-500">SEK {Math.round(stats.topAverageValue.value).toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:600ms]">
        <h3 className="text-gray-400">Högst snittnärvaro per vecka</h3>
        <div className="mt-2">
          <div className="font-bold text-xl">{stats.topPresence["User Display Name"]}</div>
          <div className="text-blue-500">{Math.round(stats.topPresence.value)} pass</div>
        </div>
      </div>
    </div>
  );
};