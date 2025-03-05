import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShiftWithBookings } from '@/types/booking';
import { ShiftCard } from '@/components/booking/ShiftCard';
import { ShiftDetailsDialog } from '@/components/booking/ShiftDetailsDialog';
import { CreateShiftForm } from '@/components/booking/CreateShiftForm';
import { AdminToggleFeature } from '@/components/booking/AdminToggleFeature';
import { WeeklyBookingsSummary } from '@/components/booking/WeeklyBookingsSummary';
import { useShifts, useShiftDetails } from '@/hooks/useShifts';
import { useBookingSystemEnabled } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, ChevronLeft, ChevronRight, Clock, InfoIcon, Settings, User } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';

export default function Booking() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const navigate = useNavigate();
  
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const formattedDateRange = `${format(currentWeekStart, 'd MMM', { locale: sv })} - ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;
  
  const { isEnabled: bookingSystemEnabled } = useBookingSystemEnabled();
  
  const { shifts, isLoading: shiftsLoading } = useShifts(currentWeekStart, weekEnd);
  const { shift: selectedShift, isLoading: shiftDetailsLoading } = useShiftDetails(
    selectedShiftId || ''
  );
  
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      
      // Get user display name
      try {
        const { data, error } = await supabase
          .from('staff_roles')
          .select('user_display_name')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (data && !error) {
          setUserName(data.user_display_name);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
      
      // Check if user is admin
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error checking user role:', error);
          return;
        }
        
        setIsAdmin(data.role === 'admin');
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserSession();
  }, [navigate]);
  
  const handlePreviousWeek = () => {
    setCurrentWeekStart(prevDate => subWeeks(prevDate, 1));
  };
  
  const handleNextWeek = () => {
    setCurrentWeekStart(prevDate => addWeeks(prevDate, 1));
  };
  
  const handleViewShiftDetails = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setDialogOpen(true);
  };
  
  const processedShifts: ShiftWithBookings[] = shifts.map(shift => {
    return {
      ...shift,
      bookings: [],
      available_slots_remaining: shift.available_slots,
      is_booked_by_current_user: false
    };
  });

  const shiftsByDate = processedShifts.reduce((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, ShiftWithBookings[]>);

  const userBookedShifts = processedShifts.filter(shift => 
    shift.is_booked_by_current_user
  );
  
  const renderContent = () => {
    if (!user) return null;
    
    if (isAdmin) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-[#33333A]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Skapa nytt säljpass</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CreateShiftForm />
              </CardContent>
            </Card>
            
            <AdminToggleFeature />
          </div>
          
          <Card className="bg-card border-[#33333A]">
            <CardHeader className="flex-row justify-between items-center pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Säljpass denna vecka</CardTitle>
                  <div className="text-sm text-muted-foreground">{formattedDateRange}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handlePreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {shiftsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card/50 h-32 rounded-xl animate-pulse border border-[#33333A]"></div>
                  ))}
                </div>
              ) : processedShifts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {processedShifts.map(shift => (
                    <ShiftCard 
                      key={shift.id} 
                      shift={shift} 
                      isUserAdmin={isAdmin}
                      onViewDetails={handleViewShiftDetails}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">Inga säljpass schemalagda för denna vecka.</p>
                  <p className="text-xs text-muted-foreground mt-1">Skapa nya pass med formuläret ovan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    } else {
      if (!bookingSystemEnabled) {
        return (
          <div className="max-w-md mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-semibold">Välkommen {userName || ''}</h1>
            </div>
            
            <Card className="w-full bg-card/50 border-[#33333A] mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center p-4">
                  <Clock className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-2">Bokningssystemet är stängt</h3>
                  <p className="text-muted-foreground">
                    Bokningssystemet är för närvarande inte tillgängligt. Återkom senare eller kontakta din säljledare.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }
      
      return (
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Välkommen {userName || ''}</h1>
          </div>
          
          <WeeklyBookingsSummary weekStartDate={currentWeekStart} />
          
          {userBookedShifts.length > 0 && (
            <div className="mt-6 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-medium text-[15px]">Dina pass</h2>
              </div>
              
              <div className="space-y-2">
                {userBookedShifts.map(shift => (
                  <ShiftCard 
                    key={shift.id} 
                    shift={shift} 
                    isUserAdmin={false}
                    onViewDetails={handleViewShiftDetails}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-medium text-[15px]">Tillgängliga pass</h2>
              </div>
              <div className="flex items-center gap-1 text-sm bg-card/60 px-2 py-1 rounded">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={handlePreviousWeek}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground">{formattedDateRange}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={handleNextWeek}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {shiftsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card/50 h-24 rounded-xl animate-pulse border border-[#33333A]"></div>
                  ))}
                </div>
              ) : processedShifts.length > 0 ? (
                Object.entries(shiftsByDate).map(([date, dateShifts]) => (
                  <div key={date} className="space-y-2">
                    {dateShifts.map(shift => (
                      <ShiftCard 
                        key={shift.id} 
                        shift={shift} 
                        isUserAdmin={isAdmin}
                        onViewDetails={handleViewShiftDetails}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-card/50 rounded-xl border border-[#33333A]">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">Inga säljpass tillgängliga för denna vecka.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 mb-8">
            <div className="flex gap-2">
              <InfoIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-400 mb-1">Viktigt om bokningar</h3>
                <p className="text-sm text-muted-foreground">
                  Kom ihåg att boka minst 2 pass per vecka. Om du behöver avboka ett pass måste du kontakta din säljledare direkt.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };
  
  return (
    <PageLayout>
      <div className="container mx-auto">
        {renderContent()}
        
        {selectedShift && (
          <ShiftDetailsDialog 
            shift={selectedShift} 
            isUserAdmin={isAdmin}
            open={dialogOpen} 
            onOpenChange={setDialogOpen} 
          />
        )}
      </div>
    </PageLayout>
  );
}
