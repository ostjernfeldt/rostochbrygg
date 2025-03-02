import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SalesChart } from "@/components/SalesChart";
import { mapDatabaseToLegacyFormat } from "@/utils/purchaseMappers";
interface SalesChartSectionProps {
  sales: any[];
  userName: string;
}
export const SalesChartSection = ({
  sales,
  userName
}: SalesChartSectionProps) => {
  const {
    data: totalPurchases = [],
    isLoading
  } = useQuery({
    queryKey: ['staff-member-sales', userName],
    queryFn: async () => {
      console.log("Fetching sales data for user:", userName);
      const {
        data,
        error
      } = await supabase.from('total_purchases').select('*').eq('user_display_name', userName).order('timestamp', {
        ascending: true
      });
      if (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }
      console.log("Fetched sales data:", data);
      return data ? data.map(mapDatabaseToLegacyFormat) : [];
    }
  });
  if (isLoading) {
    return <div className="stat-card">
        <h3 className="text-gray-400 mb-4">Försäljning över tid</h3>
        <div className="animate-pulse h-[200px] bg-card rounded-xl"></div>
      </div>;
  }
  return;
};