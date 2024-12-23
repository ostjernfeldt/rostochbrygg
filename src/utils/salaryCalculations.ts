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