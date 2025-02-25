
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/PageLayout";
import { StaffMemberStats } from "@/types/purchase";
import { calculatePoints, calculateTotalPoints } from "@/utils/pointsCalculation";
import { useState } from "react";

const Staff = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ["staffMembers"],
    queryFn: async () => {
      console.log("Fetching staff members data...");
      
      // Fetch both sales data and roles in parallel
      const [salesResponse, rolesResponse] = await Promise.all([
        supabase
          .from("total_purchases")
          .select("*")
          .not("user_display_name", "is", null)
          .order("timestamp", { ascending: true }),
        supabase
          .from("staff_roles")
          .select("*")
      ]);

      if (salesResponse.error) throw salesResponse.error;
      if (rolesResponse.error) throw rolesResponse.error;

      const sales = salesResponse.data || [];
      const roles = rolesResponse.data || [];

      if (sales.length === 0) return [];

      const staffStats = sales.reduce((acc: { [key: string]: StaffMemberStats }, sale) => {
        const displayName = sale.user_display_name as string;
        const points = calculatePoints(sale.quantity);

        if (!acc[displayName]) {
          acc[displayName] = {
            displayName,
            firstSale: new Date(sale.timestamp),
            totalPoints: 0,
            averagePoints: 0,
            totalAmount: 0,
            averageAmount: 0,
            daysActive: 0,
            salesCount: 0,
            sales: []
          };
        }

        if (!sale.refunded) {
          acc[displayName].totalPoints += points;
        }
        
        acc[displayName].sales.push(sale);

        return acc;
      }, {});

      // Add roles to staff stats
      return Object.values(staffStats).map(member => {
        const roleData = roles.find(r => r.user_display_name === member.displayName);
        return {
          ...member,
          role: roleData?.role || 'Sales Intern'
        };
      });
    }
  });

  const filteredStaff = staffMembers?.filter(member => 
    member.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <PageLayout>
        <h1 className="text-2xl font-bold mb-6">Personal</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-card rounded-xl"></div>
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-6">Personal</h1>
      
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök säljare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-gray-800"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredStaff?.map((member) => (
          <div
            key={member.displayName}
            onClick={() => navigate(`/staff/${encodeURIComponent(member.displayName)}`)}
            className="bg-card p-4 rounded-xl hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{member.displayName}</h3>
                <div className="flex items-center gap-1 text-sm text-primary">
                  <Award className="h-4 w-4" />
                  <span>{member.role}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default Staff;
