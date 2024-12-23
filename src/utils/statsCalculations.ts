import { TotalPurchase } from "@/types/purchase";
import { subDays } from "date-fns";

interface StatsResult {
  user_display_name: string;
  value: number;
}

export const calculateTopSeller = (sales: TotalPurchase[]): StatsResult => {
  console.log("Calculating top seller with total sales:", sales.length);
  
  // Only filter out sales without a user name, include all amounts (positive and negative)
  const validSales = sales.filter(sale => sale.user_display_name);

  console.log("Valid sales after filtering:", validSales.length);

  const userTotals = validSales.reduce<Record<string, number>>((acc, sale) => {
    const name = sale.user_display_name;
    if (!name) return acc;
    
    const amount = Number(sale.amount);
    acc[name] = (acc[name] || 0) + amount;
    
    console.log(`Adding ${amount} to ${name}'s total. New total: ${acc[name]}`);
    return acc;
  }, {});

  console.log("Final user totals:", userTotals);

  return Object.entries(userTotals)
    .map(([name, total]) => ({
      user_display_name: name,
      value: total
    }))
    .sort((a, b) => b.value - a.value)[0] || { user_display_name: '-', value: 0 };
};

export const calculateHighestSale = (sales: TotalPurchase[]): StatsResult => {
  const validSales = sales.filter(sale => 
    !sale.refunded && 
    Number(sale.amount) > 0 &&
    sale.user_display_name
  );

  const highestSale = validSales
    .reduce((highest, sale) => {
      const amount = Number(sale.amount);
      return amount > highest.value ? { user_display_name: sale.user_display_name || '-', value: amount } : highest;
    }, { user_display_name: '-', value: 0 });

  return highestSale;
};

export const calculateTopAverageValue = (sales: TotalPurchase[]): StatsResult => {
  const validSales = sales.filter(sale => 
    !sale.refunded && 
    Number(sale.amount) > 0 &&
    sale.user_display_name
  );

  const userSales = validSales.reduce<Record<string, { total: number; count: number }>>((acc, sale) => {
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
  
  const validSales = sales.filter(sale => 
    !sale.refunded &&
    Number(sale.amount) > 0 &&
    new Date(sale.timestamp) >= thirtyDaysAgo &&
    sale.user_display_name
  );

  const userDays = validSales.reduce<Record<string, Set<string>>>((acc, sale) => {
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