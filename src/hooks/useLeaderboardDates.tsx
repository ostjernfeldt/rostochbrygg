
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useLeaderboardDates = (onDatesLoaded?: (dates: string[]) => void) => {
  return useQuery({
    queryKey: ["salesDates"],
    queryFn: async () => {
      console.log("Fetching dates with sales activity from total_purchases...");
      const { data, error } = await supabase
        .from("total_purchases")
        .select("timestamp")
        .eq('refunded', false)
        .order("timestamp", { ascending: false });

      if (error) throw error;

      // Get unique dates and format them
      const uniqueDates = Array.from(new Set(
        data.map(purchase => format(new Date(purchase.timestamp), 'yyyy-MM-dd'))
      ));

      console.log("Found sales dates:", uniqueDates);
      
      // Call the callback with the loaded dates
      if (onDatesLoaded && uniqueDates.length > 0) {
        onDatesLoaded(uniqueDates);
      }
      
      return uniqueDates;
    }
  });
};
