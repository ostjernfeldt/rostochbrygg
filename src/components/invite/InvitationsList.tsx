
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, Key, UserX, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

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

interface InvitationsListProps {
  invitations: Invitation[];
  isLoading: boolean;
  onRefresh: () => void;
  invitationStatuses: Record<string, InvitationStatus>;
  onDeleteClick: (invitation: Invitation) => void;
  onResetPasswordClick: (email: string) => void;
  onDeleteAccountClick: (email: string) => void;
}

export const InvitationsList = ({
  invitations,
  isLoading,
  onRefresh,
  invitationStatuses,
  onDeleteClick,
  onResetPasswordClick,
  onDeleteAccountClick
}: InvitationsListProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [deletingInvitation, setDeletingInvitation] = useState<string | null>(null);

  const getStatusLabel = (invitation: Invitation) => {
    if (invitation.used_at !== null || invitation.status === 'used') {
      return {
        label: "Använd",
        className: "bg-green-100 text-green-800"
      };
    }
    
    if (new Date(invitation.expires_at) < new Date()) {
      return {
        label: "Utgången",
        className: "bg-red-100 text-red-800"
      };
    }
    
    const status = invitationStatuses[invitation.id];
    if (status === 'pending') {
      return {
        label: "Inloggning krävs",
        className: "bg-yellow-100 text-yellow-800"
      };
    }
    
    return {
      label: "Aktiv",
      className: "bg-blue-100 text-blue-800"
    };
  };

  const renderMobileInvitationItem = (invitation: Invitation) => {
    const statusInfo = getStatusLabel(invitation);
    const isUsed = invitation.used_at !== null || invitation.status === 'used';
    const isDeleting = deletingInvitation === invitation.id;
    
    return (
      <div key={invitation.id} className="p-3 border rounded-md mb-2 bg-card shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm truncate max-w-[160px]">{invitation.email}</span>
          <span className={`px-1.5 py-0.5 ${statusInfo.className} rounded-full text-xs`}>
            {statusInfo.label}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">
          {format(new Date(invitation.created_at), 'yyyy-MM-dd')}
        </div>
        
        <div className="flex gap-1 justify-end">
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              {isUsed && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onResetPasswordClick(invitation.email)}
                    className="h-7 px-2"
                  >
                    <Key className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDeleteAccountClick(invitation.email)}
                    className="h-7 px-2 text-destructive"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDeleteClick(invitation)}
                className="h-7 px-2 text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderDesktopInvitationItem = (invitation: Invitation) => {
    const statusInfo = getStatusLabel(invitation);
    const isUsed = invitation.used_at !== null || invitation.status === 'used';
    const isDeleting = deletingInvitation === invitation.id;
    
    return (
      <div key={invitation.id} className="grid grid-cols-12 p-3 text-sm items-center hover:bg-card/50 transition-colors">
        <div className="col-span-4 font-medium truncate">{invitation.email}</div>
        <div className="col-span-3 text-muted-foreground">
          {format(new Date(invitation.created_at), 'yyyy-MM-dd')}
        </div>
        <div className="col-span-3">
          <span className={`px-2 py-0.5 ${statusInfo.className} rounded-full text-xs`}>
            {statusInfo.label}
          </span>
        </div>
        <div className="col-span-2 flex gap-1 justify-end">
          {isDeleting ? (
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              {isUsed && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    title="Återställ lösenord"
                    onClick={() => onResetPasswordClick(invitation.email)}
                    className="h-7 w-7 p-0"
                  >
                    <Key className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    title="Ta bort konto"
                    onClick={() => onDeleteAccountClick(invitation.email)}
                    className="h-7 w-7 p-0 text-destructive"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDeleteClick(invitation)}
                className="h-7 w-7 p-0 text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-6">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Inga inbjudningar har skapats
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <div className="space-y-2">
          {invitations.map(renderMobileInvitationItem)}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-12 bg-card/30 p-2 border-b text-xs font-medium">
            <div className="col-span-4">E-post</div>
            <div className="col-span-3">Skapad</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Åtgärd</div>
          </div>
          <div className="divide-y">
            {invitations.map(renderDesktopInvitationItem)}
          </div>
        </div>
      )}
      
      <Button 
        variant="outline" 
        size="sm"
        className="mt-3 w-full"
        onClick={onRefresh}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Uppdaterar...
          </>
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-1" /> Uppdatera
          </>
        )}
      </Button>
    </>
  );
};
