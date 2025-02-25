
export interface Challenge {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  reward: number;
  created_at?: string;
  updated_at?: string;
}
