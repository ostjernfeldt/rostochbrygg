import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { sv } from "date-fns/locale";
import { SalesChart } from "@/components/SalesChart";
import { CalendarIcon, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { OverviewStatsGrid } from "@/components/stats/OverviewStatsGrid";
import { PaymentMethodStats } from "@/components/stats/PaymentMethodStats";
import { useLeaderboardDates } from "@/hooks/useLeaderboardDates";
import { LeaderboardFilter } from "@/components/leaderboard/LeaderboardFilter";

export default function Overview() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: parseISO("2024-01-01"),
    to: new Date(),
  });
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Fetch available sales dates
  const { data: salesDates } = useLeaderboardDates();

  // Fetch stats based on selected date or date range
  const { data: stats, isLoading } = useQuery({
    queryKey: ["overview-stats", selectedDate || date?.from, date?.to],
    queryFn: async () => {
      let start, end;

      if (selectedDate) {
        // If a specific date is selected
        start = startOfDay(new Date(selectedDate));
        end = endOfDay(new Date(selectedDate));
      } else if (date?.from) {
        // If using date range
        start = startOfDay(date.from);
        end = endOfDay(date.to || date.from);
      } else {
        return null;
      }

      console.log("Fetching overview stats for period:", { start, end });

      const { data: sales, error } = await supabase
        .from("purchases")
        .select("*")
        .gte("Timestamp", start.toISOString())
        .lte("Timestamp", end.toISOString());

      if (error) throw error;

      // Get unique dates to count selling days
      const uniqueDates = new Set(
        sales.map((sale) => format(new Date(sale.Timestamp), "yyyy-MM-dd"))
      );

      // Get unique sellers
      const uniqueSellers = new Set(
        sales.map((sale) => sale["User Display Name"])
      );

      // Calculate payment method statistics
      const paymentMethods = sales.reduce((acc, sale) => {
        const method = sale["Payment Type"] || "Okänd";
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalSales = sales.length;
      const paymentMethodStats = Object.entries(paymentMethods).map(([method, count]) => ({
        method,
        count,
        percentage: ((count / totalSales) * 100).toFixed(1)
      }));

      const totalAmount = sales.reduce(
        (sum, sale) => sum + (sale.Amount || 0),
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
        paymentMethodStats
      };
    },
  });

  // Create date filter options with a clear option
  const dateFilterOptions = [
    { value: "none", label: "Välj period" },
    ...(salesDates?.map(date => ({
      value: date,
      label: format(new Date(date), 'd MMMM yyyy', { locale: sv })
    })) || [])
  ];

  return (
    <PageLayout>
      <div className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Översikt</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <LeaderboardFilter
              options={dateFilterOptions}
              value={selectedDate || "none"}
              onValueChange={(value) => {
                setSelectedDate(value === "none" ? "" : value);
                // Reset date range when specific date is selected
                if (value !== "none") setDate(undefined);
              }}
              placeholder="Välj säljdag"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full sm:w-auto justify-start text-left font-normal ${selectedDate ? 'opacity-50' : ''}`}
                  disabled={!!selectedDate}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "d MMM y", { locale: sv })} -{" "}
                        {format(date.to, "d MMM y", { locale: sv })}
                      </>
                    ) : (
                      format(date.from, "d MMM y", { locale: sv })
                    )
                  ) : (
                    <span>Välj period</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    // Reset selected specific date when date range is selected
                    if (newDate) setSelectedDate("");
                  }}
                  numberOfMonths={2}
                  locale={sv}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-card"
              ></div>
            ))}
          </div>
        ) : stats ? (
          <>
            <OverviewStatsGrid stats={stats} />
            <PaymentMethodStats stats={stats.paymentMethodStats} />

            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold">Försäljningsutveckling</h2>
              <SalesChart transactions={stats.transactions} groupByWeek={true} />
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">
            Välj en period för att se statistik
          </div>
        )}
      </div>
    </PageLayout>
  );
}