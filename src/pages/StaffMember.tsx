
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Award } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { StaffStats } from "@/components/staff/StaffStats";
import { StaffMemberStats, TotalPurchase } from "@/types/purchase";
import { processTransactions } from "@/components/transactions/TransactionProcessor";
import { calculatePoints, calculateTotalPoints } from "@/utils/pointsCalculation";

const StaffMember = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  
  const { data: memberData, isLoading } = useQuery({
    queryKey: ["staffMember", name],
    queryFn: async () => {
      console.log("Fetching staff member data for:", name);
      
      if (!name) throw new Error("No name provided");
      
      // Fetch role data and check if hidden
      const { data: roleData, error: roleError } = await supabase
        .from("staff_roles")
        .select("role, hidden")
        .eq("user_display_name", decodeURIComponent(name))
        .single();

      if (roleError) {
        console.error("Error fetching role:", roleError);
      }

      // If staff member is hidden, redirect to staff list
      if (roleData?.hidden) {
        navigate('/staff');
        return null;
      }

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

      // Find highest single sale
      const highestSingleSale = [...validSales].sort((a, b) => {
        const pointsA = calculatePoints(a.amount);
        const pointsB = calculatePoints(b.amount);
        return pointsB - pointsA;
      })[0];

      // Get the first sale date
      const firstSaleDate = new Date(sortedSales[0].timestamp);
      console.log("First sale date:", firstSaleDate);

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

      // Calculate total points for the first day
      const firstDayPoints = calculateTotalPoints(
        sortedSales.filter(sale => 
          new Date(sale.timestamp).toDateString() === firstSaleDate.toDateString()
        )
      );

      const firstDay = {
        date: firstSaleDate.toISOString(),
        points: firstDayPoints
      };

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
        role: roleData?.role || 'Sales Intern',
        bestDay,
        highestSale: {
          date: highestSingleSale.timestamp,
          points: calculatePoints(highestSingleSale.amount)
        },
        worstDay: firstDay
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
    highestSale: memberData.highestSale,
    worstDay: memberData.worstDay
  };

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{decodeURIComponent(memberData.displayName)}</h1>
        <div className="flex items-center gap-1 text-sm text-primary">
          <Award className="h-4 w-4" />
          <span>{memberData.role}</span>
        </div>
      </div>

      <div className="space-y-4">
        <StaffStats stats={statsData} />
      </div>
    </PageLayout>
  );
};

export default StaffMember;
