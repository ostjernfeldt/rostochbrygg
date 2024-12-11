import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { sv } from "date-fns/locale";
import { SalesChart } from "@/components/SalesChart";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { DateRange } from "react-day-picker";

export default function Overview() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: parseISO("2024-01-01"),
    to: new Date(),
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["overview-stats", date?.from, date?.to],
    queryFn: async () => {
      if (!date?.from || !date?.to) return null;

      const start = startOfDay(date.from);
      const end = endOfDay(date.to);

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
      };
    },
  });

  return (
    <PageLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Översikt</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
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
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={sv}
              />
            </PopoverContent>
          </Popover>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="stat-card">
                <h3 className="text-gray-400">Total försäljning</h3>
                <div className="mt-2 text-2xl font-bold">
                  SEK {Math.round(stats.totalAmount).toLocaleString()}
                </div>
              </div>

              <div className="stat-card">
                <h3 className="text-gray-400">Antal sälj</h3>
                <div className="mt-2 text-2xl font-bold">
                  {stats.salesCount.toLocaleString()}
                </div>
              </div>

              <div className="stat-card">
                <h3 className="text-gray-400">Snittordervärde</h3>
                <div className="mt-2 text-2xl font-bold">
                  SEK {Math.round(stats.averageValue).toLocaleString()}
                </div>
              </div>

              <div className="stat-card">
                <h3 className="text-gray-400">Antal säljdagar</h3>
                <div className="mt-2 text-2xl font-bold">
                  {stats.sellingDays.toLocaleString()}
                </div>
              </div>

              <div className="stat-card">
                <h3 className="text-gray-400">Antal säljare</h3>
                <div className="mt-2 text-2xl font-bold">
                  {stats.uniqueSellers.toLocaleString()}
                </div>
              </div>

              <div className="stat-card">
                <h3 className="text-gray-400">Snitt per dag</h3>
                <div className="mt-2 text-2xl font-bold">
                  SEK {Math.round(stats.dailyAverage).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold">Försäljningsutveckling</h2>
              <SalesChart transactions={stats.transactions} />
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