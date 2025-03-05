
// This file is now just a re-export to maintain backward compatibility
// New code should import directly from the shifts directory
import { 
  useGetShifts, 
  useGetShiftDetails, 
  useCreateShift,
  useDeleteShift 
} from './shifts';

// Re-export with original names for backward compatibility
export const useShifts = useGetShifts;
export const useShiftDetails = useGetShiftDetails;
export { useCreateShift, useDeleteShift };
