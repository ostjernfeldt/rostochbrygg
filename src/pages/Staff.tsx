
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/PageLayout";
import { StaffMemberStats } from "@/types/purchase";
import { calculatePoints } from "@/utils/pointsCalculation";
import { useState } from "react";

const Staff = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: staffMembers, isLoading, error } = useQuery({
    queryKey: ["staffMembers"],
    queryFn: async () => {
      console.log("Fetching staff members data...");
      
      try {
        // Fetch all staff roles including hidden staff members
        const rolesResponse = await supabase
          .from("staff_roles")
          .select("*");

        if (rolesResponse.error) {
          console.error("Error fetching staff roles:", rolesResponse.error);
          throw rolesResponse.error;
        }
        
        const roles = rolesResponse.data || [];
        
        if (roles.length === 0) {
          console.log("No staff members found in staff_roles table");
          return [];
        }
        
        // Now fetch sales data (if any exists)
        const salesResponse = await supabase
          .from("total_purchases")
          .select("*")
          .not("user_display_name", "is", null)
          .order("timestamp", { ascending: true });
        
        if (salesResponse.error) {
          console.error("Error fetching sales data:", salesResponse.error);
          throw salesResponse.error;
        }
        
        const sales = salesResponse.data || [];
        
        // Initialize staff stats from roles data
        const staffStats: { [key: string]: StaffMemberStats } = {};
        
        // Create base stats for all staff members from roles, including hidden ones
        roles.forEach(roleData => {
          const displayName = roleData.user_display_name;
          staffStats[displayName] = {
            displayName,
            role: roleData.role || 'Sales Intern',
            firstSale: null,
            totalPoints: 0,
            averagePoints: 0,
            totalAmount: 0,
            averageAmount: 0,
            daysActive: 0,
            salesCount: 0,
            sales: [],
            hidden: roleData.hidden || false // Track hidden status for UI filtering if needed
          };
        });
        
        // Add sales data for all staff members who have sales
        if (sales.length > 0) {
          sales.forEach(sale => {
            const displayName = sale.user_display_name as string;
            
            // Skip if the staff member is not in our list (not in staff_roles)
            if (!staffStats[displayName]) return;
            
            const points = calculatePoints(sale.quantity);
            
            // Update first sale date if not set or if this sale is earlier
            if (!staffStats[displayName].firstSale || 
                new Date(sale.timestamp) < new Date(staffStats[displayName].firstSale!)) {
              staffStats[displayName].firstSale = new Date(sale.timestamp);
            }
            
            if (!sale.refunded) {
              staffStats[displayName].totalPoints += points;
            }
            
            staffStats[displayName].sales.push(sale);
          });
          
          // Calculate statistics for staff members with sales
          Object.values(staffStats).forEach(member => {
            if (member.sales.length > 0) {
              // Calculate days active
              const uniqueDays = new Set(member.sales.map(sale => 
                new Date(sale.timestamp).toDateString()));
              member.daysActive = uniqueDays.size;
              
              // Count valid sales (non-refunded)
              const validSales = member.sales.filter(sale => !sale.refunded);
              member.salesCount = validSales.length;
              
              // Calculate financial stats if there are valid sales
              if (validSales.length > 0) {
                member.totalAmount = validSales.reduce((sum, sale) => sum + Number(sale.amount), 0);
                member.averageAmount = member.totalAmount / validSales.length;
                member.averagePoints = member.totalPoints / validSales.length;
              }
            }
          });
        }
        
        // Convert to array, but filter out hidden staff for display
        // Note: We could move this filtering to the UI if we want to add a toggle to show/hide
        return Object.values(staffStats).filter(staff => !staff.hidden);
      } catch (error) {
        console.error("Error in staffMembers query:", error);
        return [];
      }
    }
  });

  if (error) {
    console.error("Error loading staff data:", error);
  }

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
        {filteredStaff?.length > 0 ? (
          filteredStaff.map((member) => (
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
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Inga säljare hittades. Lägg till säljare i staff_roles tabellen.
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Staff;
