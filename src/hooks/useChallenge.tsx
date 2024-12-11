import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useChallenge = (type: 'daily' | 'weekly' | 'monthly', startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ["challenge", type, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      console.log(`Fetching ${type} challenge...`);
      
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("type", type)
        .gte("start_date", startDate.toISOString())
        .lte("end_date", endDate.toISOString());

      if (error) {
        console.error(`Error fetching ${type} challenge:`, error);
        throw error;
      }

      // Return the first challenge if any exists
      return data && data.length > 0 ? data[0] : null;
    }
  });
};