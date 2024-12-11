import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { PageLayout } from "@/components/PageLayout";

const StaffMember = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  
  const { data: memberData, isLoading } = useQuery({
    queryKey: ["staffMember", name],
    queryFn: async () => {
      console.log("Fetching staff member data for:", name);
      
      if (!name) throw new Error("No name provided");
      
      const { data: sales, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("User Display Name", decodeURIComponent(name))
        .order("Timestamp", { ascending: true });

      if (error) throw error;
      if (!sales || sales.length === 0) return null;

      const firstSale = new Date(sales[0].Timestamp as string);
      const totalAmount = sales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
      const averageAmount = totalAmount / sales.length;
      
      // Calculate unique active days
      const uniqueDays = new Set(sales.map(s => new Date(s.Timestamp as string).toDateString()));
      
      return {
        displayName: name,
        firstSale,
        totalAmount,
        averageAmount,
        salesCount: sales.length,
        daysActive: uniqueDays.size,
        sales
      };
    }
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-card rounded w-1/3"></div>
          <div className="h-24 bg-card rounded"></div>
          <div className="h-24 bg-card rounded"></div>
        </div>
      </PageLayout>
    );
  }

  if (!memberData) {
    return (
      <PageLayout>
        <button 
          onClick={() => navigate("/staff")}
          className="text-gray-400 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center text-gray-400">
          Ingen data hittades för denna säljare
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => navigate("/staff")}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">{decodeURIComponent(memberData.displayName)}</h1>
      </div>

      <div className="space-y-4">
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

        <div className="stat-card">
          <h3 className="text-gray-400 mb-4">Försäljning över tid</h3>
          <SalesChart transactions={memberData.sales} />
        </div>
      </div>
    </PageLayout>
  );
};

export default StaffMember;