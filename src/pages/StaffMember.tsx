import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { StaffStats } from "@/components/staff/StaffStats";
import { SalesChartSection } from "@/components/staff/SalesChartSection";
import { ShiftsList } from "@/components/staff/ShiftsList";
import { DatabasePurchase, StaffMemberStats } from "@/types/purchase";

const StaffMember = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  
  const { data: memberData, isLoading } = useQuery({
    queryKey: ["staffMember", name],
    queryFn: async () => {
      console.log("Fetching staff member data for:", name);
      
      if (!name) throw new Error("No name provided");
      
      const { data: sales, error: salesError } = await supabase
        .from("total_purchases")
        .select("*")
        .eq("user_display_name", decodeURIComponent(name))
        .order("timestamp", { ascending: true });

      if (salesError) throw salesError;
      if (!sales || sales.length === 0) return null;

      const salesByDate = (sales as DatabasePurchase[]).reduce((acc: { [key: string]: DatabasePurchase[] }, sale) => {
        const dateStr = new Date(sale.timestamp).toDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(sale);
        return acc;
      }, {});

      const dailyTotals = Object.entries(salesByDate).map(([dateStr, dateSales]) => {
        const totalAmount = dateSales.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
        return {
          date: new Date(dateStr).toISOString(),
          amount: totalAmount
        };
      });

      const sortedDays = [...dailyTotals].sort((a, b) => b.amount - a.amount);
      const bestDay = sortedDays[0];
      const worstDay = sortedDays[sortedDays.length - 1];

      const firstSale = new Date(sales[0].timestamp);
      const totalAmount = (sales as DatabasePurchase[]).reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
      const averageAmount = totalAmount / sales.length;
      const uniqueDays = new Set(sales.map(s => new Date(s.timestamp).toDateString()));

      const memberStats: StaffMemberStats = {
        displayName: name,
        firstSale,
        totalAmount,
        averageAmount,
        salesCount: sales.length,
        daysActive: uniqueDays.size,
        sales: sales as DatabasePurchase[],
        shifts: Object.entries(salesByDate).map(([dateStr, dateSales]) => ({
          id: new Date(dateStr).toISOString(),
          presence_start: new Date(dateStr).toISOString(),
          totalSales: dateSales.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0),
          sales: dateSales
        }))
      };

      return {
        ...memberStats,
        bestDay,
        worstDay
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

  const statsData = {
    salesCount: memberData.salesCount,
    averageValue: memberData.averageAmount,
    activeDays: memberData.daysActive,
    firstSaleDate: memberData.firstSale.toISOString(),
    bestDay: memberData.bestDay,
    worstDay: memberData.worstDay
  };

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
        <StaffStats stats={statsData} />
        <SalesChartSection sales={memberData.sales} />
        <ShiftsList shifts={memberData.shifts} />
      </div>
    </PageLayout>
  );
};

export default StaffMember;
