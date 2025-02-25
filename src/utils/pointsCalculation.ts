
import { TotalPurchase } from "@/types/purchase";

export const calculatePoints = (quantity: number | null | undefined): number => {
  if (!quantity) return 0;
  return quantity * 15;
};

export const calculateTotalPoints = (transactions: TotalPurchase[]): number => {
  return transactions.reduce((total, transaction) => {
    if (transaction.refunded) return total;
    
    // Handle products array if it exists
    if (transaction.products && Array.isArray(transaction.products)) {
      const productsPoints = transaction.products.reduce((productTotal, product) => {
        const productQuantity = Number(product.quantity) || 0;
        return productTotal + (productQuantity * 15);
      }, 0);
      return total + productsPoints;
    }
    
    // Fallback to legacy quantity field if products array doesn't exist
    return total + calculatePoints(transaction.quantity);
  }, 0);
};
