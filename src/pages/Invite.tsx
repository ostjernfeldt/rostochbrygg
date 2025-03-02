
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Invitation, InvitationStatus } from "@/components/invite/types";
import { CreateInviteForm } from "@/components/invite/CreateInviteForm";
import { InvitationsList } from "@/components/invite/InvitationsList";
import { ConfirmDeleteDialog } from "@/components/invite/ConfirmDeleteDialog";
import { ResetPasswordDialog } from "@/components/invite/ResetPasswordDialog";
import { DeleteAccountDialog } from "@/components/invite/DeleteAccountDialog";
import { AccountManagementSection } from "@/components/invite/AccountManagementSection";

const Invite = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationStatuses, setInvitationStatuses] = useState<Record<string, InvitationStatus>>({});
  const [deletingInvitation, setDeletingInvitation] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteAccountEmail, setDeleteAccountEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking auth:", error);
        setIsLoggedIn(false);
      } else {
        setIsLoggedIn(!!data.session);
        if (data.session) {
          fetchInvitations();
        }
      }
    };

    checkAuth();
  }, []);

  const verifyInvitationStatus = async (invitations: Invitation[]) => {
    const statuses: Record<string, InvitationStatus> = {};
    
    for (const invitation of invitations) {
      if (invitation.used_at !== null || invitation.status === 'used') {
        statuses[invitation.id] = 'used';
        continue;
      }
      
      if (new Date(invitation.expires_at) < new Date()) {
        statuses[invitation.id] = 'expired';
        continue;
      }
      
      statuses[invitation.id] = 'active';
    }
    
    setInvitationStatuses(statuses);
  };

  const fetchInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      console.log("Fetching invitations...");
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log("Received invitations:", data);
      
      // Make sure each invitation has a status field
      const invitationsWithStatus = data?.map((inv) => ({
        ...inv,
        status: inv.status || (inv.used_at ? 'used' : 'pending')
      })) as Invitation[];
      
      setInvitations(invitationsWithStatus);
      await verifyInvitationStatus(invitationsWithStatus);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      toast({
        variant: "destructive",
        title: "Kunde inte hämta inbjudningar",
        description: "Ett fel uppstod när inbjudningarna skulle hämtas.",
      });
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const confirmDeleteInvitation = (invitation: Invitation) => {
    setInvitationToDelete(invitation);
    setShowDeleteDialog(true);
  };

  const handleDeleteInvitation = async () => {
    if (!invitationToDelete) return;
    
    const invitationId = invitationToDelete.id;
    const invitationEmail = invitationToDelete.email;
    
    setDeletingInvitation(invitationId);
    setShowDeleteDialog(false);
    
    try {
      console.log("Deleting invitation with ID:", invitationId);
      
      const { data, error, status } = await supabase.rpc('delete_invitation', {
        invitation_id: invitationId
      });
      
      console.log("RPC delete response:", { data, error, status });
      
      if (error) {
        console.error("RPC delete error:", error);
        throw error;
      }
      
      setInvitations(prevInvitations => 
        prevInvitations.filter(inv => inv.id !== invitationId)
      );
      
      toast({
        title: "Inbjudan borttagen",
        description: `Inbjudan för ${invitationEmail} har tagits bort.`,
      });
      
    } catch (error: any) {
      console.error("Error during deletion:", error);
      
      toast({
        variant: "destructive",
        title: "Kunde inte ta bort inbjudan",
        description: error.message || "Ett fel uppstod när inbjudan skulle tas bort.",
      });
      
      fetchInvitations();
    } finally {
      setDeletingInvitation(null);
      setInvitationToDelete(null);
    }
  };

  const handleOpenResetPasswordDialog = (email = "") => {
    setResetPasswordEmail(email);
    setShowResetPasswordDialog(true);
  };

  const handleOpenDeleteAccountDialog = (email = "") => {
    setDeleteAccountEmail(email);
    setShowDeleteAccountDialog(true);
  };

  if (isLoggedIn === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm shadow-md">
          <CardHeader>
            <CardTitle>Åtkomst nekad</CardTitle>
            <CardDescription>
              Du måste vara inloggad för att bjuda in nya säljare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate("/login")}
            >
              Gå till inloggning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 bg-background">
      <Card className="w-full max-w-xl shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Inbjudningar</CardTitle>
          <CardDescription>
            Hantera inbjudningar för nya säljare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="create" className="flex-1">Skapa</TabsTrigger>
              <TabsTrigger value="manage" className="flex-1">Hantera</TabsTrigger>
              <TabsTrigger value="account" className="flex-1">Konton</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <CreateInviteForm onInviteCreated={fetchInvitations} />
            </TabsContent>
            
            <TabsContent value="manage">
              <InvitationsList 
                invitations={invitations}
                isLoading={isLoadingInvitations}
                onRefresh={fetchInvitations}
                invitationStatuses={invitationStatuses}
                onDeleteClick={confirmDeleteInvitation}
                onResetPasswordClick={handleOpenResetPasswordDialog}
                onDeleteAccountClick={handleOpenDeleteAccountDialog}
              />
            </TabsContent>

            <TabsContent value="account">
              <AccountManagementSection 
                onResetPasswordClick={() => handleOpenResetPasswordDialog("")}
                onDeleteAccountClick={() => handleOpenDeleteAccountDialog("")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        invitation={invitationToDelete}
        onConfirm={handleDeleteInvitation}
      />

      <ResetPasswordDialog
        open={showResetPasswordDialog}
        onOpenChange={setShowResetPasswordDialog}
        initialEmail={resetPasswordEmail}
      />

      <DeleteAccountDialog
        open={showDeleteAccountDialog}
        onOpenChange={setShowDeleteAccountDialog}
        initialEmail={deleteAccountEmail}
      />
    </div>
  );
};

export default Invite;
