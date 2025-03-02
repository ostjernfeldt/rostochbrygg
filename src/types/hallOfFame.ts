
export interface ManualHallOfFameEntry {
  id: string;
  category: 'sale' | 'day' | 'month';
  user_display_name: string;
  points: number;
  description?: string;
  date?: string;
  month?: string;
  created_at?: string;
  updated_at?: string;
}
