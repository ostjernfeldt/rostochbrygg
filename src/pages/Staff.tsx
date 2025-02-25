
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/PageLayout";
import { StaffMemberStats } from "@/types/purchase";
import { calculatePoints, calculateTotalPoints } from "@/utils/pointsCalculation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

type SortField = 'totalAmount' | 'salesCount' | 'averageAmount' | 'daysActive' | 'firstSale';

const getSalesRole = (totalPoints: number) => {
  if (totalPoints >= 1000) return "Sales Associate";
  return "Sales Intern";
};

const Staff = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('totalAmount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ["staffMembers"],
    queryFn: async () => {
      console.log("Fetching staff members data...");
      
      const { data: sales, error } = await supabase
        .from("total_purchases")
        .select("*")
        .not("user_display_name", "is", null)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      if (!sales || sales.length === 0) return [];

      const staffStats = sales.reduce((acc: { [key: string]: StaffMemberStats }, sale) => {
        const displayName = sale.user_display_name as string;
        const saleDate = new Date(sale.timestamp);
        const points = calculatePoints(sale.quantity);

        if (!acc[displayName]) {
          acc[displayName] = {
            displayName,
            firstSale: saleDate,
            totalPoints: 0,
            averagePoints: 0,
            totalAmount: 0,
            daysActive: 0,
            salesCount: 0,
            sales: [],
            shifts: []
          };
        }

        if (!sale.refunded) {
          acc[displayName].totalPoints += points;
          acc[displayName].salesCount += 1;
          acc[displayName].averagePoints = acc[displayName].totalPoints / acc[displayName].salesCount;
        }
        
        acc[displayName].sales.push(sale);

        // Calculate unique days
        const uniqueDays = new Set(
          sales
            .filter(s => s.user_display_name === displayName)
            .map(s => new Date(s.timestamp).toDateString())
        );
        acc[displayName].daysActive = uniqueDays.size;

        return acc;
      }, {});

      return Object.values(staffStats);
    }
  });

  const filteredAndSortedStaff = staffMembers
    ?.filter(member => 
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'firstSale') {
        return multiplier * (a.firstSale.getTime() - b.firstSale.getTime());
      }
      
      return multiplier * ((a[sortField] as number) - (b[sortField] as number));
    });

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
        
        <div className="flex gap-2">
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as SortField)}
          >
            <SelectTrigger className="w-[180px] bg-card border-gray-800">
              <SelectValue placeholder="Sortera efter" />
            </SelectTrigger>
            <SelectContent className="bg-card border-gray-800">
              {sortOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="focus:bg-gray-800"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={sortDirection}
            onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
          >
            <SelectTrigger className="w-[180px] bg-card border-gray-800">
              <SelectValue placeholder="Sorteringsordning" />
            </SelectTrigger>
            <SelectContent className="bg-card border-gray-800">
              <SelectItem value="desc" className="focus:bg-gray-800">Högst först</SelectItem>
              <SelectItem value="asc" className="focus:bg-gray-800">Lägst först</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedStaff?.map((member) => (
          <div
            key={member.displayName}
            onClick={() => navigate(`/staff/${encodeURIComponent(member.displayName)}`)}
            className="bg-card p-4 rounded-xl hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold">{member.displayName}</h3>
                <div className="flex items-center gap-1 text-sm text-primary">
                  <Award className="h-4 w-4" />
                  <span>{getSalesRole(member.totalPoints)}</span>
                </div>
              </div>
              <span className="text-primary">
                {Math.round(member.totalPoints)} poäng
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
              <div>Första sälj: {format(member.firstSale, 'yyyy-MM-dd')}</div>
              <div>Antal sälj: {member.salesCount}</div>
              <div>Aktiva dagar: {member.daysActive}</div>
              <div>Snittpoäng: {Math.round(member.averagePoints)} p/sälj</div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'totalAmount', label: 'Total poäng' },
  { value: 'salesCount', label: 'Antal sälj' },
  { value: 'averageAmount', label: 'Snittpoäng' },
  { value: 'daysActive', label: 'Aktiva dagar' },
  { value: 'firstSale', label: 'Första sälj' }
];

export default Staff;
