
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useLeaderboardDates = (onDatesLoaded?: (dates: string[]) => void) => {
  return useQuery({
    queryKey: ["salesDates"],
    queryFn: async () => {
      console.log("Fetching dates with sales activity from total_purchases...");
      
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
      
      // First get visible staff members
      const { data: visibleStaff, error: staffError } = await supabase
        .from("staff_roles")
        .select("user_display_name")
        .eq("hidden", false);

      if (staffError) {
        console.error("Error fetching visible staff:", staffError);
        throw staffError;
      }

      console.log(`Found ${visibleStaff.length} visible staff members`);
      const visibleStaffNames = new Set(visibleStaff.map(s => s.user_display_name));

      // Get all sales
      const { data, error } = await supabase
        .from("total_purchases")
        .select("timestamp, user_display_name")
        .eq('refunded', false)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching sales data:", error);
        throw error;
      }

      console.log(`Found ${data.length} total non-refunded sales`);

      // Group sales by date and filter days where all sellers are hidden
      const salesByDate = data.reduce((acc: { [key: string]: Set<string> }, sale) => {
        const date = format(new Date(sale.timestamp), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = new Set();
        }
        if (sale.user_display_name) {
          acc[date].add(sale.user_display_name);
        }
        return acc;
      }, {});

      // Only keep dates that have at least one visible seller
      const validDates = Object.entries(salesByDate)
        .filter(([_, sellers]) => {
          // Check if at least one seller from this day is visible
          return Array.from(sellers).some(seller => visibleStaffNames.has(seller));
        })
        .map(([date]) => date);

      console.log("Found valid sales dates:", validDates);
      
      // Call the callback with the loaded dates
      if (onDatesLoaded) {
        onDatesLoaded(validDates);
      }
      
      return validDates;
    }
  });
};
