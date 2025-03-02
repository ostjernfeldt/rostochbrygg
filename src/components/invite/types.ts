
export type Invitation = {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  status: string;
  created_by?: string | null;
  invitation_token: string;
};

export type InvitationStatus = 'active' | 'expired' | 'used' | 'pending';

export type SupabaseUser = {
  id: string;
  email?: string | null;
};
