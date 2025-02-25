
import { TotalPurchase, Product } from "@/types/purchase";

const STANDARD_POINTS = 15;
const EXPLORE_POINTS = 40;

export const calculateProductPoints = (product: Product): number => {
  const quantity = Number(product.quantity) || 0;
  if (product.name === "Utforska") {
    return quantity * EXPLORE_POINTS;
  }
  return quantity * STANDARD_POINTS;
};

export const calculatePoints = (quantity: number | null | undefined): number => {
  if (!quantity) return 0;
  return quantity * STANDARD_POINTS;
};

export const calculateTotalPoints = (transactions: TotalPurchase[]): number => {
  return transactions.reduce((total, transaction) => {
    if (transaction.refunded) return total;
    
    // Handle products array if it exists
    if (transaction.products && Array.isArray(transaction.products)) {
      const productsPoints = (transaction.products as Product[]).reduce((productTotal, product) => {
        return productTotal + calculateProductPoints(product);
      }, 0);
      return total + productsPoints;
    }
    
    // Fallback to legacy quantity field if products array doesn't exist
    return total + calculatePoints(transaction.quantity);
  }, 0);
};
