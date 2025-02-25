
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { processTransactions } from "@/components/transactions/TransactionProcessor";
import { calculatePoints } from "@/utils/pointsCalculation";
import { Trophy, Calendar, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HallOfFame = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["hallOfFame"],
    queryFn: async () => {
      // Fetch all non-refunded sales
      const { data: sales, error } = await supabase
        .from("total_purchases")
        .select("*")
        .not("refunded", "eq", true)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      if (!sales) return null;

      const processedSales = processTransactions(sales);
      const validSales = processedSales.filter(sale => !sale.refunded);

      // 1. Highest single sale
      const sortedBySalePoints = [...validSales].sort((a, b) => {
        const pointsA = calculatePoints(Number(a.amount));
        const pointsB = calculatePoints(Number(b.amount));
        return pointsB - pointsA;
      });

      const topSales = sortedBySalePoints.slice(0, 3).map(sale => ({
        name: sale.user_display_name || 'Okänd',
        points: calculatePoints(Number(sale.amount)),
        date: format(new Date(sale.timestamp), 'd MMMM yyyy', { locale: sv })
      }));

      // 2. Best months
      const monthlyTotals = validSales.reduce((acc: Record<string, any>, sale) => {
        const date = new Date(sale.timestamp);
        const monthKey = format(date, 'yyyy-MM');
        if (!acc[monthKey]) {
          acc[monthKey] = {
            points: 0,
            sellers: {} as Record<string, number>
          };
        }
        const points = calculatePoints(Number(sale.amount));
        acc[monthKey].points += points;
        
        if (sale.user_display_name) {
          if (!acc[monthKey].sellers[sale.user_display_name]) {
            acc[monthKey].sellers[sale.user_display_name] = 0;
          }
          acc[monthKey].sellers[sale.user_display_name] += points;
        }
        
        return acc;
      }, {});

      const topMonths = Object.entries(monthlyTotals)
        .map(([monthKey, data]: [string, any]) => {
          const bestSeller = Object.entries(data.sellers)
            .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)[0];
          
          return {
            month: format(parseISO(monthKey), 'MMMM yyyy', { locale: sv }),
            points: data.points,
            name: bestSeller ? bestSeller[0] : 'Okänd',
            sellerPoints: bestSeller ? bestSeller[1] : 0
          };
        })
        .sort((a, b) => b.sellerPoints - a.sellerPoints)
        .slice(0, 3);

      // 3. Best days
      const dailyTotals = validSales.reduce((acc: Record<string, any>, sale) => {
        const date = new Date(sale.timestamp);
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = {
            points: 0,
            sellers: {} as Record<string, number>
          };
        }
        const points = calculatePoints(Number(sale.amount));
        acc[dateKey].points += points;
        
        if (sale.user_display_name) {
          if (!acc[dateKey].sellers[sale.user_display_name]) {
            acc[dateKey].sellers[sale.user_display_name] = 0;
          }
          acc[dateKey].sellers[sale.user_display_name] += points;
        }
        
        return acc;
      }, {});

      const topDays = Object.entries(dailyTotals)
        .map(([dateKey, data]: [string, any]) => {
          const bestSeller = Object.entries(data.sellers)
            .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)[0];
          
          return {
            date: format(parseISO(dateKey), 'd MMMM yyyy', { locale: sv }),
            points: data.points,
            name: bestSeller ? bestSeller[0] : 'Okänd',
            sellerPoints: bestSeller ? bestSeller[1] : 0
          };
        })
        .sort((a, b) => b.sellerPoints - a.sellerPoints)
        .slice(0, 3);

      return {
        topSales,
        topMonths,
        topDays
      };
    }
  });

  const LeaderboardCard = ({ title, icon: Icon, data, type }: { 
    title: string; 
    icon: any;
    data: { name: string; points: number; date?: string; month?: string }[];
    type: 'sale' | 'month' | 'day';
  }) => (
    <div className="bg-card/50 rounded-xl p-6 border border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div
            key={index}
            onClick={() => item.name !== 'Okänd' && navigate(`/staff/${encodeURIComponent(item.name)}`)}
            className="flex items-center gap-4 p-4 bg-card hover:bg-card/80 rounded-lg cursor-pointer transition-colors"
          >
            <div className={`text-2xl font-bold ${
              index === 0 ? 'text-yellow-500' :
              index === 1 ? 'text-gray-400' :
              'text-amber-700'
            }`}>
              #{index + 1}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">{item.name}</div>
              <div className="text-sm text-gray-400">
                {type === 'sale' && item.date}
                {type === 'month' && item.month}
                {type === 'day' && item.date}
              </div>
            </div>
            <div className="text-cyan-400 font-bold">
              {Math.round(item.points)} p
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading || !data) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[300px] bg-card rounded-xl"/>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 text-transparent bg-clip-text">
          Hall of Fame
        </h1>
        <p className="text-gray-400 mt-2">
          De mest prestigefyllda prestationerna genom tiderna
        </p>
      </div>

      <div className="space-y-6">
        <LeaderboardCard
          title="Högsta enskilda försäljning"
          icon={Trophy}
          data={data.topSales}
          type="sale"
        />
        <LeaderboardCard
          title="Bästa månader"
          icon={Calendar}
          data={data.topMonths}
          type="month"
        />
        <LeaderboardCard
          title="Bästa dagar"
          icon={Sun}
          data={data.topDays}
          type="day"
        />
      </div>
    </PageLayout>
  );
};

export default HallOfFame;
