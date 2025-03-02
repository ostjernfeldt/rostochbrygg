
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
      // Filtrera bort alla återbetalade köp för statistikberäkningar
      const validSales = processedSales.filter(sale => !sale.refunded);

      // Sort sales by timestamp for consistent date handling
      const sortedSales = [...validSales].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Find highest single sale by calculating total points for each individual sale
      // Exkludera återbetalade köp från högsta sälj beräkningen
      const highestSingleSale = [...validSales].sort((a, b) => {
        const pointsA = calculateTotalPoints([a]);
        const pointsB = calculateTotalPoints([b]);
        return pointsB - pointsA;
      })[0];

      // Get the first sale date
      const firstSaleDate = new Date(sortedSales[0].timestamp);
      console.log("First sale date:", firstSaleDate);

      // Group sales by date for daily totals, exkludera återbetalade köp
      const salesByDate = sortedSales.reduce((acc: { [key: string]: TotalPurchase[] }, sale) => {
        const dateStr = new Date(sale.timestamp).toDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(sale);
        return acc;
      }, {});

      // Calculate daily totals using calculateTotalPoints for consistency
      const dailyTotals = Object.entries(salesByDate).map(([dateStr, dateSales]) => ({
        date: new Date(dateStr).toISOString(),
        points: calculateTotalPoints(dateSales)
      }));

      // Sort days by points for best day
      const sortedDays = [...dailyTotals].sort((a, b) => b.points - a.points);
      const bestDay = sortedDays[0];

      // Calculate first day points using calculateTotalPoints
      const firstDayPoints = calculateTotalPoints(salesByDate[firstSaleDate.toDateString()]);

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
        role: roleData?.role || 'Sales Intern', // Add the role property here
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
        highestSale: {
          date: highestSingleSale.timestamp,
          points: calculateTotalPoints([highestSingleSale])
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

  const decodedName = decodeURIComponent(memberData.displayName);

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{decodedName}</h1>
        <div className="flex items-center gap-1 text-sm text-primary">
          <Award className="h-4 w-4" />
          <span>{memberData.role}</span>
        </div>
      </div>

      <div className="space-y-4">
        <StaffStats stats={statsData} userDisplayName={decodedName} />
      </div>
    </PageLayout>
  );
};

export default StaffMember;
