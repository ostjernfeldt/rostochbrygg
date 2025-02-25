
import { Database as GeneratedDatabase } from "@/integrations/supabase/types";

export type AppRole = 'admin' | 'user';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export type Database = GeneratedDatabase & {
  public: {
    Tables: {
      user_roles: {
        Row: UserRole;
        Insert: Omit<UserRole, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserRole, 'id'>>;
      };
    } & GeneratedDatabase['public']['Tables'];
  };
};
