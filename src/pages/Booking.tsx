import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShiftWithBookings } from '@/types/booking';
import { ShiftCard } from '@/components/booking/ShiftCard';
import { ShiftDetailsDialog } from '@/components/booking/ShiftDetailsDialog';
import { CreateShiftForm } from '@/components/booking/CreateShiftForm';
import { WeeklyBookingsSummary } from '@/components/booking/WeeklyBookingsSummary';
import { useShifts } from '@/hooks/useShifts';
import { useShiftDetails } from '@/hooks/useShiftDetails';
import { useBatchBookShifts } from '@/hooks/booking';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, InfoIcon, Settings, User, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { BatchBookingConfirmDialog } from '@/components/booking/BatchBookingConfirmDialog';
import { toast } from "@/hooks/use-toast";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Booking page error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
          <h2 className="text-xl font-semibold mb-2">Något gick fel</h2>
          <p className="text-muted-foreground mb-4">{this.state.errorMessage || 'Ett fel uppstod vid laddning av sidan'}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Försök igen
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-muted-foreground">Laddar bokningar...</p>
  </div>
);

export default function Booking() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
    shifts = [],
    isLoading: shiftsLoading,
    error: shiftsError
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
      try {
        setIsLoading(true);
        
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError);
          setAuthError('Kunde inte verifiera din inloggning. Vänligen logga in igen.');
          navigate('/login');
          return;
        }
        
        if (!session) {
          console.log('No active session found, redirecting to login');
          setAuthError('Din session har utgått. Vänligen logga in igen.');
          navigate('/login');
          return;
        }
        
        setUser(session.user);
        
        try {
          const {
            data,
            error
          } = await supabase.from('staff_roles').select('user_display_name').eq('email', session.user.email).maybeSingle();
          
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
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        setAuthError('Ett oväntat fel uppstod. Vänligen försök igen.');
      } finally {
        setIsLoading(false);
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
    console.log('Confirming batch bookings for shifts:', selectedShifts);
    batchBookShifts(selectedShifts, {
      onSuccess: data => {
        console.log('Batch booking success:', data);
        setConfirmDialogOpen(false);
        setSelectedShifts([]);

        queryClient.invalidateQueries({
          queryKey: ['shifts']
        });
        queryClient.invalidateQueries({
          queryKey: ['weekly-booking-summary']
        });

        if (data.errors && data.errors.length > 0 && data.results && data.results.length > 0) {
          setTimeout(() => {
            toast({
              title: "Delvis framgång",
              description: `${data.results.length} pass bokades framgångsrikt, men ${data.errors.length} pass kunde inte bokas.`
            });
          }, 300);
        } else if (!data.errors || data.errors.length === 0) {
          setTimeout(() => {
            toast({
              title: "Bokningar genomförda",
              description: "Dina pass har bokats framgångsrikt"
            });
          }, 300);
        }
      },
      onError: error => {
        console.error('Batch booking error:', error);
        toast({
          variant: "destructive",
          title: "Fel vid bokning",
          description: error instanceof Error ? error.message : "Ett fel uppstod vid bokning av passen"
        });
      }
    });
  };

  const handleOpenBookingDialog = () => {
    const totalBookedOrSelected = selectedShifts.length + (userBookedShifts?.length || 0);
    
    if (selectedShifts.length === 0) {
      toast({
        title: "Inga pass valda",
        description: "Du behöver välja minst ett pass för att kunna boka",
        variant: "destructive"
      });
      return;
    }
    
    if (totalBookedOrSelected < 2) {
      toast({
        title: "För få pass valda",
        description: "Du behöver välja fler pass, totalt behöver du ha bokat minst 2 pass per vecka",
        variant: "destructive"
      });
      return;
    }
    
    setConfirmDialogOpen(true);
  };

  const processedShifts: ShiftWithBookings[] = Array.isArray(shifts) ? shifts.map(shift => {
    return {
      ...shift,
      bookings: shift.bookings || [],
      available_slots_remaining: shift.available_slots_remaining !== undefined ? shift.available_slots_remaining : shift.available_slots,
      is_booked_by_current_user: shift.is_booked_by_current_user || false
    };
  }) : [];

  const selectedShiftsData: ShiftWithBookings[] = Array.isArray(processedShifts) && Array.isArray(selectedShifts) 
    ? processedShifts.filter(shift => selectedShifts.includes(shift.id))
    : [];
    
  const availableShifts = Array.isArray(processedShifts) 
    ? processedShifts.filter(shift => !shift.is_booked_by_current_user)
    : [];
    
  const shiftsByDate = Array.isArray(availableShifts) 
    ? availableShifts.reduce((acc, shift) => {
        const date = shift.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(shift);
        return acc;
      }, {} as Record<string, ShiftWithBookings[]>)
    : {};

  const userBookedShifts = Array.isArray(processedShifts) 
    ? processedShifts.filter(shift => shift.is_booked_by_current_user)
    : [];

  if (isLoading) {
    return (
      <PageLayout>
        <LoadingFallback />
      </PageLayout>
    );
  }

  if (authError) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] p-6">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
          <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
          <p className="text-muted-foreground mb-4">{authError}</p>
          <Button onClick={() => navigate('/login')} variant="default">
            Gå till inloggning
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (shiftsError) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] p-6">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
          <h2 className="text-xl font-semibold mb-2">Kunde inte ladda bokningar</h2>
          <p className="text-muted-foreground mb-4">
            {shiftsError instanceof Error ? shiftsError.message : 'Ett fel uppstod vid laddning av bokningar'}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Försök igen
          </Button>
        </div>
      </PageLayout>
    );
  }

  const renderContent = () => {
    if (!user) return <LoadingFallback />;
    
    if (isAdmin) {
      return (
        <ErrorBoundary>
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
                ) : Array.isArray(processedShifts) && processedShifts.length > 0 ? (
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
        </ErrorBoundary>
      );
    } else {
      return (
        <ErrorBoundary>
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-6"></div>
            
            <Suspense fallback={<div className="h-24 bg-card/50 rounded-xl animate-pulse"></div>}>
              <WeeklyBookingsSummary />
            </Suspense>
            
            {Array.isArray(userBookedShifts) && userBookedShifts.length > 0 && (
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
              </div>
              
              {Array.isArray(selectedShifts) && selectedShifts.length > 0 && (
                <div className="mb-4 p-3.5 bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm rounded-lg border border-[#33333A] shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {selectedShifts.length + (userBookedShifts?.length || 0) < 2 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600/30 text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                          <div className="font-medium">
                            <span className="text-amber-400">Minst 2 krävs totalt</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <div className="font-medium text-white">
                            {selectedShifts.length} pass valda {Array.isArray(userBookedShifts) && userBookedShifts.length > 0 
                              ? `(totalt ${selectedShifts.length + userBookedShifts.length} med dina bokade pass)` 
                              : ''}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      className={`${!Array.isArray(selectedShifts) || selectedShifts.length === 0 
                        ? 'bg-gray-600/50 text-gray-300 cursor-not-allowed hover:bg-gray-600/50 border border-gray-600/30' 
                        : 'bg-primary hover:bg-primary/90 shadow-sm'} transition-all duration-200`} 
                      onClick={handleOpenBookingDialog} 
                      disabled={!Array.isArray(selectedShifts) || selectedShifts.length === 0}
                    >
                      Boka valda pass
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {shiftsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-card/50 h-24 rounded-xl animate-pulse border border-[#33333A]"></div>
                    ))}
                  </div>
                ) : Array.isArray(availableShifts) && availableShifts.length > 0 ? (
                  Object.entries(shiftsByDate).map(([date, dateShifts]) => (
                    <div key={date} className="space-y-3">
                      {dateShifts.map(shift => (
                        <ShiftCard 
                          key={shift.id} 
                          shift={shift} 
                          isUserAdmin={isAdmin} 
                          onViewDetails={handleViewShiftDetails} 
                          isSelectable={true} 
                          isSelected={Array.isArray(selectedShifts) && selectedShifts.includes(shift.id)} 
                          onSelectShift={handleSelectShift} 
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 rounded-xl border border-[#33333A] shadow-lg">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground">Inga ytterligare säljpass tillgängliga för denna vecka.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ErrorBoundary>
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
      
      {Array.isArray(selectedShiftsData) && selectedShiftsData.length > 0 && (
        <BatchBookingConfirmDialog 
          shifts={selectedShiftsData} 
          isOpen={confirmDialogOpen} 
          onOpenChange={setConfirmDialogOpen} 
          onConfirm={handleConfirmBookings} 
          isPending={isBatchBooking}
          existingBookingsCount={userBookedShifts?.length || 0}
        />
      )}
    </PageLayout>
  );
}
