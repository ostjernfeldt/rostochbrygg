import { Settings, UserRound, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeLeftCard } from "@/components/stats/TimeLeftCard";
import { SalesStats } from "@/components/stats/SalesStats";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { format, startOfDay, endOfDay } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { TotalPurchase } from "@/types/purchase";
import { SellerFilter } from "@/components/filters/SellerFilter";
import { DailyTransactions } from "@/components/transactions/DailyTransactions";

const Home = () => {
  const navigate = useNavigate();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSeller, setSelectedSeller] = useState("all");
  
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useLeaderboardData('daily', formattedDate);

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', formattedDate],
    queryFn: async () => {
      console.log('Fetching transactions for date:', formattedDate);
      const start = startOfDay(new Date(formattedDate));
      const end = endOfDay(new Date(formattedDate));

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

      console.log('Fetched transactions:', data);
      return data as TotalPurchase[];
    },
  });

  // Get unique sellers from transactions
  const activeSellers = Array.from(new Set(transactions.map(t => t.user_display_name).filter(Boolean))) as string[];
  
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
    setSelectedSeller("all"); // Reset seller filter when date changes
    if (date) {
      toast({
        title: "Datum valt",
        description: `Visar data för ${format(date, 'd MMMM yyyy', { locale: sv })}`,
        className: "bg-primary text-white border-none",
        duration: 2000,
      });
    }
  };

  const getLeaderboardTitle = () => {
    if (selectedDate) {
      return `Topplista ${format(selectedDate, 'd MMMM', { locale: sv })}`;
    }
    return "Dagens topplista";
  };

  return (
    <PageLayout>
      <div>
        <div className="flex justify-between items-start mb-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-left">
              Välkommen{username ? ` ${username}` : ''}
            </h1>
            <p className="text-gray-400 text-lg text-left">
              {selectedDate 
                ? `Här kan du se statistiken från ${format(selectedDate, 'd MMMM', { locale: sv })}.`
                : 'Här kan du se statistiken från idag.'}
            </p>
            <button 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 mt-2 text-gray-400 hover:text-primary transition-colors"
            >
              <Settings size={24} />
              <span>Inställningar för dagen</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
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
                  initialFocus
                  className="bg-card rounded-md"
                />
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="mt-2">
                  <UserRound size={24} className="text-white hover:text-primary transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black text-white border-none">
                <DropdownMenuItem onClick={handleSignOut} className="hover:bg-gray-900 focus:bg-gray-900">
                  Logga ut
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TimeLeftCard />
        <SalesStats shouldAnimate={shouldAnimate} selectedDate={formattedDate} />
        
        <div className="mt-8">
          <LeaderboardSection
            title={getLeaderboardTitle()}
            data={leaderboardData?.dailyLeaders}
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
        />
      </div>
    </PageLayout>
  );
};

export default Home;
