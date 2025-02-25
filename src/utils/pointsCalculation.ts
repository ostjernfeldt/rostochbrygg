
import { TotalPurchase } from "@/types/purchase";

export const calculatePoints = (quantity: number | null | undefined): number => {
  if (!quantity) return 0;
  return quantity * 15;
};

export const calculateTotalPoints = (transactions: TotalPurchase[]): number => {
  return transactions.reduce((total, transaction) => {
    if (transaction.refunded) return total;
    return total + calculatePoints(transaction.quantity);
  }, 0);
};
