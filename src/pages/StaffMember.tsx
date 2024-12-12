import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { StaffStats } from "@/components/staff/StaffStats";
import { SalesChartSection } from "@/components/staff/SalesChartSection";
import { ShiftsList } from "@/components/staff/ShiftsList";

const StaffMember = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  
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
      const { data: shifts, error: presenceError } = await supabase
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
      
      // Process shifts with sales data
      const processedShifts = shifts?.map(shift => {
        const shiftStart = new Date(shift.presence_start);
        const shiftEnd = shift.presence_end ? new Date(shift.presence_end) : new Date();
        
        // Calculate sales during this shift
        const shiftSales = sales.filter(sale => {
          const saleTime = new Date(sale.Timestamp as string);
          return saleTime >= shiftStart && saleTime <= shiftEnd;
        });

        const totalSales = shiftSales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);

        // Find challenge wins for this shift
        const challengeWins = challenges?.filter(challenge => {
          const challengeStart = new Date(challenge.start_date);
          const challengeEnd = new Date(challenge.end_date);
          const shiftDate = new Date(shift.presence_start);
          
          // Set hours to 0 for date comparison
          shiftDate.setHours(0, 0, 0, 0);
          challengeStart.setHours(0, 0, 0, 0);
          challengeEnd.setHours(0, 0, 0, 0);
          
          return shiftDate >= challengeStart && shiftDate <= challengeEnd;
        });

        return {
          ...shift,
          totalSales,
          challengeWins: challengeWins || []
        };
      });

      console.log("Processed shifts:", processedShifts);

      return {
        displayName: name,
        firstSale,
        totalAmount,
        averageAmount,
        salesCount: sales.length,
        daysActive: uniqueDays.size,
        sales,
        shifts: processedShifts || []
      };
    }
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
        <StaffStats memberData={memberData} />
        <SalesChartSection sales={memberData.sales} />
        <ShiftsList shifts={memberData.shifts} />
      </div>
    </PageLayout>
  );
};

export default StaffMember;