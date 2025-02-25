
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Award } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { StaffMemberStats, TotalPurchase } from "@/types/purchase";
import { processTransactions } from "@/components/transactions/TransactionProcessor";
import { calculatePoints, calculateTotalPoints } from "@/utils/pointsCalculation";

const getSalesRole = (totalPoints: number) => {
  if (totalPoints >= 1000) return "Sales Associate";
  return "Sales Intern";
};

const StaffMember = () => {
  const { name } = useParams();
  
  const { data: memberData, isLoading } = useQuery({
    queryKey: ["staffMember", name],
    queryFn: async () => {
      console.log("Fetching staff member data for:", name);
      
      if (!name) throw new Error("No name provided");
      
      const { data: sales, error: salesError } = await supabase
        .from("total_purchases")
        .select("*")
        .eq("user_display_name", decodeURIComponent(name))
        .order("timestamp", { ascending: true })
        .not("refunded", "eq", true);

      if (salesError) throw salesError;
      if (!sales || sales.length === 0) return null;

      const processedSales = processTransactions(sales);
      const validSales = processedSales.filter(sale => !sale.refunded);
      
      const totalPoints = calculateTotalPoints(validSales);

      return {
        displayName: name,
        totalPoints
      };
    }
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-card rounded w-1/3"></div>
          <div className="h-8 bg-card rounded w-1/4"></div>
        </div>
      </PageLayout>
    );
  }

  if (!memberData) {
    return (
      <PageLayout>
        <div className="text-center text-gray-400">
          Ingen data hittades för denna säljare
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{decodeURIComponent(memberData.displayName)}</h1>
        <div className="flex items-center gap-1 text-sm text-primary">
          <Award className="h-4 w-4" />
          <span>{getSalesRole(memberData.totalPoints)}</span>
        </div>
      </div>
    </PageLayout>
  );
};

export default StaffMember;
