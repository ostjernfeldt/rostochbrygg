import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
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
import { Calendar, Clock, InfoIcon, Settings, User, X, Check } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { BatchBookingConfirmDialog } from '@/components/booking/BatchBookingConfirmDialog';
import { useBatchBookShifts } from '@/hooks/useShiftBookings';

export default function Booking() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  
  const formattedDateRange = `${format(currentWeekStart, 'd MMM', { locale: sv })} - ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;
  
  const { isEnabled: bookingSystemEnabled } = useBookingSystemEnabled();
  
  const { shifts, isLoading: shiftsLoading } = useShifts(currentWeekStart, weekEnd);
  const { shift: selectedShift, isLoading: shiftDetailsLoading } = useShiftDetails(
    selectedShiftId || ''
  );
  
  const { mutate: batchBookShifts, isPending: isBatchBooking } = useBatchBookShifts();
  
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      
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
  
  const handleViewShiftDetails = (shiftId: string) => {
    if (!isSelectionMode) {
      setSelectedShiftId(shiftId);
      setDialogOpen(true);
    }
  };
  
  const handleSelectShift = (shiftId: string) => {
    if (isSelectionMode) {
      setSelectedShifts(prevSelected => {
        if (prevSelected.includes(shiftId)) {
          return prevSelected.filter(id => id !== shiftId);
        } else {
          return [...prevSelected, shiftId];
        }
      });
    }
  };
  
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedShifts([]);
    }
  };
  
  const handleConfirmBookings = () => {
    batchBookShifts(selectedShifts, {
      onSuccess: () => {
        setConfirmDialogOpen(false);
        setIsSelectionMode(false);
        setSelectedShifts([]);
      }
    });
  };
  
  const processedShifts: ShiftWithBookings[] = shifts.map(shift => {
    return {
      ...shift,
      bookings: shift.bookings || [],
      available_slots_remaining: shift.available_slots_remaining !== undefined 
        ? shift.available_slots_remaining 
        : shift.available_slots,
      is_booked_by_current_user: shift.is_booked_by_current_user || false
    };
  });

  const selectedShiftsData: ShiftWithBookings[] = processedShifts
    .filter(shift => selectedShifts.includes(shift.id));
  
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
            <Card className="bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm border-[#33333A] shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-medium">Skapa nytt säljpass</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CreateShiftForm />
              </CardContent>
            </Card>
            
            <AdminToggleFeature />
          </div>
          
          <Card className="bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm border-[#33333A] shadow-lg">
            <CardHeader className="flex-row justify-between items-center pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg font-medium">Säljpass denna vecka</CardTitle>
                  <div className="text-sm text-muted-foreground">{formattedDateRange}</div>
                </div>
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
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Välkommen {userName || ''}</h1>
            </div>
            
            <Card className="w-full bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm border-[#33333A] shadow-lg mb-6">
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
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Välkommen {userName || ''}</h1>
          </div>
          
          <WeeklyBookingsSummary />
          
          {userBookedShifts.length > 0 && (
            <div className="mt-8 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="font-medium text-base">Dina pass</h2>
              </div>
              
              <div className="space-y-3">
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
          
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="font-medium text-base">Tillgängliga pass</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 px-3 py-1.5 rounded-md shadow-md border border-[#33333A]/50">
                  <span className="text-xs text-muted-foreground">{formattedDateRange}</span>
                </div>
                
                <Button
                  variant={isSelectionMode ? "secondary" : "outline"}
                  size="sm"
                  className={`text-xs h-8 ${isSelectionMode ? 'bg-primary/20 text-primary border-primary/20' : ''}`}
                  onClick={toggleSelectionMode}
                >
                  {isSelectionMode ? (
                    <>
                      <X className="h-3.5 w-3.5 mr-1" /> Avbryt val
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" /> Välj flera
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {isSelectionMode && selectedShifts.length > 0 && (
              <div className="mb-4 flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <span className="text-sm">{selectedShifts.length} pass valda</span>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  Boka valda pass
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              {shiftsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card/50 h-24 rounded-xl animate-pulse border border-[#33333A]"></div>
                  ))}
                </div>
              ) : processedShifts.length > 0 ? (
                Object.entries(shiftsByDate).map(([date, dateShifts]) => (
                  <div key={date} className="space-y-3">
                    {dateShifts.map(shift => (
                      <ShiftCard 
                        key={shift.id} 
                        shift={shift} 
                        isUserAdmin={isAdmin}
                        onViewDetails={handleViewShiftDetails}
                        isSelectable={isSelectionMode}
                        isSelected={selectedShifts.includes(shift.id)}
                        onSelectShift={handleSelectShift}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 rounded-xl border border-[#33333A] shadow-lg">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">Inga säljpass tillgängliga för denna vecka.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 mb-8 shadow-md">
            <div className="flex gap-3">
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
      {renderContent()}
      
      {selectedShift && (
        <ShiftDetailsDialog 
          shift={selectedShift} 
          isUserAdmin={isAdmin}
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
        />
      )}
      
      <BatchBookingConfirmDialog
        shifts={selectedShiftsData}
        isOpen={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmBookings}
        isPending={isBatchBooking}
      />
    </PageLayout>
  );
}
