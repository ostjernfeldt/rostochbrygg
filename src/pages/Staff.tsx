import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface StaffMember {
  displayName: string;
  firstSale: Date;
  totalSales: number;
  averageAmount: number;
  totalAmount: number;
  daysActive: number;
  salesCount: number;
}

const Staff = () => {
  const navigate = useNavigate();
  
  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ["staffMembers"],
    queryFn: async () => {
      console.log("Fetching staff members data...");
      
      const { data: sales, error } = await supabase
        .from("purchases")
        .select("*")
        .not("User Display Name", "is", null)
        .order("Timestamp", { ascending: true });

      if (error) throw error;
      if (!sales || sales.length === 0) return [];

      const staffStats = sales.reduce((acc: { [key: string]: StaffMember }, sale) => {
        const displayName = sale["User Display Name"] as string;
        const saleDate = new Date(sale.Timestamp as string);
        const amount = Number(sale.Amount) || 0;

        if (!acc[displayName]) {
          acc[displayName] = {
            displayName,
            firstSale: saleDate,
            totalSales: 0,
            averageAmount: 0,
            totalAmount: 0,
            daysActive: 0,
            salesCount: 0
          };
        }

        acc[displayName].totalAmount += amount;
        acc[displayName].salesCount += 1;
        acc[displayName].averageAmount = acc[displayName].totalAmount / acc[displayName].salesCount;

        // Calculate unique days
        const uniqueDays = new Set(
          sales
            .filter(s => s["User Display Name"] === displayName)
            .map(s => new Date(s.Timestamp as string).toDateString())
        );
        acc[displayName].daysActive = uniqueDays.size;

        return acc;
      }, {});

      return Object.values(staffStats);
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold mb-6">Personal</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-card rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Personal</h1>
      <div className="space-y-4">
        {staffMembers?.map((member) => (
          <div
            key={member.displayName}
            onClick={() => navigate(`/staff/${encodeURIComponent(member.displayName)}`)}
            className="bg-card p-4 rounded-xl hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">{member.displayName}</h3>
              <span className="text-primary">
                SEK {Math.round(member.totalAmount).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
              <div>Första sälj: {format(member.firstSale, 'yyyy-MM-dd')}</div>
              <div>Antal sälj: {member.salesCount}</div>
              <div>Aktiva dagar: {member.daysActive}</div>
              <div>Snitt per sälj: SEK {Math.round(member.averageAmount).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Staff;