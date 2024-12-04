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

export const calculateTopPresence = (sales: any[]) => {
  console.log("Calculating top presence from sales data...");
  
  // Get current date and date 30 days ago
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  console.log("Date range:", {
    from: thirtyDaysAgo.toISOString(),
    to: now.toISOString()
  });

  // Filter sales to last 30 days and get unique dates per seller
  const recentSales = sales.filter(sale => {
    const saleDate = new Date(sale.Timestamp);
    return saleDate >= thirtyDaysAgo && saleDate <= now;
  });

  console.log("Found recent sales:", recentSales.length);

  // Count unique dates per seller
  const presenceCounts = recentSales.reduce((acc: { [key: string]: Set<string> }, sale) => {
    const userName = sale["User Display Name"] as string;
    const dateKey = new Date(sale.Timestamp).toISOString().split('T')[0];
    
    if (!acc[userName]) {
      acc[userName] = new Set();
    }
    acc[userName].add(dateKey);
    
    return acc;
  }, {});

  // Convert to array and find seller with most unique dates
  const presenceArray = Object.entries(presenceCounts).map(([name, dates]) => ({
    "User Display Name": name,
    value: dates.size
  }));

  console.log("Presence counts:", presenceArray);

  if (presenceArray.length === 0) {
    return { "User Display Name": "Ingen data", value: 0 };
  }

  return presenceArray.sort((a, b) => b.value - a.value)[0];
};
