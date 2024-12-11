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
    if (transactions.length === 0) return [];

    console.log("Raw transactions:", transactions);

    // Sort transactions by timestamp
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime()
    );
    
    console.log("Sorted transactions:", sortedTransactions);

    // Group transactions by hour and calculate total amount for each hour
    const hourlyData = sortedTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.Timestamp);
      // Format the hour as YYYY-MM-DD HH:00 to group by hour
      const hourKey = format(date, "yyyy-MM-dd HH:00");
      
      if (!acc[hourKey]) {
        acc[hourKey] = {
          timestamp: date.toISOString(),
          amount: 0
        };
      }
      
      if (transaction.Amount) {
        acc[hourKey].amount += transaction.Amount;
      }
      
      return acc;
    }, {} as Record<string, { timestamp: string; amount: number }>);

    // Convert the grouped data to an array
    const result = Object.values(hourlyData);
    
    console.log("Hourly chart data:", result);
    return result;
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
            scale="linear"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1A1F2C',
              border: '1px solid rgba(51, 195, 240, 0.2)',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [`${value.toLocaleString()} kr`, 'Försäljning denna timme']}
            labelFormatter={(label) => format(new Date(label), 'HH:mm', { locale: sv })}
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