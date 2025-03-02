import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processTransactions } from "@/components/transactions/TransactionProcessor";
import { calculatePoints, calculateTotalPoints } from "@/utils/pointsCalculation";
interface ShiftsListProps {
  shifts: any[];
}
export const ShiftsList = ({
  shifts
}: ShiftsListProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  // Fetch shifts data from total_purchases
  const {
    data: shiftsData,
    isLoading
  } = useQuery({
    queryKey: ["shifts", shifts],
    queryFn: async () => {
      console.log("Fetching shifts data from total_purchases...");

      // Get unique dates from shifts
      const shiftDates = shifts.map(shift => {
        const date = new Date(shift.presence_start);
        return format(date, 'yyyy-MM-dd');
      });
      console.log("Shift dates:", shiftDates);

      // For each shift date, fetch the sales data for the specific user
      const shiftsWithSales = await Promise.all(shiftDates.map(async date => {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        // Get the user display name from the first shift
        const userDisplayName = shifts[0].sales[0]?.user_display_name;
        if (!userDisplayName) {
          console.log("No user display name found for shift:", date);
          return {
            id: date,
            presence_start: startDate.toISOString(),
            totalPoints: 0,
            sales: []
          };
        }
        const {
          data: sales,
          error
        } = await supabase.from("total_purchases").select("*").eq("user_display_name", userDisplayName).gte("timestamp", startDate.toISOString()).lte("timestamp", endDate.toISOString()).not("refunded", "eq", true);
        if (error) {
          console.error("Error fetching sales for date:", date, error);
          throw error;
        }
        if (!sales || sales.length === 0) {
          console.log("No sales found for date:", date);
          return {
            id: date,
            presence_start: startDate.toISOString(),
            totalPoints: 0,
            sales: []
          };
        }

        // Process transactions to handle refunds
        const processedSales = processTransactions(sales);
        const validSales = processedSales.filter(sale => !sale.refunded);

        // Calculate total points for the shift
        const totalPoints = calculateTotalPoints(validSales);
        console.log(`Sales for ${date} by ${userDisplayName}:`, {
          salesCount: validSales.length,
          totalPoints,
          validSales
        });
        return {
          id: date,
          presence_start: startDate.toISOString(),
          totalPoints: totalPoints || 0,
          // Ensure we always have a number
          sales: validSales
        };
      }));

      // Sort shifts by date in descending order
      return shiftsWithSales.sort((a, b) => new Date(b.presence_start).getTime() - new Date(a.presence_start).getTime());
    }
  });

  // Use the processed shifts data or the original shifts as fallback
  const sortedShifts = shiftsData || shifts.sort((a, b) => {
    return new Date(b.presence_start).getTime() - new Date(a.presence_start).getTime();
  });
  console.log("Final sorted shifts:", sortedShifts);
  return;
};