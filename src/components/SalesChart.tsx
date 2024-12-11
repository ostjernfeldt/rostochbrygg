import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, startOfDay, addHours } from "date-fns";
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

    // Find the start of the day for the first transaction
    const firstTransaction = new Date(transactions[0].Timestamp);
    const dayStart = startOfDay(firstTransaction);
    
    // Create an array of all hours in the day
    const hourlyData: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      const hourTimestamp = addHours(dayStart, i);
      hourlyData[hourTimestamp.toISOString()] = 0;
    }

    // Group transactions by hour
    transactions.forEach(transaction => {
      const timestamp = new Date(transaction.Timestamp);
      timestamp.setMinutes(0, 0, 0);
      const hourKey = timestamp.toISOString();
      hourlyData[hourKey] = (hourlyData[hourKey] || 0) + (transaction.Amount || 0);
    });

    // Calculate cumulative amounts
    let cumulativeAmount = 0;
    return Object.entries(hourlyData)
      .map(([timestamp, amount]) => ({
        timestamp,
        amount: (cumulativeAmount += amount)
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