
import { useState, Suspense } from 'react';
import { Calendar, Clock, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ShiftCard } from '@/components/booking/ShiftCard';
import { WeeklyBookingsSummary } from '@/components/booking/WeeklyBookingsSummary';
import { ShiftWithBookings } from '@/types/booking';
import { LoadingFallback } from '@/components/common/LoadingFallback';

interface UserBookingViewProps {
  availableShifts: ShiftWithBookings[];
  userBookedShifts: ShiftWithBookings[];
  selectedShifts: string[];
  onSelectShift: (shiftId: string) => void;
  onViewShiftDetails: (shiftId: string) => void;
  onOpenBookingDialog: () => void;
  isLoading: boolean;
}

export const UserBookingView = ({ 
  availableShifts = [], 
  userBookedShifts = [], 
  selectedShifts = [], 
  onSelectShift, 
  onViewShiftDetails, 
  onOpenBookingDialog,
  isLoading
}: UserBookingViewProps) => {
  // Defensive check to ensure we're working with arrays
  const safeAvailableShifts = Array.isArray(availableShifts) ? availableShifts : [];
  const safeUserBookedShifts = Array.isArray(userBookedShifts) ? userBookedShifts : [];
  const safeSelectedShifts = Array.isArray(selectedShifts) ? selectedShifts : [];
  
  // Group shifts by date - ensure we're working with a valid array
  const shiftsByDate = safeAvailableShifts.reduce((acc, shift) => {
    if (!shift || !shift.date) return acc;
    
    const date = shift.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, ShiftWithBookings[]>);

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-1">Bokningar</h1>
        <p className="text-muted-foreground">Boka dina pass för veckan</p>
      </div>
      
      <Suspense fallback={<div className="h-24 bg-card/50 rounded-xl animate-pulse"></div>}>
        <WeeklyBookingsSummary />
      </Suspense>
      
      {safeUserBookedShifts.length > 0 && (
        <div className="mt-8 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-medium text-base">Dina pass</h2>
          </div>
          
          <div className="space-y-3">
            {safeUserBookedShifts.map(shift => (
              <ShiftCard 
                key={shift.id} 
                shift={shift} 
                isUserAdmin={false} 
                onViewDetails={onViewShiftDetails} 
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
        
        {safeSelectedShifts.length > 0 && (
          <div className="mb-4 p-3.5 bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm rounded-lg border border-[#33333A] shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {safeSelectedShifts.length + safeUserBookedShifts.length < 2 ? (
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
                      {safeSelectedShifts.length} pass valda
                    </div>
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                className={`${safeSelectedShifts.length === 0 
                  ? 'bg-gray-600/50 text-gray-300 cursor-not-allowed hover:bg-gray-600/50 border border-gray-600/30' 
                  : 'bg-primary hover:bg-primary/90 shadow-sm'} transition-all duration-200`} 
                onClick={onOpenBookingDialog} 
                disabled={safeSelectedShifts.length === 0}
              >
                Boka valda pass
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card/50 h-24 rounded-xl animate-pulse border border-[#33333A]"></div>
              ))}
            </div>
          ) : safeAvailableShifts.length > 0 ? (
            Object.entries(shiftsByDate).map(([date, dateShifts]) => (
              <div key={date} className="space-y-3">
                {dateShifts.map(shift => (
                  <ShiftCard 
                    key={shift.id} 
                    shift={shift} 
                    isUserAdmin={false} 
                    onViewDetails={onViewShiftDetails} 
                    isSelectable={true} 
                    isSelected={safeSelectedShifts.includes(shift.id)} 
                    onSelectShift={onSelectShift} 
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
  );
};
