import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSalaryData = () => {
  // Fetch unique sellers from purchases table
  const { data: actualSellers, isLoading: sellersLoading } = useQuery({
    queryKey: ["actualSellers"],
    queryFn: async () => {
      console.log("Fetching actual sellers from purchases...");
      const { data, error } = await supabase
        .from("purchases")
        .select('"User Display Name"')
        .not("User Display Name", "is", null)
        .not("User Display Name", "eq", "")
        .not("User Display Name", "ilike", '%test%')
        .not("User Display Name", "ilike", '%another%');

      if (error) {
        console.error("Error fetching sellers:", error);
        throw error;
      }

      const uniqueSellers = [...new Set(data.map(sale => sale["User Display Name"]))];
      console.log("Unique sellers found:", uniqueSellers);
      return uniqueSellers;
    }
  });

  // Fetch salaries data
  const { data: salaries, isLoading: salariesLoading } = useQuery({
    queryKey: ["salaries"],
    queryFn: async () => {
      console.log("Fetching salaries...");
      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .order("period_start", { ascending: false });

      if (error) {
        console.error("Error fetching salaries:", error);
        throw error;
      }
      
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

      return data;
    }
  });

  // Fetch sales data for the period
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      console.log("Fetching sales...");
      const { data, error } = await supabase
        .from("purchases")
        .select("*");

      if (error) {
        console.error("Error fetching sales:", error);
        throw error;
      }

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