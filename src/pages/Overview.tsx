import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { useLeaderboardDates } from "@/hooks/useLeaderboardDates";
import { DateFilterSection } from "@/components/overview/DateFilterSection";
import { StatsSection } from "@/components/overview/StatsSection";

export default function Overview() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all"); // Changed default to "all"
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch available sales dates
  const { data: salesDates } = useLeaderboardDates();

  // Calculate date range based on selected period
  const getDateRange = () => {
    if (selectedPeriod === "day" && selectedDate) {
      const start = startOfDay(new Date(selectedDate));
      const end = endOfDay(new Date(selectedDate));
      return { start, end };
    }

    if (selectedPeriod === "week" && selectedDate) {
      const start = startOfWeek(new Date(selectedDate));
      const end = endOfWeek(start);
      return { start, end };
    }

    if (selectedPeriod === "month" && selectedDate) {
      const [year, month] = selectedDate.split('-').map(Number);
      const start = startOfMonth(new Date(year, month - 1));
      const end = endOfMonth(start);
      return { start, end };
    }

    if (selectedPeriod === "all") {
      const end = new Date();
      const start = new Date(2000, 0, 1); // Start from year 2000
      return { start, end };
    }

    if (selectedPeriod === "custom" && dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = endOfDay(dateRange.to || dateRange.from);
      return { start, end };
    }

    return null;
  };

  // Fetch stats based on selected period
  const { data: stats, isLoading } = useQuery({
    queryKey: ["overview-stats", selectedPeriod, selectedDate, dateRange],
    queryFn: async () => {
      const range = getDateRange();
      if (!range) return null;

      console.log("Fetching overview stats for period:", range);

      const { data: sales, error } = await supabase
        .from("purchases")
        .select("*")
        .gte("Timestamp", range.start.toISOString())
        .lte("Timestamp", range.end.toISOString());

      if (error) throw error;

      // Get unique dates to count selling days
      const uniqueDates = new Set(
        sales.map((sale) => format(new Date(sale.Timestamp), "yyyy-MM-dd"))
      );

      // Get unique sellers
      const uniqueSellers = new Set(
        sales.map((sale) => sale["User Display Name"])
      );

      // Calculate payment method statistics with amounts
      const paymentMethodStats = sales.reduce((acc, sale) => {
        const method = sale["Payment Type"] || "Okänd";
        const amount = Number(sale.Amount) || 0;
        
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 };
        }
        acc[method].count += 1;
        acc[method].amount += amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      const totalSales = sales.length;
      const paymentMethodStatsArray = Object.entries(paymentMethodStats).map(([method, { count, amount }]) => ({
        method,
        count,
        amount: Number(amount),
        percentage: ((count / totalSales) * 100).toFixed(1)
      }));

      console.log("Payment method stats:", paymentMethodStatsArray);

      const totalAmount = sales.reduce(
        (sum, sale) => sum + (Number(sale.Amount) || 0),
        0
      );

      return {
        totalAmount,
        salesCount: sales.length,
        averageValue: sales.length > 0 ? totalAmount / sales.length : 0,
        sellingDays: uniqueDates.size,
        uniqueSellers: uniqueSellers.size,
        dailyAverage: uniqueDates.size > 0 ? totalAmount / uniqueDates.size : 0,
        transactions: sales,
        paymentMethodStats: paymentMethodStatsArray
      };
    },
  });

  return (
    <PageLayout>
      <div className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Översikt</h1>
          </div>
          
          <DateFilterSection
            salesDates={salesDates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
        </div>

        <StatsSection stats={stats} isLoading={isLoading} />
      </div>
    </PageLayout>
  );
}