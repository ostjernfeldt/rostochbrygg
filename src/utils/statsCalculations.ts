import { Database } from "@/integrations/supabase/types";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

interface TopPerformer {
  "User Display Name": string;
  value: number;
}

export const calculateTopSeller = (sales: Purchase[]): TopPerformer => {
  const accumulatedSales = sales.reduce((acc: { [key: string]: number }, sale) => {
    const userName = sale["User Display Name"] as string;
    acc[userName] = (acc[userName] || 0) + Number(sale.Amount);
    return acc;
  }, {});

  return Object.entries(accumulatedSales)
    .map(([name, total]) => ({ "User Display Name": name, value: total }))
    .sort((a, b) => b.value - a.value)[0];
};

export const calculateHighestSale = (sales: Purchase[]): TopPerformer => {
  const highestSale = sales
    .sort((a, b) => Number(b.Amount) - Number(a.Amount))[0];

  return {
    "User Display Name": highestSale["User Display Name"] as string,
    value: Number(highestSale.Amount)
  };
};

export const calculateTopAverageValue = (sales: Purchase[]): TopPerformer => {
  const userSales = sales.reduce((acc: { [key: string]: { total: number; count: number } }, sale) => {
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

  return averageValues.sort((a, b) => b.value - a.value)[0];
};

export const calculateTopPresence = (sales: Purchase[]): TopPerformer => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  console.log("Calculating presence from:", thirtyDaysAgo.toISOString(), "to:", now.toISOString());

  // Filter sales to last 30 days
  const recentSales = sales.filter(sale => {
    const saleDate = new Date(sale.Timestamp!);
    return saleDate >= thirtyDaysAgo && saleDate <= now;
  });

  console.log("Recent sales count:", recentSales.length);

  if (recentSales.length === 0) {
    return { "User Display Name": "Ingen data", value: 0 };
  }

  // Group sales by user and week
  const userWeeklyPresence = recentSales.reduce((acc: { [key: string]: { [week: string]: Set<string> } }, sale) => {
    const userName = sale["User Display Name"] as string;
    const saleDate = new Date(sale.Timestamp!);
    
    // Calculate week number relative to current date
    const weeksDiff = Math.floor((now.getTime() - saleDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekKey = `week-${weeksDiff}`;
    const dateKey = saleDate.toISOString().split('T')[0];

    if (!acc[userName]) {
      acc[userName] = {};
    }
    if (!acc[userName][weekKey]) {
      acc[userName][weekKey] = new Set();
    }
    acc[userName][weekKey].add(dateKey);
    
    return acc;
  }, {});

  console.log("User weekly presence:", userWeeklyPresence);

  // Calculate average presence per week for each user
  const averagePresence = Object.entries(userWeeklyPresence).map(([name, weeks]) => {
    const weekCount = Object.keys(weeks).length;
    const totalDays = Object.values(weeks).reduce((sum, dates) => sum + dates.size, 0);
    const average = weekCount > 0 ? totalDays / weekCount : 0;

    console.log(`${name}: ${totalDays} total days over ${weekCount} weeks = ${average} avg days/week`);

    return {
      "User Display Name": name,
      value: average
    };
  });

  const topPresence = averagePresence.length > 0 
    ? averagePresence.sort((a, b) => b.value - a.value)[0]
    : { "User Display Name": "Ingen data", value: 0 };

  console.log("Top presence:", topPresence);
  return topPresence;
};