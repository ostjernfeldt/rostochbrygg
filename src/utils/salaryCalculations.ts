export const calculateCommission = (
  totalSales: number,
  commissionRate: number,
  accumulatedSales: number
) => {
  if (accumulatedSales <= 25000) {
    return totalSales * (commissionRate / 100);
  }

  if (accumulatedSales - totalSales < 25000) {
    // Split the sales into two parts: before and after 25000
    const salesBefore25k = 25000 - (accumulatedSales - totalSales);
    const salesAfter25k = totalSales - salesBefore25k;
    
    return (salesBefore25k * (commissionRate / 100)) + (salesAfter25k * 0.15);
  }

  // All sales are after 25000
  return totalSales * 0.15;
};

export const calculateAccumulatedSales = (
  sales: any[],
  userName: string,
  endDate: string
) => {
  return sales
    .filter(sale => 
      sale["User Display Name"] === userName &&
      new Date(sale.Timestamp!) <= new Date(endDate)
    )
    .reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
};