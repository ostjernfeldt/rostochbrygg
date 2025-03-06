
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export const useLeaderboardDates = (onDatesLoaded?: (dates: string[]) => void) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["salesDates"],
    queryFn: async () => {
      console.log("Fetching dates with sales activity from total_purchases...");
      
      try {
        // First check if there are any staff members
        const { data: staffMembers, error: staffError } = await supabase
          .from("staff_roles")
          .select("user_display_name")
          .eq("hidden", false);

        if (staffError) {
          console.error("Error fetching staff members:", staffError);
          throw staffError;
        }

        if (!staffMembers || staffMembers.length === 0) {
          console.log("No staff members found in staff_roles table");
          if (onDatesLoaded) {
            onDatesLoaded([]);
          }
          return [];
        }

        const visibleStaffNames = new Set(staffMembers.map(s => s.user_display_name));
        console.log(`Found ${visibleStaffNames.size} visible staff members`);
        
        // First check if there are any sales
        const { count, error: countError } = await supabase
          .from("total_purchases")
          .select("*", { count: 'exact', head: true });
        
        if (countError) {
          console.error("Error counting sales:", countError);
          throw countError;
        }
        
        console.log(`Total sales count: ${count}`);
        
        // If no sales exist, return empty dates array and let onDatesLoaded handle it
        if (count === 0) {
          console.log("No sales found at all");
          if (onDatesLoaded) {
            onDatesLoaded([]);
          }
          return [];
        }
        
        // Get all non-refunded sales for visible staff members
        const { data, error } = await supabase
          .from("total_purchases")
          .select("timestamp, user_display_name")
          .eq('refunded', false)
          .not("user_display_name", "is", null)
          .order("timestamp", { ascending: false });

        if (error) {
          console.error("Error fetching sales data:", error);
          throw error;
        }

        // Filter for visible staff members
        const visibleSales = data.filter(sale => 
          sale.user_display_name && 
          visibleStaffNames.has(sale.user_display_name)
        );

        console.log(`Found ${data.length} total non-refunded sales, ${visibleSales.length} from visible staff`);

        // Extract unique dates from visible sales
        const uniqueDates = [...new Set(
          visibleSales.map(sale => format(new Date(sale.timestamp), 'yyyy-MM-dd'))
        )].sort().reverse();

        console.log("Found valid sales dates:", uniqueDates);
        
        // Call the callback with the loaded dates
        if (onDatesLoaded) {
          onDatesLoaded(uniqueDates);
        }
        
        return uniqueDates;
      } catch (error) {
        console.error("Error in useLeaderboardDates:", error);
        toast({
          variant: "destructive",
          title: "Kunde inte hämta försäljningsdatum",
          description: "Ett fel uppstod när försäljningsdatum skulle hämtas."
        });
        
        if (onDatesLoaded) {
          onDatesLoaded([]);
        }
        
        return [];
      }
    }
  });
};
