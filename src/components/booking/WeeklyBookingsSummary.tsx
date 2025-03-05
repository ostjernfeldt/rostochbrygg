
import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useWeeklyBookingSummary } from '@/hooks/useShiftBookings';

interface WeeklyBookingsSummaryProps {
  weekStartDate?: Date;
}

export function WeeklyBookingsSummary({ weekStartDate }: WeeklyBookingsSummaryProps) {
  const { summary, isLoading } = useWeeklyBookingSummary(undefined, weekStartDate);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Din bokningsöversikt</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Laddar bokningssammanställning...</p>
        </CardContent>
      </Card>
    );
  }
  
  const startDate = weekStartDate || new Date(Date.now());
  const endDate = addDays(startDate, 6);
  const dateRange = `${format(startDate, 'd MMM', { locale: sv })} - ${format(endDate, 'd MMM yyyy', { locale: sv })}`;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Din bokningsöversikt</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Vecka:</span>
            <span className="font-medium">{dateRange}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Bokade pass:</span>
            <span className="font-medium">{summary?.total_bookings || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status:</span>
            {summary?.meets_minimum_requirement ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Bokningskrav uppfyllt</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Boka minst {2 - (summary?.total_bookings || 0)} pass till</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
