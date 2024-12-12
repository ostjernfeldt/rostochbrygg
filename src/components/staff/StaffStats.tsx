import { format } from "date-fns";

interface StaffStatsProps {
  memberData: {
    totalAmount: number;
    salesCount: number;
    averageAmount: number;
    daysActive: number;
    firstSale: Date;
  };
}

export const StaffStats = ({ memberData }: StaffStatsProps) => {
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
      </div>
    </>
  );
};