import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SalesChartProps {
  transactions: Array<{
    Timestamp: string;
    Amount: number | null;
  }>;
}

export const SalesChart = ({ transactions }: SalesChartProps) => {
  const chartData = useMemo(() => {
    // Group transactions by hour and sum amounts
    const groupedData = transactions.reduce((acc: Record<string, number>, curr) => {
      // Format timestamp to include both date and hour
      const timestamp = new Date(curr.Timestamp);
      // Set minutes and seconds to 0 to group by hour
      timestamp.setMinutes(0, 0, 0);
      const hourKey = timestamp.toISOString();
      
      acc[hourKey] = (acc[hourKey] || 0) + (curr.Amount || 0);
      return acc;
    }, {});

    // Convert to array, sort by timestamp, and calculate cumulative amounts
    let cumulativeAmount = 0;
    return Object.entries(groupedData)
      .map(([timestamp, amount]) => ({
        timestamp,
        amount: (cumulativeAmount += amount) // Calculate running total
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [transactions]);

  if (chartData.length === 0) return null;

  return (
    <div className="w-full h-[200px] bg-card rounded-xl border border-primary/20 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#33C3F0" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#33C3F0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="timestamp" 
            stroke="#666"
            tickFormatter={(value) => format(new Date(value), 'HH:mm', { locale: sv })}
          />
          <YAxis 
            stroke="#666"
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1A1F2C',
              border: '1px solid rgba(51, 195, 240, 0.2)',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [`${value.toLocaleString()} kr`, 'Total försäljning']}
            labelFormatter={(label) => format(new Date(label), 'HH:mm, dd MMMM yyyy', { locale: sv })}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#33C3F0" 
            fillOpacity={1}
            fill="url(#colorAmount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};