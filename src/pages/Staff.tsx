
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/PageLayout";
import { StaffMemberStats } from "@/types/purchase";
import { calculatePoints } from "@/utils/pointsCalculation";
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
          .select("*")
          .eq("hidden", false);

        if (rolesResponse.error) {
          console.error("Error fetching staff roles:", rolesResponse.error);
          throw rolesResponse.error;
        }
        
        const roles = rolesResponse.data || [];
        console.log(`Fetched ${roles.length} visible staff roles`);
        
        // Om det inte finns några säljare, skapa dummy data
        if (roles.length === 0) {
          console.log("No staff members found - creating dummy data");
          
          // Create dummy staff data for demonstration
          const dummyRoles = [
            { id: "1", user_display_name: "Säljare 1", role: "Sales Manager", hidden: false },
            { id: "2", user_display_name: "Säljare 2", role: "Sales Representative", hidden: false },
            { id: "3", user_display_name: "Säljare 3", role: "Sales Representative", hidden: false },
            { id: "4", user_display_name: "Säljare 4", role: "Sales Intern", hidden: false },
            { id: "5", user_display_name: "Säljare 5", role: "Sales Intern", hidden: false }
          ];
          
          // Convert dummy roles to staff stats format
          const dummyStats = dummyRoles.map((role, index) => {
            const basePoints = 450 - (index * 75);
            return {
              displayName: role.user_display_name,
              role: role.role,
              firstSale: new Date(2023, 0, 1),
              totalPoints: basePoints,
              averagePoints: basePoints / 20,
              totalAmount: basePoints * 10,
              averageAmount: basePoints / 2,
              daysActive: 20 - (index * 2),
              salesCount: 20 - (index * 2),
              sales: []
            };
          });
          
          return dummyStats;
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
        console.log(`Fetched ${sales.length} sales records`);
        
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
        
        // Om det inte finns några sälj, skapa dummy-sälj för varje säljare
        if (sales.length === 0) {
          console.log("No sales data found - creating dummy sales");
          
          // Create some dummy sales for each staff member
          Object.keys(staffStats).forEach((displayName, index) => {
            const basePoints = 450 - (index * 75);
            const salesCount = 20 - (index * 2);
            
            staffStats[displayName].totalPoints = basePoints;
            staffStats[displayName].averagePoints = basePoints / salesCount;
            staffStats[displayName].totalAmount = basePoints * 10;
            staffStats[displayName].averageAmount = basePoints / 2;
            staffStats[displayName].daysActive = salesCount;
            staffStats[displayName].salesCount = salesCount;
            staffStats[displayName].firstSale = new Date(2023, 0, 1);
          });
          
          // Convert to array for display
          return Object.values(staffStats);
        }
        
        // Add sales data for all staff members who have sales
        if (sales.length > 0) {
          sales.forEach(sale => {
            const displayName = sale.user_display_name as string;
            
            // Skip if the staff member is not in our visible list
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
        
        // Convert to array for display
        return Object.values(staffStats);
      } catch (error) {
        console.error("Error in staffMembers query:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 3,
    // Always enable the query since we don't need authentication
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
