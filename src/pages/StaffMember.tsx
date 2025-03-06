
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Award } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { StaffStats } from "@/components/staff/StaffStats";
import { StaffMemberStats, TotalPurchase } from "@/types/purchase";
import { processTransactions } from "@/components/transactions/TransactionProcessor";
import { calculatePoints, calculateTotalPoints } from "@/utils/pointsCalculation";
import { useEffect } from "react";

const StaffMember = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  
  const { data: memberData, isLoading } = useQuery({
    queryKey: ["staffMember", name],
    queryFn: async () => {
      console.log("Fetching staff member data for:", name);
      
      if (!name) throw new Error("No name provided");
      
      // Fetch role data - without checking if hidden
      const { data: roleData, error: roleError } = await supabase
        .from("staff_roles")
        .select("role")
        .eq("user_display_name", decodeURIComponent(name))
        .single();

      if (roleError) {
        console.error("Error fetching role:", roleError);
      }

      // Fetch historical points data
      const { data: historicalPointsData, error: historicalPointsError } = await supabase
        .from("staff_historical_points")
        .select("points")
        .eq("user_display_name", decodeURIComponent(name))
        .single();

      if (historicalPointsError && historicalPointsError.code !== 'PGRST116') {
        console.error("Error fetching historical points:", historicalPointsError);
      }

      const historicalPoints = historicalPointsData?.points || 0;

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from("total_purchases")
        .select("*")
        .eq("user_display_name", decodeURIComponent(name))
        .order("timestamp", { ascending: true })
        .not("refunded", "eq", true);

      if (salesError) {
        console.error("Error fetching sales:", salesError);
      }

      console.log(`Fetched ${sales?.length || 0} sales for ${name}`);

      // Initialize default values for a staff member without sales
      let validSales: TotalPurchase[] = [];
      let firstSaleDate = null;
      let totalAmount = 0;
      let totalPoints = 0;
      let averageAmount = 0;
      let averagePoints = 0;
      let salesCount = 0;
      let daysActive = 0;
      let bestDay = { date: new Date().toISOString(), points: 0 };
      let highestSingleSale = { date: new Date().toISOString(), points: 0 };
      let worstDay = { date: new Date().toISOString(), points: 0 };

      // Process sales data if it exists
      if (sales && sales.length > 0) {
        // Process transactions to handle refunds
        const processedSales = processTransactions(sales);
        // Filter out all refunded purchases for statistics calculations
        validSales = processedSales.filter(sale => !sale.refunded);

        if (validSales.length > 0) {
          // Sort sales by timestamp for consistent date handling
          const sortedSales = [...validSales].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          // Find highest single sale by calculating total points for each individual sale
          const highestSale = [...validSales].sort((a, b) => {
            const pointsA = calculateTotalPoints([a]);
            const pointsB = calculateTotalPoints([b]);
            return pointsB - pointsA;
          })[0];

          // Get the first sale date
          firstSaleDate = new Date(sortedSales[0].timestamp);
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

          // Calculate daily totals using calculateTotalPoints for consistency
          const dailyTotals = Object.entries(salesByDate).map(([dateStr, dateSales]) => ({
            date: new Date(dateStr).toISOString(),
            points: calculateTotalPoints(dateSales)
          }));

          // Sort days by points for best day
          const sortedDays = [...dailyTotals].sort((a, b) => b.points - a.points);
          bestDay = sortedDays[0];

          // Calculate first day points using calculateTotalPoints
          const firstDayPoints = calculateTotalPoints(salesByDate[firstSaleDate.toDateString()]);

          worstDay = {
            date: firstSaleDate.toISOString(),
            points: firstDayPoints
          };

          totalAmount = validSales.reduce((sum, sale) => sum + Number(sale.amount), 0);
          totalPoints = calculateTotalPoints(validSales);
          averageAmount = totalAmount / validSales.length;
          averagePoints = totalPoints / validSales.length;
          salesCount = validSales.length;
          const uniqueDays = new Set(validSales.map(s => new Date(s.timestamp).toDateString()));
          daysActive = uniqueDays.size;
          
          highestSingleSale = {
            date: highestSale.timestamp,
            points: calculateTotalPoints([highestSale])
          };
        }
      }

      const memberStats: StaffMemberStats = {
        displayName: name,
        role: roleData?.role || 'Sales Intern',
        firstSale: firstSaleDate,
        totalAmount,
        averageAmount,
        totalPoints,
        averagePoints,
        salesCount,
        daysActive,
        sales: validSales,
        // Add the historical points
        historicalPoints: historicalPoints
      };

      return {
        ...memberStats,
        bestDay,
        highestSale: highestSingleSale,
        worstDay
      };
    },
    staleTime: 1000 * 60 * 5, // Add stale time to prevent unnecessary refetches
    retry: 3 // Add retry to handle network issues
  });

  // Add debug logging
  useEffect(() => {
    if (memberData) {
      console.log("Staff member data loaded:", memberData.displayName);
    }
  }, [memberData]);

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
    firstSaleDate: memberData.firstSale ? memberData.firstSale.toISOString() : null,
    bestDay: memberData.bestDay,
    highestSale: memberData.highestSale,
    worstDay: memberData.worstDay,
    historicalPoints: memberData.historicalPoints || 0
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
