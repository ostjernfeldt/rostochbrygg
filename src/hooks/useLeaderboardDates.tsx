import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useLeaderboardDates = (onDatesLoaded?: (dates: string[]) => void) => {
  return useQuery({
    queryKey: ["salesDates"],
    queryFn: async () => {
      console.log("Fetching dates with sales activity from total_purchases...");
      
      // First get visible staff members
      const { data: visibleStaff, error: staffError } = await supabase
        .from("staff_roles")
        .select("user_display_name")
        .eq("hidden", false);

      if (staffError) throw staffError;

      const visibleStaffNames = new Set(visibleStaff.map(s => s.user_display_name));

      // Get all sales
      const { data, error } = await supabase
        .from("total_purchases")
        .select("timestamp, user_display_name")
        .eq('refunded', false)
        .order("timestamp", { ascending: false });

      if (error) throw error;

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
      if (onDatesLoaded && validDates.length > 0) {
        onDatesLoaded(validDates);
      }
      
      return validDates;
    }
  });
};
