import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface StaffStatsProps {
  memberData: {
    totalAmount: number;
    salesCount: number;
    averageAmount: number;
    daysActive: number;
    firstSale: Date;
    sales: Array<{
      Timestamp: string | null;
      Amount: number | null;
    }>;
  };
}

export const StaffStats = ({ memberData }: StaffStatsProps) => {
  // Calculate first day sales
  const firstDaySales = (() => {
    if (!memberData.sales.length) return { total: 0, date: null };
    
    const firstDay = new Date(memberData.sales[0].Timestamp!).setHours(0, 0, 0, 0);
    let total = 0;
    
    for (const sale of memberData.sales) {
      const saleDay = new Date(sale.Timestamp!).setHours(0, 0, 0, 0);
      if (saleDay === firstDay && sale.Amount) {
        total += sale.Amount;
      }
    }
    
    // If total is 0, find the next day with sales
    if (total === 0) {
      let currentDay = firstDay;
      for (const sale of memberData.sales) {
        const saleDay = new Date(sale.Timestamp!).setHours(0, 0, 0, 0);
        if (saleDay > currentDay && sale.Amount) {
          currentDay = saleDay;
          total = sale.Amount;
          for (const otherSale of memberData.sales) {
            const otherSaleDay = new Date(otherSale.Timestamp!).setHours(0, 0, 0, 0);
            if (otherSaleDay === currentDay && otherSale.Amount) {
              total += otherSale.Amount;
            }
          }
          break;
        }
      }
      return { total, date: new Date(currentDay) };
    }
    
    return { total, date: new Date(firstDay) };
  })();

  // Calculate best sales day
  const bestSalesDay = (() => {
    if (!memberData.sales.length) return { total: 0, date: null };
    
    const salesByDay = memberData.sales.reduce((acc, sale) => {
      if (!sale.Timestamp || !sale.Amount) return acc;
      
      const day = new Date(sale.Timestamp).setHours(0, 0, 0, 0);
      acc[day] = (acc[day] || 0) + sale.Amount;
      return acc;
    }, {} as { [key: number]: number });
    
    const bestDay = Object.entries(salesByDay).reduce((best, [day, total]) => {
      return total > best.total ? { total, date: new Date(Number(day)) } : best;
    }, { total: 0, date: null as Date | null });
    
    return bestDay;
  })();

  return (
    <>
      <div className="stat-card">
        <h3 className="text-gray-400 mb-2">Total försäljning</h3>
        <div className="text-4xl font-bold">
          SEK {Math.round(memberData.totalAmount).toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <h3 className="text-gray-400 mb-2">Antal sälj</h3>
          <div className="text-3xl font-bold">{memberData.salesCount}</div>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-400 mb-2">Snittordervärde</h3>
          <div className="text-3xl font-bold">
            SEK {Math.round(memberData.averageAmount).toLocaleString()}
          </div>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-400 mb-2">Aktiva dagar</h3>
          <div className="text-3xl font-bold">{memberData.daysActive}</div>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-400 mb-2">Första sälj</h3>
          <div className="text-3xl font-bold">
            {format(memberData.firstSale, 'yyyy-MM-dd')}
          </div>
        </div>

        {firstDaySales.date && (
          <div className="stat-card">
            <h3 className="text-gray-400 mb-2">
              Första säljdagen ({format(firstDaySales.date, 'd MMM yyyy', { locale: sv })})
            </h3>
            <div className="text-3xl font-bold">
              SEK {Math.round(firstDaySales.total).toLocaleString()}
            </div>
          </div>
        )}

        {bestSalesDay.date && (
          <div className="stat-card">
            <h3 className="text-gray-400 mb-2">
              Bästa säljdagen ({format(bestSalesDay.date, 'd MMM yyyy', { locale: sv })})
            </h3>
            <div className="text-3xl font-bold">
              SEK {Math.round(bestSalesDay.total).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </>
  );
};