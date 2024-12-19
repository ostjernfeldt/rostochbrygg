import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/PageLayout";
import { AllTimeStats } from "@/components/stats/AllTimeStats";
import { ChallengeSection } from "@/components/challenges/ChallengeSection";
import { format } from "date-fns";

const Competitions = () => {
  // Fetch dates with sales activity
  const { data: salesDates } = useQuery({
    queryKey: ["salesDates"],
    queryFn: async () => {
      console.log("Fetching dates with sales activity...");
      const { data, error } = await supabase
        .from("total_purchases")
        .select("timestamp")
        .order("timestamp", { ascending: false });

      if (error) throw error;

      // Get unique dates and format them
      const uniqueDates = Array.from(new Set(
        data.map(purchase => format(new Date(purchase.timestamp), 'yyyy-MM-dd'))
      ));

      console.log("Found sales dates:", uniqueDates);
      return uniqueDates;
    }
  });

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-6 animate-fade-in">Tävlingar & Bonusar</h1>
      <ChallengeSection salesDates={salesDates} />
      <AllTimeStats />
    </PageLayout>
  );
};

export default Competitions;
