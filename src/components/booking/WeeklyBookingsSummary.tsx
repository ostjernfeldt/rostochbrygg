
import { useWeeklyBookingSummary } from "@/hooks/useShiftBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

interface WeeklyBookingsSummaryProps {
  userId?: string;
  weekStartDate?: Date;
}

export function WeeklyBookingsSummary({ userId, weekStartDate }: WeeklyBookingsSummaryProps) {
  const { summary, isLoading } = useWeeklyBookingSummary(userId, weekStartDate);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Veckans bokningar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4 text-muted-foreground">Laddar...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Veckans bokningar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4 text-muted-foreground">Kunde inte ladda bokningsöversikt</p>
        </CardContent>
      </Card>
    );
  }
  
  const weekStart = parseISO(summary.week_start);
  const weekEnd = parseISO(summary.week_end);
  
  const weekDateRange = `${format(weekStart, 'd MMM', { locale: sv })} - ${format(weekEnd, 'd MMM', { locale: sv })}`;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Veckans bokningar: {weekDateRange}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span>Antal bokade pass:</span>
          <span className="font-medium">{summary.total_bookings}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Minimikrav uppfyllt:</span>
          <div className="flex items-center space-x-1">
            {summary.meets_minimum_requirement ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-500">Ja</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">Nej</span>
              </>
            )}
          </div>
        </div>
        
        {!summary.meets_minimum_requirement && (
          <p className="mt-4 text-sm text-muted-foreground">
            Du måste boka minst 2 pass per vecka. Vänligen boka fler pass eller kontakta en säljledare.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
