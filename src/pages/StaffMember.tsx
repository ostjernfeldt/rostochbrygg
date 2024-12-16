import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { StaffStats } from "@/components/staff/StaffStats";
import { SalesChartSection } from "@/components/staff/SalesChartSection";
import { ShiftsList } from "@/components/staff/ShiftsList";

const StaffMember = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  
  const { data: memberData, isLoading } = useQuery({
    queryKey: ["staffMember", name],
    queryFn: async () => {
      console.log("Fetching staff member data for:", name);
      
      if (!name) throw new Error("No name provided");
      
      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from("purchases")
        .select("*")
        .eq("User Display Name", decodeURIComponent(name))
        .order("Timestamp", { ascending: true });

      if (salesError) throw salesError;

      if (!sales || sales.length === 0) return null;

      // Process sales data by date
      const salesByDate = sales.reduce((acc: { [key: string]: any[] }, sale) => {
        const dateStr = new Date(sale.Timestamp as string).toDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(sale);
        return acc;
      }, {});

      // Calculate totals for each date
      const shifts = Object.entries(salesByDate).map(([dateStr, dateSales]) => {
        const date = new Date(dateStr);
        const totalSales = dateSales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
        
        return {
          id: date.toISOString(), // Using date as ID since we group by date
          presence_start: date.toISOString(),
          totalSales,
          sales: dateSales
        };
      });

      console.log("Processed shifts by date:", shifts);

      // Calculate overall stats
      const firstSale = new Date(sales[0].Timestamp as string);
      const totalAmount = sales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
      const averageAmount = totalAmount / sales.length;
      const uniqueDays = new Set(sales.map(s => new Date(s.Timestamp as string).toDateString()));

      return {
        displayName: name,
        firstSale,
        totalAmount,
        averageAmount,
        salesCount: sales.length,
        daysActive: uniqueDays.size,
        sales,
        shifts
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
          onClick={() => navigate(-1)}
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
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">{decodeURIComponent(memberData.displayName)}</h1>
      </div>

      <div className="space-y-4">
        <StaffStats memberData={memberData} />
        <SalesChartSection sales={memberData.sales} />
        <ShiftsList shifts={memberData.shifts} />
      </div>
    </PageLayout>
  );
};

export default StaffMember;