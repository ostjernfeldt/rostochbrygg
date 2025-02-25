import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { StaffStats } from "@/components/staff/StaffStats";
import { StaffMemberStats, TotalPurchase } from "@/types/purchase";
import { processTransactions } from "@/components/transactions/TransactionProcessor";
import { calculatePoints, calculateTotalPoints } from "@/utils/pointsCalculation";

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
        .order("timestamp", { ascending: true })
        .not("refunded", "eq", true);

      if (salesError) throw salesError;
      if (!sales || sales.length === 0) return null;

      // Process transactions to handle refunds
      const processedSales = processTransactions(sales);
      const validSales = processedSales.filter(sale => !sale.refunded);

      // Sort sales by timestamp for consistent date handling
      const sortedSales = [...validSales].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Get the first sale date
      const firstSaleDate = new Date(sortedSales[0].timestamp);

      // Group sales by date for daily totals
      const salesByDate = sortedSales.reduce((acc: { [key: string]: TotalPurchase[] }, sale) => {
        const dateStr = new Date(sale.timestamp).toDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(sale);
        return acc;
      }, {});

      // Calculate daily totals in points
      const dailyTotals = Object.entries(salesByDate).map(([dateStr, dateSales]) => ({
        date: new Date(dateStr).toISOString(),
        points: calculateTotalPoints(dateSales)
      }));

      // Sort days by points for best day
      const sortedDays = [...dailyTotals].sort((a, b) => b.points - a.points);
      const bestDay = sortedDays[0];

      // Find highest single transaction
      const highestSingleTransaction = Math.max(
        ...validSales.map(sale => calculatePoints(sale.quantity))
      );

      const totalAmount = validSales.reduce((sum, sale) => sum + Number(sale.amount), 0);
      const totalPoints = calculateTotalPoints(validSales);
      const averageAmount = totalAmount / validSales.length;
      const averagePoints = totalPoints / validSales.length;
      const uniqueDays = new Set(validSales.map(s => new Date(s.timestamp).toDateString()));

      const memberStats: StaffMemberStats = {
        displayName: name,
        firstSale: firstSaleDate,
        totalAmount,
        averageAmount,
        totalPoints,
        averagePoints,
        salesCount: validSales.length,
        daysActive: uniqueDays.size,
        sales: validSales
      };

      return {
        ...memberStats,
        bestDay,
        worstDay: {
          date: firstSaleDate.toISOString(),
          points: highestSingleTransaction
        }
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
    averagePoints: memberData.averagePoints,
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
      </div>
    </PageLayout>
  );
};

export default StaffMember;
