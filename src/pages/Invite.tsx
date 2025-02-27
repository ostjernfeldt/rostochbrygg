
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from 'nanoid';
import { Check, Copy, AlertTriangle, RefreshCw, Trash2, Key, UserX, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Invitation = {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  invitation_token: string;
};

type InvitationStatus = 'active' | 'expired' | 'used' | 'pending';

// Definiera en typ för användarobjektet som returneras från admin API
type SupabaseUser = {
  id: string;
  email?: string | null;
  // Lägg till andra egenskaper om de behövs
};

const Invite = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationStatuses, setInvitationStatuses] = useState<Record<string, InvitationStatus>>({});
  const [regenerateLoading, setRegenerateLoading] = useState<string | null>(null);
  const [deletingInvitation, setDeletingInvitation] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteAccountEmail, setDeleteAccountEmail] = useState("");
  const [isProcessingReset, setIsProcessingReset] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
      if (invitation.used_at !== null) {
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
      setInvitations(data || []);
      
      await verifyInvitationStatus(data || []);
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

  // Skapa en absolut URL som fungerar överallt
  const getAbsoluteUrl = () => {
    // Prioritera att använda window.location.origin som är den mest pålitliga källan
    const origin = window.location.origin;
    console.log("Origin used for creating links:", origin);
    
    // Se till att URL:en har rätt format utan trailing slash
    return origin;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData?.user?.id;
      if (!userId) {
        throw new Error("Du måste vara inloggad för att skapa inbjudningar");
      }

      console.log("Creating invitation for email:", email, "by user:", userId);

      const { data: existingUsers, error: existingError } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email.trim())
        .is('used_at', null);
      
      if (existingError) {
        console.error("Error checking existing invitations:", existingError);
        throw existingError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log("Found existing invitation:", existingUsers);
        throw new Error("Det finns redan en aktiv inbjudan för denna e-postadress");
      }

      const token = nanoid(32);
      console.log("Generated token:", token);
      
      const { data: insertData, error: insertError } = await supabase
        .from('invitations')
        .insert({
          email: email.trim(),
          invitation_token: token,
          created_by: userId
        })
        .select();

      if (insertError) {
        console.error("Error inserting invitation:", insertError);
        throw insertError;
      }

      console.log("Invitation created:", insertData);

      // Skapa enkel URL utan hash-symbol i början
      const baseUrl = getAbsoluteUrl();
      const inviteLink = `${baseUrl}/register?token=${token}`;
      console.log("Generated invite link:", inviteLink);
      
      setGeneratedLink(inviteLink);

      fetchInvitations();

      setEmail("");

      toast({
        title: "Inbjudningslänk skapad!",
        description: "Länken har genererats och kan nu delas med säljaren.",
      });
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      setErrorMessage(error.message || "Ett fel uppstod. Försök igen senare.");
      toast({
        variant: "destructive",
        title: "Kunde inte skapa inbjudan",
        description: error.message || "Ett fel uppstod. Försök igen senare.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateInviteLink = async (invitation: Invitation) => {
    setRegenerateLoading(invitation.id);
    try {
      const newToken = nanoid(32);
      
      const { error } = await supabase
        .from('invitations')
        .update({
          invitation_token: newToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', invitation.id);
      
      if (error) throw error;

      // Skapa inbjudningslänken med den korrekta URL:en
      const baseUrl = getAbsoluteUrl();
      const inviteLink = `${baseUrl}/register?token=${newToken}`;
      
      setInvitations(invitations.map(inv => 
        inv.id === invitation.id 
          ? {...inv, invitation_token: newToken, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()} 
          : inv
      ));
      
      setInvitationStatuses({
        ...invitationStatuses,
        [invitation.id]: 'active'
      });

      navigator.clipboard.writeText(inviteLink);
      setCopied(invitation.id);
      setTimeout(() => setCopied(null), 2000);

      toast({
        title: "Ny länk genererad!",
        description: "En ny inbjudningslänk har skapats och kopierats till urklipp.",
      });
    } catch (error: any) {
      console.error("Error regenerating invite link:", error);
      toast({
        variant: "destructive",
        title: "Kunde inte generera ny länk",
        description: error.message || "Ett fel uppstod. Försök igen senare.",
      });
    } finally {
      setRegenerateLoading(null);
    }
  };

  const generateResetPasswordLink = () => {
    setIsProcessingReset(true);
    setGeneratedResetLink(null);
    
    try {
      if (!resetPasswordEmail.trim() || !resetPasswordEmail.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }
      
      // Generera en token för lösenordsåterställning
      const token = nanoid(32);
      
      // Skapa länken direkt utan att verifiera användaren eller kontakta Supabase
      const baseUrl = getAbsoluteUrl();
      const passwordResetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(resetPasswordEmail.trim())}`;
      
      // Visa den genererade länken direkt
      setGeneratedResetLink(passwordResetLink);
      
      toast({
        title: "Återställningslänk genererad!",
        description: "Länken har genererats och kan nu delas med säljaren.",
      });
    } catch (error: any) {
      console.error("Password reset link generation error:", error);
      toast({
        variant: "destructive",
        title: "Kunde inte skapa återställningslänk",
        description: error.message || "Ett fel uppstod. Försök igen senare.",
      });
    } finally {
      setIsProcessingReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsProcessingDelete(true);
    try {
      if (!deleteAccountEmail.trim() || !deleteAccountEmail.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      // Här behöver vi söka efter användaren baserat på e-post i user_roles tabellen
      // Vi kan dock inte använda email som kolumnnamn eftersom det inte finns direkt i tabellen
      // Istället måste vi använda ett annat sätt för att hitta användaren

      // Försök att hitta användaren direkt via Supabase Auth
      const { data, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error listing users:", authError);
        throw new Error("Det gick inte att hämta användare. Du kanske inte har admin-behörigheter.");
      }
      
      // Explicit typkonvertering för att säkerställa att TypeScript förstår strukturen
      const users = data?.users as SupabaseUser[] || [];
      
      const userToDelete = users.find(user => 
        user.email?.toLowerCase() === deleteAccountEmail.trim().toLowerCase()
      );

      if (!userToDelete) {
        throw new Error(`Hittade ingen användare med e-postadressen ${deleteAccountEmail}`);
      }

      // Använd admin-API för att ta bort användarkontot
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        userToDelete.id
      );

      if (deleteError) throw deleteError;

      toast({
        title: "Konto borttaget",
        description: `Användarkontot för ${deleteAccountEmail} har tagits bort.`,
      });

      setShowDeleteAccountDialog(false);
      setDeleteAccountEmail("");
    } catch (error: any) {
      console.error("Delete account error:", error);
      
      // Om vi får 403 Forbidden så saknar vi admin-behörighet, försök med ett annat sätt
      if (error.status === 403 || error.message.includes("insufficient_permissions")) {
        toast({
          variant: "destructive",
          title: "Behörighetsproblem",
          description: "Du har inte behörighet att ta bort användare direkt. Kontakta system-administratören för att ta bort detta konto.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Kunde inte ta bort konto",
          description: error.message || "Ett fel uppstod. Försök igen senare.",
        });
      }
    } finally {
      setIsProcessingDelete(false);
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

  const copyToClipboard = (link: string, id?: string) => {
    navigator.clipboard.writeText(link);
    if (id) {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } else {
      setCopied("new");
      setTimeout(() => setCopied(null), 2000);
    }
    
    toast({
      title: "Kopierad!",
      description: "Länken har kopierats till urklipp.",
    });
  };

  const getInviteLink = (token: string) => {
    // Använd samma metod som när vi skapar länken för att säkerställa konsistens
    const baseUrl = getAbsoluteUrl();
    return `${baseUrl}/register?token=${token}`;
  };

  const getStatusLabel = (invitation: Invitation) => {
    if (invitation.used_at !== null) {
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
    const inviteLink = getInviteLink(invitation.invitation_token);
    const isUsed = invitation.used_at !== null;
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
              {!isUsed && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(inviteLink, invitation.id)}
                    disabled={regenerateLoading === invitation.id}
                    className="h-7 px-2"
                  >
                    {copied === invitation.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => regenerateInviteLink(invitation)}
                    disabled={regenerateLoading === invitation.id}
                    className="h-7 px-2"
                  >
                    {regenerateLoading === invitation.id ? 
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : 
                      <RefreshCw className="h-3 w-3" />
                    }
                  </Button>
                </>
              )}
              {isUsed && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setResetPasswordEmail(invitation.email);
                      setShowResetPasswordDialog(true);
                      setGeneratedResetLink(null);
                    }}
                    className="h-7 px-2"
                  >
                    <Key className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setDeleteAccountEmail(invitation.email);
                      setShowDeleteAccountDialog(true);
                    }}
                    className="h-7 px-2 text-destructive"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => confirmDeleteInvitation(invitation)}
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
    const inviteLink = getInviteLink(invitation.invitation_token);
    const isUsed = invitation.used_at !== null;
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
              {!isUsed && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(inviteLink, invitation.id)}
                    disabled={regenerateLoading === invitation.id}
                    className="h-7 w-7 p-0"
                  >
                    {copied === invitation.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => regenerateInviteLink(invitation)}
                    disabled={regenerateLoading === invitation.id}
                    className="h-7 w-7 p-0"
                  >
                    {regenerateLoading === invitation.id ? 
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : 
                      <RefreshCw className="h-3 w-3" />
                    }
                  </Button>
                </>
              )}
              {isUsed && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    title="Återställ lösenord"
                    onClick={() => {
                      setResetPasswordEmail(invitation.email);
                      setShowResetPasswordDialog(true);
                      setGeneratedResetLink(null);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Key className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    title="Ta bort konto"
                    onClick={() => {
                      setDeleteAccountEmail(invitation.email);
                      setShowDeleteAccountDialog(true);
                    }}
                    className="h-7 w-7 p-0 text-destructive"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => confirmDeleteInvitation(invitation)}
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
              {errorMessage && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <Input
                    type="email"
                    placeholder="Säljarens e-postadress"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-card/50"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Skapar..." : "Skapa inbjudningslänk"}
                </Button>

                {generatedLink && (
                  <div className="mt-3 p-3 bg-card/30 rounded-md">
                    <p className="text-sm font-medium mb-2">Inbjudningslänk:</p>
                    <div className="relative">
                      <div className="text-xs break-all bg-card/50 p-2 rounded border mb-2 max-h-20 overflow-y-auto">
                        {generatedLink}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full flex items-center justify-center gap-2 h-8 text-xs"
                          onClick={() => copyToClipboard(generatedLink)}
                        >
                          {copied === "new" ? (
                            <>
                              <Check className="h-3 w-3" />
                              Kopierad
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Kopiera länk
                            </>
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 h-8 text-xs"
                          onClick={() => {
                            // Öppna länken direkt i en ny flik
                            window.open(generatedLink, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Testa länken
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Länken är giltig i 7 dagar
                    </p>
                  </div>
                )}
              </form>
            </TabsContent>
            
            <TabsContent value="manage">
              {isLoadingInvitations ? (
                <div className="flex justify-center my-6">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Inga inbjudningar har skapats
                </div>
              ) : isMobile ? (
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
                onClick={fetchInvitations}
                disabled={isLoadingInvitations}
              >
                {isLoadingInvitations ? "Uppdaterar..." : "Uppdatera"}
              </Button>
            </TabsContent>

            <TabsContent value="account">
              <div className="grid grid-cols-1 gap-3 mb-3">
                <Card className="border-white/10 shadow-sm">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-base">Återställ lösenord</CardTitle>
                    <CardDescription className="text-xs">
                      Skapa en återställningslänk för en säljare
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full text-sm h-8"
                      onClick={() => {
                        setShowResetPasswordDialog(true);
                        setGeneratedResetLink(null);
                      }}
                    >
                      <Key className="h-3 w-3 mr-1" /> Skapa återställningslänk
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-white/10 shadow-sm">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-base">Ta bort konto</CardTitle>
                    <CardDescription className="text-xs">
                      Ta bort en säljares konto permanent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full text-sm h-8 text-destructive"
                      onClick={() => setShowDeleteAccountDialog(true)}
                    >
                      <UserX className="h-3 w-3 mr-1" /> Ta bort konto
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Invitation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort inbjudan</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort inbjudan för {invitationToDelete?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvitation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Återställ lösenord</DialogTitle>
            <DialogDescription>
              Ange e-postadressen för kontot
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              type="email"
              placeholder="E-postadress"
              value={resetPasswordEmail}
              onChange={(e) => setResetPasswordEmail(e.target.value)}
              disabled={isProcessingReset}
              className="bg-card/50"
            />
            
            {generatedResetLink && (
              <div className="mt-3 p-3 bg-card/30 rounded-md">
                <p className="text-xs font-medium mb-1">Återställningslänk:</p>
                <div className="relative">
                  <div className="text-xs break-all bg-card/50 p-2 rounded border mb-2 max-h-20 overflow-y-auto">
                    {generatedResetLink}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2 h-8 text-xs"
                    onClick={() => copyToClipboard(generatedResetLink)}
                  >
                    {copied === "reset" ? (
                      <>
                        <Check className="h-3 w-3" />
                        Kopierad
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Kopiera länk
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetPasswordDialog(false)}
              disabled={isProcessingReset}
            >
              Stäng
            </Button>
            {!generatedResetLink && (
              <Button 
                size="sm"
                onClick={generateResetPasswordLink}
                disabled={isProcessingReset}
              >
                {isProcessingReset ? (
                  <>
                    <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Genererar...
                  </>
                ) : (
                  "Generera länk"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ta bort konto</DialogTitle>
            <DialogDescription>
              Ange e-postadressen för kontot som ska tas bort
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              type="email"
              placeholder="E-postadress"
              value={deleteAccountEmail}
              onChange={(e) => setDeleteAccountEmail(e.target.value)}
              disabled={isProcessingDelete}
              className="bg-card/50"
            />
            <p className="text-xs text-destructive mt-2">
              Varning: Detta tar bort kontot permanent
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAccountDialog(false)}
              disabled={isProcessingDelete}
            >
              Avbryt
            </Button>
            <Button 
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={isProcessingDelete}
            >
              {isProcessingDelete ? (
                <>
                  <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Tar bort...
                </>
              ) : (
                "Ta bort konto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invite;
