export const calculateCommission = (
  totalSales: number,
  commissionRate: number,
  accumulatedSales: number
) => {
  // If accumulated sales are below 25000, use standard commission rate
  if (accumulatedSales <= 25000) {
    return totalSales * (commissionRate / 100);
  }

  // If this sale crosses the 25000 threshold
  if (accumulatedSales - totalSales < 25000) {
    // Calculate how much of the sale is below 25000
    const salesBelow25k = 25000 - (accumulatedSales - totalSales);
    
    // Apply standard rate to sales below 25000
    return salesBelow25k * (commissionRate / 100);
  }

  // If all accumulated sales are above 25000, return 0 for this rate
  // (will be handled by the increased commission calculation)
  return 0;
};

export const calculateAccumulatedSales = (
  sales: any[],
  userName: string,
  endDate: string
) => {
  console.log('Calculating accumulated sales for:', {
    userName,
    endDate,
    totalSales: sales.length
  });

  const total = sales
    .filter(sale => {
      const saleDate = new Date(sale.timestamp);
      const end = new Date(endDate);
      const isBeforeEnd = saleDate <= end;
      const isValidSale = !sale.refunded && Number(sale.amount) > 0;
      const isCorrectUser = sale.user_display_name === userName;

      console.log('Checking accumulated sale:', {
        saleDate: saleDate.toISOString(),
        endDate: end.toISOString(),
        isBeforeEnd,
        isValidSale,
        isCorrectUser,
        amount: sale.amount
      });

      return isCorrectUser && isBeforeEnd && isValidSale;
    })
    .reduce((sum, sale) => sum + Number(sale.amount), 0);

  console.log('Accumulated sales result:', {
    userName,
    total,
    endDate
  });

  return total;
};