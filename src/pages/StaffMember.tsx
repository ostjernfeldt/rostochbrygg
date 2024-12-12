import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { PageLayout } from "@/components/PageLayout";
import { DateFilterSection } from "@/components/overview/DateFilterSection";
import { DateRange } from "react-day-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy } from "lucide-react";
import { useState } from "react";

const StaffMember = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const { data: memberData, isLoading } = useQuery({
    queryKey: ["staffMember", name],
    queryFn: async () => {
      console.log("Fetching staff member data for:", name);
      
      if (!name) throw new Error("No name provided");
      
      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from("purchases")
        .select("*")
        .eq("User Display Name", decodeURIComponent(name))
        .order("Timestamp", { ascending: true });

      if (salesError) throw salesError;

      // Fetch presence data
      const { data: presence, error: presenceError } = await supabase
        .from("user_presence")
        .select("*")
        .eq("user_display_name", decodeURIComponent(name))
        .order("presence_start", { ascending: false });

      if (presenceError) throw presenceError;

      // Fetch challenges data
      const { data: challenges, error: challengesError } = await supabase
        .from("challenges")
        .select("*");

      if (challengesError) throw challengesError;

      if (!sales || sales.length === 0) return null;

      const firstSale = new Date(sales[0].Timestamp as string);
      const totalAmount = sales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
      const averageAmount = totalAmount / sales.length;
      
      // Calculate unique active days
      const uniqueDays = new Set(sales.map(s => new Date(s.Timestamp as string).toDateString()));
      
      // Process presence data with challenge wins
      const processedPresence = presence?.map(shift => {
        const shiftStart = new Date(shift.presence_start);
        const shiftEnd = shift.presence_end ? new Date(shift.presence_end) : null;
        
        // Calculate sales during this shift
        const shiftSales = sales.filter(sale => {
          const saleTime = new Date(sale.Timestamp as string);
          return shiftEnd 
            ? isWithinInterval(saleTime, { start: shiftStart, end: shiftEnd })
            : saleTime >= shiftStart;
        });

        const totalSales = shiftSales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);

        // Find challenge wins for this shift
        const challengeWins = challenges?.filter(challenge => {
          const challengeStart = new Date(challenge.start_date);
          const challengeEnd = new Date(challenge.end_date);
          return shiftStart >= challengeStart && shiftStart <= challengeEnd;
        });

        return {
          ...shift,
          totalSales,
          challengeWins
        };
      });

      return {
        displayName: name,
        firstSale,
        totalAmount,
        averageAmount,
        salesCount: sales.length,
        daysActive: uniqueDays.size,
        sales,
        presence: processedPresence
      };
    }
  });

  // Filter presence data based on selected period
  const filteredPresence = memberData?.presence?.filter(shift => {
    const shiftDate = new Date(shift.presence_start);

    if (selectedPeriod === "week" && selectedDate) {
      const weekStart = startOfWeek(new Date(selectedDate), { locale: sv });
      const weekEnd = endOfWeek(new Date(selectedDate), { locale: sv });
      return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
    }

    if (selectedPeriod === "month" && selectedDate) {
      const monthStart = startOfMonth(new Date(selectedDate));
      const monthEnd = endOfMonth(new Date(selectedDate));
      return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
    }

    if (selectedPeriod === "custom" && dateRange?.from) {
      const start = startOfWeek(dateRange.from, { locale: sv });
      const end = dateRange.to ? endOfWeek(dateRange.to, { locale: sv }) : new Date();
      return isWithinInterval(shiftDate, { start, end });
    }

    return true; // Show all if no filter is applied
  });

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
        <button 
          onClick={() => navigate("/staff")}
          className="text-gray-400 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center text-gray-400">
          Ingen data hittades för denna säljare
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => navigate("/staff")}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">{decodeURIComponent(memberData.displayName)}</h1>
      </div>

      <div className="space-y-4">
        <div className="stat-card">
          <h3 className="text-gray-400 mb-2">Total försäljning</h3>
          <div className="text-4xl font-bold">
            SEK {Math.round(memberData.totalAmount).toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card">
            <h3 className="text-gray-400 mb-2">Antal sälj</h3>
            <div className="text-3xl font-bold">{memberData.salesCount}</div>
          </div>
          
          <div className="stat-card">
            <h3 className="text-gray-400 mb-2">Snittordervärde</h3>
            <div className="text-3xl font-bold">
              SEK {Math.round(memberData.averageAmount).toLocaleString()}
            </div>
          </div>
          
          <div className="stat-card">
            <h3 className="text-gray-400 mb-2">Aktiva dagar</h3>
            <div className="text-3xl font-bold">{memberData.daysActive}</div>
          </div>
          
          <div className="stat-card">
            <h3 className="text-gray-400 mb-2">Första sälj</h3>
            <div className="text-3xl font-bold">
              {format(memberData.firstSale, 'yyyy-MM-dd')}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="text-gray-400 mb-4">Försäljning över tid</h3>
          <SalesChart transactions={memberData.sales} />
        </div>

        <div className="stat-card">
          <h3 className="text-gray-400 mb-4">Säljpass</h3>
          <DateFilterSection
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
          
          <ScrollArea className="h-[400px] mt-4">
            <div className="space-y-4">
              {filteredPresence?.map((shift) => (
                <div 
                  key={shift.id} 
                  className="p-4 bg-card/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold">
                        {format(new Date(shift.presence_start), 'EEEE d MMMM', { locale: sv })}
                      </div>
                      <div className="text-gray-400">
                        {format(new Date(shift.presence_start), 'HH:mm')} - 
                        {shift.presence_end 
                          ? format(new Date(shift.presence_end), ' HH:mm')
                          : ' Pågående'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">SEK {Math.round(shift.totalSales).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {shift.challengeWins && shift.challengeWins.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-500">
                        Vann {shift.challengeWins.length} tävling{shift.challengeWins.length > 1 ? 'ar' : ''} denna dag
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </PageLayout>
  );
};

export default StaffMember;