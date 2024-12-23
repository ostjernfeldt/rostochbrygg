import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSalaryData = () => {
  // Fetch unique sellers from purchases table
  const { data: actualSellers, isLoading: sellersLoading } = useQuery({
    queryKey: ["actualSellers"],
    queryFn: async () => {
      console.log("Fetching actual sellers from total_purchases...");
      const { data, error } = await supabase
        .from("total_purchases")
        .select("user_display_name")
        .not("user_display_name", "is", null)
        .not("user_display_name", "eq", "")
        .not("user_display_name", "ilike", '%test%')
        .not("user_display_name", "ilike", '%another%');

      if (error) {
        console.error("Error fetching sellers:", error);
        throw error;
      }

      const uniqueSellers = [...new Set(data.map(sale => sale.user_display_name))];
      console.log("Unique sellers found:", uniqueSellers);
      return uniqueSellers;
    }
  });

  // Fetch salaries data from salaries table
  const { data: salaries, isLoading: salariesLoading } = useQuery({
    queryKey: ["salaries"],
    queryFn: async () => {
      console.log("Fetching salaries from salaries table...");
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .order("period_start", { ascending: false });

      if (error) {
        console.error("Error fetching salaries:", error);
        throw error;
      }
      
      console.log("Fetched salaries:", data);
      return data;
    }
  });

  // Fetch sales data for the period from total_purchases
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      console.log("Fetching sales from total_purchases...");
      const { data, error } = await supabase
        .from("total_purchases")
        .select("*")
        .not("refunded", "eq", true);

      if (error) {
        console.error("Error fetching sales:", error);
        throw error;
      }

      console.log("Fetched sales:", data);
      return data;
    }
  });

  // Fetch bonus records
  const { data: bonuses, isLoading: bonusesLoading } = useQuery({
    queryKey: ["bonuses"],
    queryFn: async () => {
      console.log("Fetching bonuses...");
      const { data, error } = await supabase
        .from("bonus_records")
        .select("*");

      if (error) {
        console.error("Error fetching bonuses:", error);
        throw error;
      }

      console.log("Fetched bonuses:", data);
      return data;
    }
  });

  return {
    actualSellers,
    salaries,
    bonuses,
    sales,
    isLoading: sellersLoading || salariesLoading || bonusesLoading || salesLoading
  };
};