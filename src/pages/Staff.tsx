import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/PageLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface StaffMember {
  displayName: string;
  firstSale: Date;
  totalSales: number;
  averageAmount: number;
  totalAmount: number;
  daysActive: number;
  salesCount: number;
}

type SortField = 'totalAmount' | 'salesCount' | 'averageAmount' | 'daysActive' | 'firstSale';

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
        .from("purchases")
        .select("*")
        .not("User Display Name", "is", null)
        .order("Timestamp", { ascending: true });

      if (error) throw error;
      if (!sales || sales.length === 0) return [];

      const staffStats = sales.reduce((acc: { [key: string]: StaffMember }, sale) => {
        const displayName = sale["User Display Name"] as string;
        const saleDate = new Date(sale.Timestamp as string);
        const amount = Number(sale.Amount) || 0;

        if (!acc[displayName]) {
          acc[displayName] = {
            displayName,
            firstSale: saleDate,
            totalSales: 0,
            averageAmount: 0,
            totalAmount: 0,
            daysActive: 0,
            salesCount: 0
          };
        }

        acc[displayName].totalAmount += amount;
        acc[displayName].salesCount += 1;
        acc[displayName].averageAmount = acc[displayName].totalAmount / acc[displayName].salesCount;

        // Calculate unique days
        const uniqueDays = new Set(
          sales
            .filter(s => s["User Display Name"] === displayName)
            .map(s => new Date(s.Timestamp as string).toDateString())
        );
        acc[displayName].daysActive = uniqueDays.size;

        return acc;
      }, {});

      return Object.values(staffStats);
    }
  });

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'totalAmount', label: 'Total försäljning' },
    { value: 'salesCount', label: 'Antal sälj' },
    { value: 'averageAmount', label: 'Snittförsäljning' },
    { value: 'daysActive', label: 'Aktiva dagar' },
    { value: 'firstSale', label: 'Första sälj' }
  ];

  const filteredAndSortedStaff = staffMembers
    ?.filter(member => 
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'firstSale') {
        return multiplier * (new Date(a.firstSale).getTime() - new Date(b.firstSale).getTime());
      }
      
      return multiplier * (a[sortField] - b[sortField]);
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
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as SortField)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sortera efter" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={sortDirection}
            onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sorteringsordning" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Högst först</SelectItem>
              <SelectItem value="asc">Lägst först</SelectItem>
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
              <h3 className="text-xl font-bold">{member.displayName}</h3>
              <span className="text-primary">
                SEK {Math.round(member.totalAmount).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
              <div>Första sälj: {format(member.firstSale, 'yyyy-MM-dd')}</div>
              <div>Antal sälj: {member.salesCount}</div>
              <div>Aktiva dagar: {member.daysActive}</div>
              <div>Snitt per sälj: SEK {Math.round(member.averageAmount).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default Staff;