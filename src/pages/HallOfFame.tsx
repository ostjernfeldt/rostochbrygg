import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { calculateTotalPoints } from "@/utils/pointsCalculation";
import { Trophy, Calendar, Sun, List, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { TotalPurchase } from "@/types/purchase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ManualHallOfFameEntry } from "@/types/hallOfFame";

interface TopSeller {
  name: string;
  points: number;
  date?: string;
  month?: string;
  transaction?: TotalPurchase;
  isManual?: boolean;
  description?: string;
}

const HallOfFame = () => {
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState<TotalPurchase | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["hallOfFame"],
    queryFn: async () => {
      const { data: allStaff, error: staffError } = await supabase
        .from("staff_roles")
        .select("user_display_name, hidden");

      if (staffError) throw staffError;

      const hiddenStaffMap = new Map<string, boolean>();
      allStaff.forEach(staff => {
        hiddenStaffMap.set(staff.user_display_name, staff.hidden);
      });

      const { data: sales, error } = await supabase
        .from("total_purchases")
        .select("*")
        .not("refunded", "eq", true);

      if (error) throw error;
      
      const { data: manualEntries, error: manualError } = await supabase
        .from("hall_of_fame_manual")
        .select("*");
        
      if (manualError) throw manualError;
      
      const manualTopSales = (manualEntries || [])
        .filter((entry: ManualHallOfFameEntry) => {
          return entry.category === 'sale' && !hiddenStaffMap.get(entry.user_display_name);
        })
        .map((entry: ManualHallOfFameEntry) => ({
          name: entry.user_display_name,
          points: Number(entry.points),
          date: entry.date ? format(new Date(entry.date), 'd MMMM yyyy', { locale: sv }) : undefined,
          isManual: true,
          description: entry.description
        }));
        
      const manualTopDays = (manualEntries || [])
        .filter((entry: ManualHallOfFameEntry) => {
          return entry.category === 'day' && !hiddenStaffMap.get(entry.user_display_name);
        })
        .map((entry: ManualHallOfFameEntry) => ({
          name: entry.user_display_name,
          points: Number(entry.points),
          date: entry.date ? format(new Date(entry.date), 'd MMMM yyyy', { locale: sv }) : undefined,
          isManual: true,
          description: entry.description
        }));
        
      const manualTopMonths = (manualEntries || [])
        .filter((entry: ManualHallOfFameEntry) => {
          return entry.category === 'month' && !hiddenStaffMap.get(entry.user_display_name);
        })
        .map((entry: ManualHallOfFameEntry) => ({
          name: entry.user_display_name,
          points: Number(entry.points),
          month: entry.month,
          isManual: true,
          description: entry.description
        }));

      if (!sales) return { 
        topSales: manualTopSales,
        topDays: manualTopDays,
        topMonths: manualTopMonths
      };

      const visibleSales = sales.filter(sale => {
        return sale.user_display_name && !hiddenStaffMap.get(sale.user_display_name);
      });

      const getUniqueTopSellers = (sellers: TopSeller[], limit: number = 3): TopSeller[] => {
        const sortedSellers = [...sellers].sort((a, b) => b.points - a.points);
        
        const bestSellerMap = new Map<string, TopSeller>();
        
        const normalizeName = (name: string): string => {
          return name.toLowerCase()
                     .trim()
                     .replace(/\s+/g, ' ')
                     .replace(/[^\w\s]/gi, '');
        };
        
        for (const seller of sortedSellers) {
          const normalizedCurrentName = normalizeName(seller.name);
          
          let existingSeller: TopSeller | undefined;
          let existingKey: string | undefined;
          
          for (const [key, value] of bestSellerMap.entries()) {
            if (normalizeName(value.name) === normalizedCurrentName) {
              existingSeller = value;
              existingKey = key;
              break;
            }
          }
          
          if (!existingSeller || seller.points > existingSeller.points) {
            if (existingKey) {
              bestSellerMap.delete(existingKey);
            }
            bestSellerMap.set(seller.name, seller);
          }
        }
        
        return Array.from(bestSellerMap.values())
          .sort((a, b) => b.points - a.points)
          .slice(0, limit);
      };

      const mergeEntries = (automatic: TopSeller[], manual: TopSeller[]): TopSeller[] => {
        const allEntries = [...automatic, ...manual];
        return getUniqueTopSellers(allEntries);
      };

      const allSalesByPoints = visibleSales
        .filter(sale => sale.amount > 0)
        .map(sale => ({
          name: sale.user_display_name || 'Okänd',
          points: calculateTotalPoints([sale]),
          date: format(new Date(sale.timestamp), 'd MMMM yyyy', { locale: sv }),
          transaction: sale,
          isManual: false
        }))
        .sort((a, b) => b.points - a.points);

      const topSales = getUniqueTopSellers(mergeEntries(allSalesByPoints, manualTopSales));

      const monthlyTotals = visibleSales
        .filter(sale => sale.amount > 0)
        .reduce((acc, sale) => {
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
        }, {} as Record<string, { sellers: Record<string, TotalPurchase[]>, totalPoints: number }>);

      const allMonthlyTopSellers = Object.entries(monthlyTotals)
        .flatMap(([monthKey, data]) => 
          Object.entries(data.sellers).map(([name, sales]) => ({
            name,
            points: calculateTotalPoints(sales),
            month: format(parseISO(monthKey), 'MMMM yyyy', { locale: sv }),
            isManual: false
          }))
        )
        .sort((a, b) => b.points - a.points);

      const topMonths = getUniqueTopSellers(mergeEntries(allMonthlyTopSellers, manualTopMonths));

      const dailyTotals = visibleSales
        .filter(sale => sale.amount > 0)
        .reduce((acc, sale) => {
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
        }, {} as Record<string, { sellers: Record<string, TotalPurchase[]>, totalPoints: number }>);

      const allDailyTopSellers = Object.entries(dailyTotals)
        .flatMap(([dateKey, data]) => 
          Object.entries(data.sellers).map(([name, sales]) => ({
            name,
            points: calculateTotalPoints(sales),
            date: format(parseISO(dateKey), 'd MMMM yyyy', { locale: sv }),
            isManual: false
          }))
        )
        .sort((a, b) => b.points - a.points);

      const topDays = getUniqueTopSellers(mergeEntries(allDailyTopSellers, manualTopDays));

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
            onClick={() => {
              if (type === 'sale' && item.transaction) {
                setSelectedTransaction(item.transaction);
              }
            }}
            className={`group flex items-center gap-4 p-4 bg-gradient-to-r from-card to-card/80 ${
              type === 'sale' && item.transaction ? 'hover:from-card/80 hover:to-card/60 cursor-pointer' : ''
            } rounded-xl transition-all duration-300 border border-white/5 ${
              type === 'sale' && item.transaction ? 'hover:border-primary/20' : ''
            }`}
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
              index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-500' :
              index === 1 ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 text-gray-400' :
              'bg-gradient-to-br from-amber-700/20 to-amber-800/20 text-amber-700'
            } font-bold text-2xl ${type === 'sale' && item.transaction ? 'transition-transform group-hover:scale-110' : ''}`}>
              #{index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <div className={`font-semibold text-lg text-white ${
                  type === 'sale' && item.transaction ? 'group-hover:text-primary transition-colors' : ''
                }`}>
                  {item.name}
                </div>
                {item.isManual && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Manuellt tillagd prestation</p>
                        {item.description && <p className="text-xs opacity-80 mt-1">{item.description}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {type === 'sale' && item.date}
                {type === 'month' && item.month}
                {type === 'day' && item.date}
              </div>
            </div>
            <div className={`bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent text-xl font-bold ${
              type === 'sale' && item.transaction ? 'transition-transform group-hover:scale-110' : ''
            }`}>
              {Math.round(item.points)} p
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TransactionDialog = () => {
    if (!selectedTransaction) return null;

    return (
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Transaktionsdetaljer
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              {format(new Date(selectedTransaction.timestamp), "yyyy-MM-dd HH:mm")}
            </div>
            
            {selectedTransaction.products && Array.isArray(selectedTransaction.products) ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Produkter:</h3>
                {selectedTransaction.products.map((product, index) => (
                  <div key={index} className="bg-card p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-400">Antal: {product.quantity}</div>
                      </div>
                      <div className="text-primary font-semibold">
                        {Math.round(calculateTotalPoints([{ ...selectedTransaction, products: [product] }]))} poäng
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold">Totalt:</span>
                  <span className="text-lg font-bold text-primary">
                    {Math.round(calculateTotalPoints([selectedTransaction]))} poäng
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                Inga produktdetaljer tillgängliga
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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
          data={data?.topSales || []}
          type="sale"
        />
        <LeaderboardCard
          title="Bästa dag"
          icon={Sun}
          data={data?.topDays || []}
          type="day"
        />
        <LeaderboardCard
          title="Bästa månad"
          icon={Calendar}
          data={data?.topMonths || []}
          type="month"
        />
      </div>

      <TransactionDialog />
    </PageLayout>
  );
};

export default HallOfFame;

