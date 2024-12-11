import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, startOfWeek } from "date-fns";
import { sv } from "date-fns/locale";

interface SalesChartProps {
  transactions: Array<{
    Timestamp: string;
    Amount: number | null;
  }>;
  groupByWeek?: boolean;
}

export const SalesChart = ({ transactions, groupByWeek = false }: SalesChartProps) => {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    console.log("Raw transactions:", transactions);

    // Sort transactions by timestamp
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime()
    );
    
    console.log("Sorted transactions:", sortedTransactions);

    if (groupByWeek) {
      // Group transactions by week and calculate cumulative amount for each week
      let cumulativeAmount = 0;
      const weeklyData = sortedTransactions.reduce((acc, transaction) => {
        const date = new Date(transaction.Timestamp);
        const weekStart = startOfWeek(date, { locale: sv });
        const weekKey = format(weekStart, "yyyy-MM-dd");
        
        if (!acc[weekKey]) {
          if (transaction.Amount) {
            cumulativeAmount += transaction.Amount;
          }
          acc[weekKey] = {
            timestamp: weekStart.toISOString(),
            amount: cumulativeAmount
          };
        } else {
          if (transaction.Amount) {
            cumulativeAmount += transaction.Amount;
            acc[weekKey].amount = cumulativeAmount;
          }
        }
        
        return acc;
      }, {} as Record<string, { timestamp: string; amount: number }>);

      const result = Object.values(weeklyData);
      console.log("Weekly cumulative chart data:", result);
      return result;
    } else {
      // Calculate cumulative amount for each transaction
      let cumulativeAmount = 0;
      const result = sortedTransactions.map(transaction => {
        if (transaction.Amount) {
          cumulativeAmount += transaction.Amount;
        }
        return {
          timestamp: transaction.Timestamp,
          amount: cumulativeAmount
        };
      });
      
      console.log("Cumulative chart data:", result);
      return result;
    }
  }, [transactions, groupByWeek]);

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
            tickFormatter={(value) => {
              const date = new Date(value);
              return groupByWeek 
                ? `v.${format(date, 'w', { locale: sv })}`
                : format(date, 'HH:mm', { locale: sv });
            }}
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
            formatter={(value: number) => [
              `${value.toLocaleString()} kr`, 
              groupByWeek ? 'Total försäljning' : 'Total försäljning'
            ]}
            labelFormatter={(label) => {
              const date = new Date(label);
              return groupByWeek 
                ? `Vecka ${format(date, 'w', { locale: sv })}`
                : format(date, 'HH:mm', { locale: sv });
            }}
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