import { TotalPurchase } from "@/types/database";

interface TopPerformer {
  user_display_name: string;
  value: number;
}

export const calculateTopSeller = (sales: TotalPurchase[]): TopPerformer => {
  const accumulatedSales = sales.reduce((acc: { [key: string]: number }, sale) => {
    const userName = sale.user_display_name as string;
    if (!userName) return acc;
    acc[userName] = (acc[userName] || 0) + Number(sale.amount);
    return acc;
  }, {});

  const sortedSellers = Object.entries(accumulatedSales)
    .map(([name, total]) => ({ user_display_name: name, value: total }))
    .sort((a, b) => b.value - a.value);

  return sortedSellers[0] || { user_display_name: "Ingen data", value: 0 };
};

export const calculateHighestSale = (sales: TotalPurchase[]): TopPerformer => {
  if (!sales || sales.length === 0) {
    return { user_display_name: "Ingen data", value: 0 };
  }

  const highestSale = sales
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  return {
    user_display_name: highestSale.user_display_name || "Okänd",
    value: Number(highestSale.amount)
  };
};

export const calculateTopAverageValue = (sales: TotalPurchase[]): TopPerformer => {
  if (!sales || sales.length === 0) {
    return { user_display_name: "Ingen data", value: 0 };
  }

  const userSales = sales.reduce((acc: { [key: string]: { total: number; count: number } }, sale) => {
    const userName = sale.user_display_name;
    if (!userName) return acc;
    
    if (!acc[userName]) {
      acc[userName] = { total: 0, count: 0 };
    }
    acc[userName].total += Number(sale.amount);
    acc[userName].count += 1;
    return acc;
  }, {});

  const averageValues = Object.entries(userSales)
    .map(([name, { total, count }]) => ({
      user_display_name: name,
      value: total / count
    }))
    .sort((a, b) => b.value - a.value);

  return averageValues[0] || { user_display_name: "Ingen data", value: 0 };
};

export const calculateTopPresence = (sales: TotalPurchase[]): TopPerformer => {
  console.log("Calculating top presence from sales data...");
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  console.log("Date range:", {
    from: thirtyDaysAgo.toISOString(),
    to: now.toISOString()
  });

  const recentSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= thirtyDaysAgo && saleDate <= now;
  });

  console.log("Found recent sales:", recentSales.length);

  const presenceCounts = recentSales.reduce((acc: { [key: string]: Set<string> }, sale) => {
    const userName = sale.user_display_name;
    if (!userName) return acc;
    
    const dateKey = new Date(sale.timestamp).toISOString().split('T')[0];
    
    if (!acc[userName]) {
      acc[userName] = new Set<string>();
    }
    acc[userName].add(dateKey);
    
    return acc;
  }, {});

  const presenceArray = Object.entries(presenceCounts)
    .map(([name, dates]) => ({
      user_display_name: name,
      value: dates.size
    }))
    .sort((a, b) => b.value - a.value);

  console.log("Presence counts:", presenceArray);

  if (presenceArray.length === 0) {
    return { user_display_name: "Ingen data", value: 0 };
  }

  return presenceArray[0];
};