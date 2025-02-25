import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { processTransactions } from "@/components/transactions/TransactionProcessor";
import { calculateTotalPoints } from "@/utils/pointsCalculation";
import { Trophy, Calendar, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopSeller {
  name: string;
  points: number;
  date?: string;
  month?: string;
}

const HallOfFame = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["hallOfFame"],
    queryFn: async () => {
      // Fetch visible staff members first
      const { data: visibleStaff, error: staffError } = await supabase
        .from("staff_roles")
        .select("user_display_name")
        .eq("hidden", false);

      if (staffError) throw staffError;

      const visibleStaffNames = new Set(visibleStaff.map(s => s.user_display_name));

      // Fetch all non-refunded sales
      const { data: sales, error } = await supabase
        .from("total_purchases")
        .select("*")
        .not("refunded", "eq", true)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      if (!sales) return null;

      const processedSales = processTransactions(sales)
        .filter(sale => 
          sale.user_display_name && 
          visibleStaffNames.has(sale.user_display_name) && 
          !sale.refunded
        );

      // 1. Highest single sales (using calculateTotalPoints)
      const sortedBySalePoints = [...processedSales].sort((a, b) => {
        const pointsA = calculateTotalPoints([a]);
        const pointsB = calculateTotalPoints([b]);
        return pointsB - pointsA;
      });

      const topSales = sortedBySalePoints.slice(0, 3).map(sale => ({
        name: sale.user_display_name || 'Okänd',
        points: calculateTotalPoints([sale]),
        date: format(new Date(sale.timestamp), 'd MMMM yyyy', { locale: sv })
      }));

      // 2. Best months (using calculateTotalPoints)
      const monthlyTotals = processedSales.reduce((acc, sale) => {
        const monthKey = format(new Date(sale.timestamp), 'yyyy-MM');
        if (!acc[monthKey]) {
          acc[monthKey] = {
            sellers: {},
            totalPoints: 0
          };
        }
        
        const sellerName = sale.user_display_name || 'Okänd';
        if (!acc[monthKey].sellers[sellerName]) {
          acc[monthKey].sellers[sellerName] = [];
        }
        acc[monthKey].sellers[sellerName].push(sale);
        
        return acc;
      }, {} as Record<string, { sellers: Record<string, typeof processedSales>, totalPoints: number }>);

      const topMonths = Object.entries(monthlyTotals)
        .map(([monthKey, data]) => {
          const bestSeller = Object.entries(data.sellers)
            .map(([name, sales]) => ({
              name,
              points: calculateTotalPoints(sales)
            }))
            .sort((a, b) => b.points - a.points)[0];
          
          return {
            month: format(parseISO(monthKey), 'MMMM yyyy', { locale: sv }),
            points: bestSeller.points,
            name: bestSeller.name
          };
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);

      // 3. Best days (using calculateTotalPoints)
      const dailyTotals = processedSales.reduce((acc, sale) => {
        const dateKey = format(new Date(sale.timestamp), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = {
            sellers: {},
            totalPoints: 0
          };
        }
        
        const sellerName = sale.user_display_name || 'Okänd';
        if (!acc[dateKey].sellers[sellerName]) {
          acc[dateKey].sellers[sellerName] = [];
        }
        acc[dateKey].sellers[sellerName].push(sale);
        
        return acc;
      }, {} as Record<string, { sellers: Record<string, typeof processedSales>, totalPoints: number }>);

      const topDays = Object.entries(dailyTotals)
        .map(([dateKey, data]) => {
          const bestSeller = Object.entries(data.sellers)
            .map(([name, sales]) => ({
              name,
              points: calculateTotalPoints(sales)
            }))
            .sort((a, b) => b.points - a.points)[0];
          
          return {
            date: format(parseISO(dateKey), 'd MMMM yyyy', { locale: sv }),
            points: bestSeller.points,
            name: bestSeller.name
          };
        })
        .sort((a, b) => b.points - a.points)
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
    data: TopSeller[];
    type: 'sale' | 'month' | 'day';
  }) => (
    <div className="bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl rounded-xl p-6 border border-primary/20 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all duration-300 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div
            key={index}
            onClick={() => item.name !== 'Okänd' && navigate(`/staff/${encodeURIComponent(item.name)}`)}
            className="group flex items-center gap-4 p-4 bg-gradient-to-r from-card to-card/80 hover:from-card/80 hover:to-card/60 rounded-xl cursor-pointer transition-all duration-300 border border-white/5 hover:border-primary/20"
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
              index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-500' :
              index === 1 ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 text-gray-400' :
              'bg-gradient-to-br from-amber-700/20 to-amber-800/20 text-amber-700'
            } font-bold text-2xl transition-transform group-hover:scale-110`}>
              #{index + 1}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-lg text-white group-hover:text-primary transition-colors">
                {item.name}
              </div>
              <div className="text-sm text-gray-400">
                {type === 'sale' && item.date}
                {type === 'month' && item.month}
                {type === 'day' && item.date}
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent text-xl font-bold group-hover:scale-110 transition-transform">
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
            <div key={i} className="h-[300px] bg-gradient-to-br from-card/90 to-card/50 rounded-xl"/>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="relative mb-12 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-cyan-400/20 to-primary/20 blur-3xl opacity-30" />
        <h1 className="relative text-4xl font-bold bg-gradient-to-r from-primary via-cyan-400 to-primary text-transparent bg-clip-text mb-3 animate-fade-in">
          Hall of Fame
        </h1>
        <p className="relative text-lg text-gray-400 mt-2 animate-fade-in">
          De mest prestigefyllda prestationerna genom tiderna
        </p>
      </div>

      <div className="space-y-8 max-w-3xl mx-auto">
        <LeaderboardCard
          title="Högsta sälj"
          icon={Trophy}
          data={data.topSales}
          type="sale"
        />
        <LeaderboardCard
          title="Bästa månad"
          icon={Calendar}
          data={data.topMonths}
          type="month"
        />
        <LeaderboardCard
          title="Bästa dag"
          icon={Sun}
          data={data.topDays}
          type="day"
        />
      </div>
    </PageLayout>
  );
};

export default HallOfFame;
