
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
import { WeeklyBookingsSummary } from '@/components/booking/WeeklyBookingsSummary';
import { useShifts, useShiftDetails } from '@/hooks/useShifts';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, InfoIcon, Settings, User, X, Check, AlertTriangle } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { BatchBookingConfirmDialog } from '@/components/booking/BatchBookingConfirmDialog';
import { useBatchBookShifts } from '@/hooks/useShiftBookings';
import { toast } from "@/hooks/use-toast";

export default function Booking() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const navigate = useNavigate();
  const today = new Date();
  const currentWeekStart = startOfWeek(today, {
    weekStartsOn: 1
  });
  const weekEnd = endOfWeek(currentWeekStart, {
    weekStartsOn: 1
  });
  const formattedDateRange = `${format(currentWeekStart, 'd MMM', {
    locale: sv
  })} - ${format(weekEnd, 'd MMM yyyy', {
    locale: sv
  })}`;
  
  const {
    shifts,
    isLoading: shiftsLoading
  } = useShifts(currentWeekStart, weekEnd);
  const {
    shift: selectedShift,
    isLoading: shiftDetailsLoading
  } = useShiftDetails(selectedShiftId || '');
  const {
    mutate: batchBookShifts,
    isPending: isBatchBooking
  } = useBatchBookShifts();

  useEffect(() => {
    const checkUserSession = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      try {
        const {
          data,
          error
        } = await supabase.from('staff_roles').select('user_display_name').eq('id', session.user.id).maybeSingle();
        if (data && !error) {
          setUserName(data.user_display_name);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
      try {
        const {
          data,
          error
        } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
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
    setSelectedShiftId(shiftId);
    setDialogOpen(true);
  };

  const handleSelectShift = (shiftId: string) => {
    setSelectedShifts(prevSelected => {
      if (prevSelected.includes(shiftId)) {
        return prevSelected.filter(id => id !== shiftId);
      } else {
        return [...prevSelected, shiftId];
      }
    });
  };

  const handleConfirmBookings = () => {
    batchBookShifts(selectedShifts, {
      onSuccess: () => {
        setConfirmDialogOpen(false);
        setSelectedShifts([]);
      }
    });
  };

  const handleOpenBookingDialog = () => {
    if (selectedShifts.length < 2) {
      toast({
        title: "För få pass valda",
        description: "Du behöver välja minst 2 pass för att kunna boka",
        variant: "destructive",
      });
      return;
    }
    setConfirmDialogOpen(true);
  };

  const processedShifts: ShiftWithBookings[] = shifts.map(shift => {
    return {
      ...shift,
      bookings: shift.bookings || [],
      available_slots_remaining: shift.available_slots_remaining !== undefined ? shift.available_slots_remaining : shift.available_slots,
      is_booked_by_current_user: shift.is_booked_by_current_user || false
    };
  });

  const selectedShiftsData: ShiftWithBookings[] = processedShifts.filter(shift => selectedShifts.includes(shift.id));

  // Filter out shifts that are already booked by the current user for the "Available shifts" section
  const availableShifts = processedShifts.filter(shift => !shift.is_booked_by_current_user);

  const shiftsByDate = availableShifts.reduce((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, ShiftWithBookings[]>);

  const userBookedShifts = processedShifts.filter(shift => shift.is_booked_by_current_user);

  const renderContent = () => {
    if (!user) return null;
    if (isAdmin) {
      return <div className="space-y-6">
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
              {shiftsLoading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => <div key={i} className="bg-card/50 h-32 rounded-xl animate-pulse border border-[#33333A]"></div>)}
                </div> : processedShifts.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {processedShifts.map(shift => <ShiftCard key={shift.id} shift={shift} isUserAdmin={isAdmin} onViewDetails={handleViewShiftDetails} />)}
                </div> : <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">Inga säljpass schemalagda för denna vecka.</p>
                  <p className="text-xs text-muted-foreground mt-1">Skapa nya pass med formuläret ovan</p>
                </div>}
            </CardContent>
          </Card>
        </div>;
    } else {
      return <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
          </div>
          
          <WeeklyBookingsSummary />
          
          {userBookedShifts.length > 0 && <div className="mt-8 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="font-medium text-base">Dina pass</h2>
              </div>
              
              <div className="space-y-3">
                {userBookedShifts.map(shift => <ShiftCard key={shift.id} shift={shift} isUserAdmin={false} onViewDetails={handleViewShiftDetails} />)}
              </div>
            </div>}
          
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="font-medium text-base">Tillgängliga pass</h2>
              </div>
            </div>
            
            {selectedShifts.length > 0 && (
              <div className="mb-4 p-3.5 bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm rounded-lg border border-[#33333A] shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {selectedShifts.length < 2 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600/30 text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                        <div className="font-medium">
                          <span className="text-amber-400">Minst 2 krävs</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <div className="font-medium text-white">
                          {selectedShifts.length} pass valda
                        </div>
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className={`${selectedShifts.length < 2 
                      ? 'bg-gray-600/50 text-gray-300 cursor-not-allowed hover:bg-gray-600/50 border border-gray-600/30' 
                      : 'bg-primary hover:bg-primary/90 shadow-sm'} transition-all duration-200`}
                    onClick={handleOpenBookingDialog}
                    disabled={selectedShifts.length < 2}
                  >
                    Boka valda pass
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {shiftsLoading ? <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="bg-card/50 h-24 rounded-xl animate-pulse border border-[#33333A]"></div>)}
                </div> : availableShifts.length > 0 ? Object.entries(shiftsByDate).map(([date, dateShifts]) => <div key={date} className="space-y-3">
                    {dateShifts.map(shift => <ShiftCard key={shift.id} shift={shift} isUserAdmin={isAdmin} onViewDetails={handleViewShiftDetails} isSelectable={true} isSelected={selectedShifts.includes(shift.id)} onSelectShift={handleSelectShift} />)}
                  </div>) : <div className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 rounded-xl border border-[#33333A] shadow-lg">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">Inga lediga säljpass tillgängliga för denna vecka.</p>
                </div>}
            </div>
          </div>
        </div>;
    }
  };

  return <PageLayout>
      {renderContent()}
      
      {selectedShift && <ShiftDetailsDialog shift={selectedShift} isUserAdmin={isAdmin} open={dialogOpen} onOpenChange={setDialogOpen} />}
      
      <BatchBookingConfirmDialog shifts={selectedShiftsData} isOpen={confirmDialogOpen} onOpenChange={setConfirmDialogOpen} onConfirm={handleConfirmBookings} isPending={isBatchBooking} />
    </PageLayout>;
}
