import { DatabasePurchase } from "@/types/purchase";

interface TopPerformer {
  "User Display Name": string;
  value: number;
}

export const calculateTopSeller = (sales: DatabasePurchase[]): TopPerformer => {
  const accumulatedSales = sales.reduce((acc: { [key: string]: number }, sale) => {
    const userName = sale.user_display_name as string;
    acc[userName] = (acc[userName] || 0) + Number(sale.amount);
    return acc;
  }, {});

  return Object.entries(accumulatedSales)
    .map(([name, total]) => ({ "User Display Name": name, value: total }))
    .sort((a, b) => b.value - a.value)[0];
};

export const calculateHighestSale = (sales: DatabasePurchase[]): TopPerformer => {
  const highestSale = sales
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  return {
    "User Display Name": highestSale.user_display_name as string,
    value: Number(highestSale.amount)
  };
};

export const calculateTopAverageValue = (sales: DatabasePurchase[]): TopPerformer => {
  const userSales = sales.reduce((acc: { [key: string]: { total: number; count: number } }, sale) => {
    const userName = sale.user_display_name as string;
    if (!acc[userName]) {
      acc[userName] = { total: 0, count: 0 };
    }
    acc[userName].total += Number(sale.amount);
    acc[userName].count += 1;
    return acc;
  }, {});

  const averageValues = Object.entries(userSales).map(([name, { total, count }]) => ({
    "User Display Name": name,
    value: total / count
  }));

  return averageValues.sort((a, b) => b.value - a.value)[0];
};

export const calculateTopPresence = (sales: DatabasePurchase[]): TopPerformer => {
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
    const userName = sale.user_display_name as string;
    const dateKey = new Date(sale.timestamp).toISOString().split('T')[0];
    
    if (!acc[userName]) {
      acc[userName] = new Set<string>();
    }
    acc[userName].add(dateKey);
    
    return acc;
  }, {});

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