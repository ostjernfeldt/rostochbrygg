
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAuth } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShiftWithBookings } from '@/types/booking';
import { ShiftCard } from '@/components/booking/ShiftCard';
import { ShiftDetailsDialog } from '@/components/booking/ShiftDetailsDialog';
import { CreateShiftForm } from '@/components/booking/CreateShiftForm';
import { AdminToggleFeature } from '@/components/booking/AdminToggleFeature';
import { WeeklyBookingsSummary } from '@/components/booking/WeeklyBookingsSummary';
import { useShifts, useShiftDetails } from '@/hooks/useShifts';
import { useBookingSystemEnabled } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Booking() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const user = useAuth();
  const navigate = useNavigate();
  
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const formattedDateRange = `${format(currentWeekStart, 'd MMM', { locale: sv })} - ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;
  
  const { isEnabled: bookingSystemEnabled } = useBookingSystemEnabled();
  
  const { shifts, isLoading: shiftsLoading } = useShifts(currentWeekStart, weekEnd);
  const { shift: selectedShift, isLoading: shiftDetailsLoading } = useShiftDetails(
    selectedShiftId || ''
  );
  
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
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
    
    checkUserRole();
  }, [user, navigate]);
  
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
  
  // Get shifts with booking data for admin users
  const processedShifts: ShiftWithBookings[] = shifts.map(shift => {
    // For regular users without detailed booking data, we create a placeholder version
    return {
      ...shift,
      bookings: [],
      available_slots_remaining: shift.available_slots,
      is_booked_by_current_user: false
    };
  });
  
  const renderContent = () => {
    if (!user) return null;
    
    if (isAdmin) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skapa nytt säljpass</CardTitle>
                <CardDescription>Lägg till ett nytt säljpass för bokningar</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateShiftForm />
              </CardContent>
            </Card>
            
            <AdminToggleFeature />
          </div>
          
          <Card>
            <CardHeader className="flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Säljpass denna vecka</CardTitle>
                <CardDescription>{formattedDateRange}</CardDescription>
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
                <p>Laddar säljpass...</p>
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
                <p className="text-muted-foreground">Inga säljpass schemalagda för denna vecka.</p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    } else {
      // Regular user view
      if (!bookingSystemEnabled) {
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">Bokningssystemet är stängt</CardTitle>
              <CardDescription>
                Bokningssystemet är för närvarande inte tillgängligt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Säljledningen har stängt av bokningssystemet tillfälligt. Vänligen återkom senare eller kontakta din säljledare för mer information.
              </p>
            </CardContent>
          </Card>
        );
      }
      
      return (
        <div className="space-y-6">
          <WeeklyBookingsSummary weekStartDate={currentWeekStart} />
          
          <Card>
            <CardHeader className="flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Tillgängliga säljpass</CardTitle>
                <CardDescription>{formattedDateRange}</CardDescription>
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
                <p>Laddar säljpass...</p>
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
                <p className="text-muted-foreground">Inga säljpass tillgängliga för denna vecka.</p>
              )}
            </CardContent>
          </Card>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <h3 className="font-medium text-yellow-800 mb-2">Viktigt om bokningar</h3>
            <p className="text-yellow-700 text-sm">
              Kom ihåg att boka minst 2 pass per vecka. Om du behöver avboka ett pass måste du kontakta din säljledare direkt.
            </p>
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Bokningssystem för säljpass</h1>
      
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
  );
}
