
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { TotalPurchase } from "@/types/purchase";
import { PageLayout } from "@/components/PageLayout";
import { StaffStats } from "@/components/staff/StaffStats";
import { SalesChartSection } from "@/components/staff/SalesChartSection";
import { DateFilterSection } from "@/components/staff/DateFilterSection";
import { ShiftsList } from "@/components/staff/ShiftsList";
import { AccumulatedPointsCard } from "@/components/staff/AccumulatedPointsCard";
import { DateRange } from "react-day-picker";

const StaffMember = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TotalPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const decodedName = decodeURIComponent(name || "");
        
        // Check if the staff member exists
        const { data: staffCheck, error: staffError } = await supabase
          .from("staff_roles")
          .select("user_display_name")
          .eq("user_display_name", decodedName);
        
        if (staffError) throw staffError;
        
        if (!staffCheck || staffCheck.length === 0) {
          setError(`Säljaren "${decodedName}" hittades inte.`);
          setLoading(false);
          return;
        }
        
        let query = supabase
          .from("total_purchases")
          .select("*")
          .eq("user_display_name", decodedName)
          .order("timestamp", { ascending: false });
        
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          query = query.gte("timestamp", fromDate.toISOString());
        }
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          query = query.lte("timestamp", toDate.toISOString());
        }
        
        const { data, error: transactionsError } = await query;
        
        if (transactionsError) throw transactionsError;
        
        setTransactions(data || []);
      } catch (err) {
        console.error("Error fetching staff member data:", err);
        setError("Ett fel uppstod när data skulle hämtas. Försök igen senare.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [name, dateRange]);

  if (error) {
    return (
      <PageLayout>
        <div className="text-center my-8">
          <h2 className="text-xl font-semibold mb-4">{error}</h2>
          <button 
            onClick={() => navigate("/staff")}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Tillbaka till säljare
          </button>
        </div>
      </PageLayout>
    );
  }

  const decodedName = decodeURIComponent(name || "");
  const formattedDateRange = dateRange.from && dateRange.to 
    ? `${format(dateRange.from, 'd MMM', { locale: sv })} - ${format(dateRange.to, 'd MMM yyyy', { locale: sv })}`
    : "Alla tider";
    
  // Calculate stats for the StaffStats component
  const calculateStats = () => {
    // Filter out refunded transactions
    const validTransactions = transactions.filter(t => !t.refunded);
    
    // If no valid transactions, return default stats
    if (validTransactions.length === 0) {
      return {
        salesCount: 0,
        averagePoints: 0,
        activeDays: 0,
        firstSaleDate: new Date().toISOString(),
        bestDay: {
          date: new Date().toISOString(),
          points: 0
        },
        highestSale: {
          date: new Date().toISOString(),
          points: 0
        },
        worstDay: {
          date: new Date().toISOString(),
          points: 0
        }
      };
    }
    
    // Group by date to find best/worst day
    const salesByDay = validTransactions.reduce((acc, transaction) => {
      const date = transaction.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          points: 0,
          sales: [],
        };
      }
      
      // Calculate points for this sale (simplified)
      const points = transaction.amount;
      acc[date].points += points;
      acc[date].sales.push(transaction);
      
      return acc;
    }, {} as Record<string, { date: string; points: number; sales: TotalPurchase[] }>);
    
    // Sort days by points to find best/worst
    const sortedDays = Object.values(salesByDay).sort((a, b) => b.points - a.points);
    const bestDay = sortedDays[0] || { date: new Date().toISOString(), points: 0 };
    const worstDay = sortedDays[sortedDays.length - 1] || { date: new Date().toISOString(), points: 0 };
    
    // Find highest single sale
    const highestSale = validTransactions.reduce(
      (highest, transaction) => {
        const points = transaction.amount;
        if (points > highest.points) {
          return { 
            date: transaction.timestamp,
            points
          };
        }
        return highest;
      }, 
      { date: new Date().toISOString(), points: 0 }
    );
    
    // Calculate average points per sale
    const totalPoints = validTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averagePoints = totalPoints / validTransactions.length;
    
    return {
      salesCount: validTransactions.length,
      averagePoints,
      activeDays: Object.keys(salesByDay).length,
      firstSaleDate: validTransactions[validTransactions.length - 1].timestamp,
      bestDay,
      highestSale,
      worstDay
    };
  };
  
  const staffStats = calculateStats();

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold">{decodedName}</h1>
          <DateFilterSection 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AccumulatedPointsCard transactions={transactions} isLoading={loading} />
          <StaffStats stats={staffStats} />
        </div>

        <SalesChartSection
          sales={transactions}
          userName={decodedName}
        />
        
        <ShiftsList 
          shifts={transactions.map(t => ({
            id: t.id,
            presence_start: t.timestamp,
            sales: [t]
          }))}
        />
      </div>
    </PageLayout>
  );
};

export default StaffMember;
