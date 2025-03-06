
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/PageLayout";
import { StaffMemberStats } from "@/types/purchase";
import { calculatePoints } from "@/utils/pointsCalculation";
import { processTransactions, getValidTransactions, getValidSalesCount } from "@/components/transactions/TransactionProcessor";
import { useState, useEffect } from "react";

const Staff = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: staffMembers, isLoading, error } = useQuery({
    queryKey: ["staffMembers"],
    queryFn: async () => {
      console.log("Fetching staff members data...");
      
      try {
        // Fetch all visible staff roles (not hidden)
        const rolesResponse = await supabase
          .from("staff_roles")
          .select("*");

        if (rolesResponse.error) {
          console.error("Error fetching staff roles:", rolesResponse.error);
          throw rolesResponse.error;
        }
        
        // Filter out hidden staff members
        const roles = rolesResponse.data?.filter(staff => !staff.hidden) || [];
        console.log(`Fetched ${roles.length} visible staff roles`);
        
        // If there are no staff members, return empty array
        if (roles.length === 0) {
          console.log("No staff members found - returning empty array");
          return [];
        }
        
        // Now fetch sales data (if any exists)
        const salesResponse = await supabase
          .from("total_purchases")
          .select("*")
          .not("user_display_name", "is", null);
        
        if (salesResponse.error) {
          console.error("Error fetching sales data:", salesResponse.error);
          throw salesResponse.error;
        }
        
        const sales = salesResponse.data || [];
        console.log(`Fetched ${sales.length} sales records`);
        
        // Process transactions - do this once
        const processedSales = processTransactions(sales);
        console.log(`After processing: ${processedSales.length} sales`);
        
        // Initialize staff stats from roles data
        const staffStats: { [key: string]: StaffMemberStats } = {};
        
        // Create base stats for all visible staff members from roles
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
            sales: []
          };
        });
        
        // Get valid transactions once
        const validTransactions = getValidTransactions(processedSales);
        
        // Add sales data for all staff members who have sales
        validTransactions.forEach(sale => {
          const displayName = sale.user_display_name as string;
          
          // Skip if the staff member is not in our visible list
          if (!staffStats[displayName]) return;
          
          const points = calculatePoints(sale.quantity);
          
          // Update first sale date if not set or if this sale is earlier
          if (!staffStats[displayName].firstSale || 
              new Date(sale.timestamp) < new Date(staffStats[displayName].firstSale!)) {
            staffStats[displayName].firstSale = new Date(sale.timestamp);
          }
          
          staffStats[displayName].totalPoints += points;
          staffStats[displayName].totalAmount += Number(sale.amount);
          staffStats[displayName].sales.push(sale);
        });
        
        // Calculate statistics for all staff members
        Object.values(staffStats).forEach(member => {
          // Calculate days active
          const uniqueDays = new Set(member.sales.map(sale => 
            new Date(sale.timestamp).toDateString()));
          member.daysActive = uniqueDays.size;
          
          // Count valid sales
          member.salesCount = getValidSalesCount(member.sales);
          
          // Calculate financial stats
          if (member.salesCount > 0) {
            member.averageAmount = member.totalAmount / member.salesCount;
            member.averagePoints = member.totalPoints / member.salesCount;
          }
        });
        
        // Convert to array for display
        return Object.values(staffStats);
      } catch (error) {
        console.error("Error in staffMembers query:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 3,
    enabled: true
  });

  // Add debug logging to track data loading
  useEffect(() => {
    if (staffMembers) {
      console.log(`Loaded ${staffMembers.length} visible staff members`);
    }
  }, [staffMembers]);

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
