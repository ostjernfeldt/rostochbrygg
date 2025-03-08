import { Filter, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SalesStats } from "@/components/stats/SalesStats";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TotalPurchase } from "@/types/purchase";
import { SellerFilter } from "@/components/filters/SellerFilter";
import { DailyTransactions } from "@/components/transactions/DailyTransactions";

const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: allStaff } = useQuery({
    queryKey: ['allStaff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('user_display_name')
        .eq('hidden', false);
      
      if (error) throw error;
      return new Set((data || []).map(s => s.user_display_name));
    }
  });

  const { data: latestDate } = useQuery({
    queryKey: ['latestTransactionDate', allStaff],
    queryFn: async () => {
      const visibleStaffSet = allStaff;
      
      const { data, error } = await supabase
        .from('total_purchases')
        .select('timestamp, user_display_name')
        .not('user_display_name', 'is', null)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const visibleStaffTransactions = data.filter(
        trans => trans.user_display_name && visibleStaffSet.has(trans.user_display_name)
      );
      
      const latestSale = visibleStaffTransactions[0];
      
      if (!latestSale) return new Date();
      
      const date = new Date(latestSale.timestamp);
      if (!selectedDate) {
        setSelectedDate(date);
      }
      return date;
    },
    enabled: !!allStaff
  });
  
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(latestDate || new Date(), 'yyyy-MM-dd');
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useLeaderboardData('daily', formattedDate);

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', formattedDate, allStaff],
    queryFn: async () => {
      console.log('Fetching transactions for date:', formattedDate);
      const start = new Date(formattedDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(formattedDate);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('total_purchases')
        .select('*')
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      const visibleStaffSet = allStaff;
      const filteredTransactions = data.filter(
        trans => trans.user_display_name && visibleStaffSet.has(trans.user_display_name)
      );

      console.log('Fetched visible staff transactions:', filteredTransactions.length);
      return filteredTransactions as TotalPurchase[];
    },
    enabled: !!allStaff
  });

  const activeSellers = Array.from(
    new Set(
      transactions
        .map(t => t.user_display_name)
        .filter(Boolean)
    )
  ) as string[];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username);
      }
    };
    
    getUser();
  }, []);
  
  useEffect(() => {
    const lastRefreshTime = localStorage.getItem('lastRefreshTime');
    const currentTime = Date.now();
    
    if (!lastRefreshTime || currentTime - parseInt(lastRefreshTime) > 1000) {
      setShouldAnimate(true);
      localStorage.setItem('lastRefreshTime', currentTime.toString());
    } else {
      setShouldAnimate(false);
    }

    return () => {
      if (shouldAnimate) {
        setShouldAnimate(false);
      }
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setShouldAnimate(true);
    
    await queryClient.invalidateQueries({ queryKey: ['latestTransactionDate'] });
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['latestSales'] });
    await queryClient.invalidateQueries({ queryKey: ['dailyLeaderboard'] });
    
    toast({
      title: "Uppdaterar statistik",
      description: "Hämtar senaste datan",
      className: "bg-primary text-white border-none rounded-xl shadow-lg",
      duration: 2000,
    });
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const handleSignOut = () => {
    localStorage.removeItem("isAuthenticated");
    toast({
      title: "Utloggad",
      description: "Du har loggats ut",
      className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
      duration: 1000,
    });
    navigate("/login");
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSeller("all");
    if (date) {
      toast({
        title: "Datum valt",
        description: `Visar data för ${format(date, 'd MMMM yyyy', { locale: sv })}`,
        className: "bg-primary text-white border-none",
        duration: 2000,
      });
    }
  };

  const displayDate = selectedDate || latestDate || new Date();

  return (
    <PageLayout>
      <div>
        <div className="flex justify-between items-start mb-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-left">
              Välkommen{username ? ` ${username}` : ''}
            </h1>
            <p className="text-gray-400 text-lg text-left">
              Här kan du se statistiken från {format(displayDate, 'd MMMM', { locale: sv })}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-primary hover:bg-primary/80 border-none rounded-lg"
            >
              <RefreshCw className={`h-4 w-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="bg-primary hover:bg-primary/80 border-none rounded-lg"
                >
                  <Filter className="h-4 w-4 text-white" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-gray-800" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  defaultMonth={displayDate}
                  initialFocus
                  className="bg-card rounded-md"
                />
              </PopoverContent>
            </Popover>
            <Button 
              variant="ghost" 
              onClick={handleSignOut} 
              className="hover:bg-primary/10 transition-colors"
            >
              Logga ut
            </Button>
          </div>
        </div>

        <SalesStats shouldAnimate={shouldAnimate} selectedDate={formattedDate} />
        
        <div className="mt-8">
          <LeaderboardSection
            title={`Topplista ${format(displayDate, 'd MMMM', { locale: sv })}`}
            data={leaderboardData?.dailyLeaders || []}
            isLoading={isLeaderboardLoading}
            onUserClick={(userName) => navigate(`/staff/${encodeURIComponent(userName)}`)}
          />
        </div>

        {activeSellers.length > 0 && (
          <div className="mt-8">
            <SellerFilter
              sellers={activeSellers}
              selectedSeller={selectedSeller}
              onSellerChange={setSelectedSeller}
            />
          </div>
        )}

        <DailyTransactions
          transactions={transactions}
          isLoading={isTransactionsLoading}
          selectedSeller={selectedSeller}
          selectedDate={selectedDate}
        />
      </div>
    </PageLayout>
  );
};

export default Home;
