import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, startOfWeek, startOfDay, addDays, isSameDay, parseISO, isValid } from "date-fns";
import { sv } from "date-fns/locale";
import { LegacyPurchaseFormat } from "@/utils/purchaseMappers";

interface SalesChartProps {
  transactions: LegacyPurchaseFormat[];
  groupByWeek?: boolean;
  selectedPeriod?: string;
  showAccumulatedPerTransaction?: boolean;
}

export const SalesChart = ({ 
  transactions, 
  groupByWeek = false, 
  selectedPeriod,
  showAccumulatedPerTransaction = false
}: SalesChartProps) => {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    console.log("Raw transactions:", transactions);

    // Helper function to safely parse dates
    const safeParseDate = (dateString: string) => {
      try {
        const parsedDate = parseISO(dateString);
        return isValid(parsedDate) ? parsedDate : null;
      } catch (error) {
        console.error("Error parsing date:", dateString, error);
        return null;
      }
    };

    // Sort transactions by timestamp, filtering out invalid dates
    const sortedTransactions = [...transactions]
      .filter(t => {
        const date = safeParseDate(t.Timestamp);
        if (!date) {
          console.warn("Invalid timestamp found:", t.Timestamp);
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = safeParseDate(a.Timestamp)!;
        const dateB = safeParseDate(b.Timestamp)!;
        return dateA.getTime() - dateB.getTime();
      });
    
    console.log("Sorted transactions:", sortedTransactions);

    // If we want to show accumulated per transaction
    if (showAccumulatedPerTransaction) {
      let cumulativeAmount = 0;
      return sortedTransactions.map(transaction => {
        const date = safeParseDate(transaction.Timestamp);
        if (!date) return null;
        
        if (transaction.Amount) {
          cumulativeAmount += transaction.Amount;
        }
        return {
          timestamp: date.toISOString(),
          amount: cumulativeAmount,
          time: format(date, 'HH:mm')
        };
      }).filter(Boolean);
    }

    // Handle daily view differently
    if (selectedPeriod === "day") {
      let cumulativeAmount = 0;
      return sortedTransactions.map(transaction => {
        const date = safeParseDate(transaction.Timestamp);
        if (!date) return null;
        
        if (transaction.Amount) {
          cumulativeAmount += transaction.Amount;
        }
        return {
          timestamp: date.toISOString(),
          amount: cumulativeAmount,
          time: format(date, 'HH:mm')
        };
      }).filter(Boolean);
    }

    if (groupByWeek) {
      // Group transactions by week and calculate cumulative amount for each week
      let cumulativeAmount = 0;
      const weeklyData = sortedTransactions.reduce((acc, transaction) => {
        const date = safeParseDate(transaction.Timestamp);
        if (!date) return acc;
        
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
      // For a specific week view, create data points for all days of the week
      if (sortedTransactions.length > 0) {
        const firstDate = safeParseDate(sortedTransactions[0].Timestamp);
        if (!firstDate) return [];
        
        const weekStart = startOfWeek(firstDate, { locale: sv });
        let cumulativeAmount = 0;
        
        // Create an array of all days in the week
        const result = Array.from({ length: 7 }, (_, i) => {
          const currentDay = addDays(weekStart, i);
          
          // Find transactions for this day and update cumulative amount
          sortedTransactions.forEach(transaction => {
            const transactionDate = safeParseDate(transaction.Timestamp);
            if (transactionDate && isSameDay(transactionDate, currentDay) && transaction.Amount) {
              cumulativeAmount += transaction.Amount;
            }
          });
          
          return {
            timestamp: currentDay.toISOString(),
            amount: cumulativeAmount,
            weekday: format(currentDay, 'EEEEEE', { locale: sv }).toUpperCase()
          };
        });
        
        console.log("Daily cumulative chart data:", result);
        return result;
      }
      
      return sortedTransactions
        .map(transaction => {
          const date = safeParseDate(transaction.Timestamp);
          if (!date) return null;
          return {
            timestamp: date.toISOString(),
            amount: Number(transaction.Amount) || 0
          };
        })
        .filter(Boolean);
    }
  }, [transactions, groupByWeek, selectedPeriod, showAccumulatedPerTransaction]);

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
              try {
                const date = new Date(value);
                if (!isValid(date)) {
                  console.warn("Invalid date in XAxis:", value);
                  return "";
                }
                
                if (showAccumulatedPerTransaction || selectedPeriod === "day") {
                  return format(date, 'HH:mm');
                }
                if (!groupByWeek) {
                  const weekday = format(date, 'EEEEEE', { locale: sv }).toUpperCase();
                  return weekday === 'L' ? 'LÖ' : weekday === 'S' ? 'SÖ' : weekday;
                }
                return `v.${format(date, 'w', { locale: sv })}`;
              } catch (error) {
                console.error("Error formatting date in XAxis:", error);
                return "";
              }
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
              'Total försäljning'
            ]}
            labelFormatter={(label) => {
              try {
                const date = new Date(label);
                if (!isValid(date)) {
                  console.warn("Invalid date in Tooltip:", label);
                  return "";
                }
                
                if (showAccumulatedPerTransaction || selectedPeriod === "day") {
                  return format(date, 'HH:mm');
                }
                return groupByWeek 
                  ? `Vecka ${format(date, 'w', { locale: sv })}`
                  : format(date, 'EEEE d MMMM', { locale: sv });
              } catch (error) {
                console.error("Error formatting date in Tooltip:", error);
                return "";
              }
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