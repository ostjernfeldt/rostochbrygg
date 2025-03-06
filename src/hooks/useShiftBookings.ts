
// This file is maintained for backward compatibility
// It re-exports all hooks from the new modular structure
// New code should import directly from '@/hooks/booking'

import { useBookShift } from './booking/useBookShift';
import { useBatchBookShifts } from './booking/useBatchBookShifts';
import { useCancelBooking, useCancelUserBooking } from './booking/useCancelBooking';
import { useWeeklyBookingSummary } from './booking/useWeeklyBookingSummary';

export {
  useBookShift,
  useBatchBookShifts,
  useCancelBooking,
  useCancelUserBooking,
  useWeeklyBookingSummary
};
