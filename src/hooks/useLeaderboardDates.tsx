
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
        
        // Get all sales - we won't filter by staff visibility here
        // This change allows regular users to see all sales dates
        const { data, error } = await supabase
          .from("total_purchases")
          .select("timestamp")
          .eq('refunded', false)
          .order("timestamp", { ascending: false });

        if (error) {
          console.error("Error fetching sales data:", error);
          throw error;
        }

        console.log(`Found ${data.length} total non-refunded sales`);

        // Extract unique dates from sales
        const uniqueDates = [...new Set(
          data.map(sale => format(new Date(sale.timestamp), 'yyyy-MM-dd'))
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
