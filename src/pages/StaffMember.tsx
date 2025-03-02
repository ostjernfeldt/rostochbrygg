
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

const StaffMember = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TotalPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

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

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold">{decodedName}</h1>
          <DateFilterSection dateRange={dateRange} setDateRange={setDateRange} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AccumulatedPointsCard transactions={transactions} isLoading={loading} />
          <StaffStats transactions={transactions} isLoading={loading} />
        </div>

        <SalesChartSection
          title={`Säljstatistik: ${formattedDateRange}`} 
          transactions={transactions}
          isLoading={loading}
        />
        
        <ShiftsList 
          transactions={transactions} 
          isLoading={loading}
        />
      </div>
    </PageLayout>
  );
};

export default StaffMember;
