import { TotalPurchase } from "@/types/purchase";
import { subDays } from "date-fns";

interface StatsResult {
  user_display_name: string;
  value: number;
}

export const calculateTopSeller = (sales: TotalPurchase[]): StatsResult => {
  const userTotals = sales.reduce<Record<string, number>>((acc, sale) => {
    const name = sale.user_display_name;
    if (!name) return acc;
    
    acc[name] = (acc[name] || 0) + Number(sale.amount);
    return acc;
  }, {});

  return Object.entries(userTotals)
    .map(([name, total]) => ({
      user_display_name: name,
      value: total
    }))
    .sort((a, b) => b.value - a.value)[0] || { user_display_name: '-', value: 0 };
};

export const calculateHighestSale = (sales: TotalPurchase[]): StatsResult => {
  const highestSale = sales
    .reduce((highest, sale) => {
      const amount = Number(sale.amount);
      return amount > highest.value ? { user_display_name: sale.user_display_name || '-', value: amount } : highest;
    }, { user_display_name: '-', value: 0 });

  return highestSale;
};

export const calculateTopAverageValue = (sales: TotalPurchase[]): StatsResult => {
  const userSales = sales.reduce<Record<string, { total: number; count: number }>>((acc, sale) => {
    const name = sale.user_display_name;
    if (!name) return acc;
    
    if (!acc[name]) {
      acc[name] = { total: 0, count: 0 };
    }
    acc[name].total += Number(sale.amount);
    acc[name].count += 1;
    return acc;
  }, {});

  return Object.entries(userSales)
    .map(([name, { total, count }]) => ({
      user_display_name: name,
      value: total / count
    }))
    .sort((a, b) => b.value - a.value)[0] || { user_display_name: '-', value: 0 };
};

export const calculateTopPresence = (sales: TotalPurchase[]): StatsResult => {
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  const recentSales = sales.filter(sale => 
    new Date(sale.timestamp) >= thirtyDaysAgo
  );

  const userDays = recentSales.reduce<Record<string, Set<string>>>((acc, sale) => {
    const name = sale.user_display_name;
    if (!name) return acc;
    
    if (!acc[name]) {
      acc[name] = new Set();
    }
    acc[name].add(new Date(sale.timestamp).toDateString());
    return acc;
  }, {});

  return Object.entries(userDays)
    .map(([name, days]) => ({
      user_display_name: name,
      value: days.size
    }))
    .sort((a, b) => b.value - a.value)[0] || { user_display_name: '-', value: 0 };
};