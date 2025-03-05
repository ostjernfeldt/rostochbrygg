
import { useState, useEffect } from 'react';
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreateShiftForm } from "@/components/booking/CreateShiftForm";
import { ShiftCard } from "@/components/booking/ShiftCard";
import { ShiftDetailsDialog } from "@/components/booking/ShiftDetailsDialog";
import { WeeklyBookingsSummary } from "@/components/booking/WeeklyBookingsSummary";
import { AdminToggleFeature } from "@/components/booking/AdminToggleFeature";
import { useShifts, useShiftDetails } from "@/hooks/useShifts";
import { useWeeklyBookingSummary } from "@/hooks/useShiftBookings";
import { useBookingSystemEnabled } from "@/hooks/useAppSettings";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const Booking = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  
  const { shifts, isLoading: isLoadingShifts } = useShifts(currentWeekStart, currentWeekEnd);
  const { shift } = useShiftDetails(selectedShiftId || '');
  const { summary } = useWeeklyBookingSummary(undefined, currentWeekStart);
  const { isEnabled: isBookingEnabled } = useBookingSystemEnabled();
  
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setUserRole(roleData?.role || 'user');
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    
    getUserRole();
  }, []);
  
  const isAdmin = userRole === 'admin';
  
  const handleViewShiftDetails = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setShowShiftDialog(true);
  };
  
  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, -1));
  };
  
  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };
  
  const groupShiftsByDate = () => {
    const groupedShifts: Record<string, typeof shifts> = {};
    
    shifts.forEach(shift => {
      const date = shift.date;
      if (!groupedShifts[date]) {
        groupedShifts[date] = [];
      }
      groupedShifts[date].push(shift);
    });
    
    return groupedShifts;
  };
  
  const formatWeekRange = () => {
    return `${format(currentWeekStart, 'd', { locale: sv })} - ${format(currentWeekEnd, 'd MMM', { locale: sv })}`;
  };
  
  const isCurrentWeek = () => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    return isSameDay(startOfCurrentWeek, currentWeekStart);
  };
  
  // For regular users, show a message if the booking system is disabled
  if (!isAdmin && !isBookingEnabled) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Bokningssystemet är stängt</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Bokningssystemet är för närvarande stängt. Vänligen försök igen senare eller kontakta din säljledare för att boka säljpass.
          </p>
          <Button onClick={() => window.history.back()}>
            Gå tillbaka
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-6">
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bokningar</h1>
          
          {isCurrentWeek() && summary && (
            <Badge variant={summary.meets_minimum_requirement ? "outline" : "destructive"}>
              {summary.total_bookings} / 2 pass bokade denna vecka
            </Badge>
          )}
        </div>
        
        {isAdmin ? (
          <Tabs defaultValue="bookings">
            <TabsList className="w-full mb-2">
              <TabsTrigger value="bookings" className="flex-1">Bokningar</TabsTrigger>
              <TabsTrigger value="create" className="flex-1">Skapa säljpass</TabsTrigger>
              <TabsTrigger value="admin" className="flex-1">Admin</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bookings">
              <div className="grid gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePreviousWeek}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Vecka {formatWeekRange()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextWeek}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {isLoadingShifts ? (
                  <p className="text-center py-10 text-muted-foreground">Laddar säljpass...</p>
                ) : shifts.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <h3 className="text-lg font-semibold mb-2">Inga säljpass för denna vecka</h3>
                      <p className="text-muted-foreground">Gå till "Skapa säljpass" för att skapa nya pass</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div>
                    {Object.entries(groupShiftsByDate()).map(([date, dateShifts]) => (
                      <div key={date} className="mb-6">
                        <h3 className="capitalize text-lg font-medium mb-3">
                          {format(new Date(date), 'EEEE d MMMM', { locale: sv })}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dateShifts.map(shift => (
                            <ShiftCard 
                              key={shift.id} 
                              shift={shift} 
                              isUserAdmin={isAdmin}
                              onViewDetails={handleViewShiftDetails}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Skapa nytt säljpass
                  </CardTitle>
                  <CardDescription>
                    Fyll i uppgifterna nedan för att skapa ett nytt säljpass
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CreateShiftForm />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="admin">
              <AdminToggleFeature />
            </TabsContent>
          </Tabs>
        ) : (
          // Regular user view
          <div className="grid gap-6">
            <WeeklyBookingsSummary weekStartDate={currentWeekStart} />
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Vecka {formatWeekRange()}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isLoadingShifts ? (
              <p className="text-center py-10 text-muted-foreground">Laddar säljpass...</p>
            ) : shifts.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <h3 className="text-lg font-semibold mb-2">Inga säljpass för denna vecka</h3>
                  <p className="text-muted-foreground">Det finns inga säljpass tillgängliga för denna vecka</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {Object.entries(groupShiftsByDate()).map(([date, dateShifts]) => (
                  <div key={date} className="mb-6">
                    <h3 className="capitalize text-lg font-medium mb-3">
                      {format(new Date(date), 'EEEE d MMMM', { locale: sv })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dateShifts.map(shift => (
                        <ShiftCard 
                          key={shift.id} 
                          shift={shift} 
                          isUserAdmin={isAdmin}
                          onViewDetails={handleViewShiftDetails}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {shift && (
        <ShiftDetailsDialog
          shift={shift}
          isUserAdmin={isAdmin}
          open={showShiftDialog}
          onOpenChange={setShowShiftDialog}
        />
      )}
    </div>
  );
};

export default Booking;
