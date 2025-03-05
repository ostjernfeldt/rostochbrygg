export interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  available_slots: number;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftWithBookings extends Shift {
  bookings: ShiftBooking[];
  available_slots_remaining: number;
  is_booked_by_current_user: boolean;
}

export interface ShiftBooking {
  id: string;
  shift_id: string;
  user_id: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_display_name?: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyBookingSummary {
  week_start: string;
  week_end: string;
  total_bookings: number;
  meets_minimum_requirement: boolean;
}

export interface Invitation {
  id: string;
  email: string;
  display_name?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}
