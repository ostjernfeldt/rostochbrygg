
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from 'nanoid';
import { Check, Copy, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
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

// Definiera en typ för inbjudningar
type Invitation = {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  invitation_token: string;
};

type InvitationStatus = 'active' | 'expired' | 'used' | 'pending';

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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Kontrollera om användaren är inloggad
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
    
    // Kontrollera varje inbjudan
    for (const invitation of invitations) {
      // Om den redan är markerad som använd
      if (invitation.used_at !== null) {
        statuses[invitation.id] = 'used';
        continue;
      }
      
      // Om den har gått ut
      if (new Date(invitation.expires_at) < new Date()) {
        statuses[invitation.id] = 'expired';
        continue;
      }
      
      // Kontrollera om det finns en användare med denna e-post i auth
      try {
        // Eftersom vi inte kan söka direkt i auth.users via API:et,
        // använder vi user_roles för att försöka hitta om det finns en användare med denna e-post
        const { data: userRoles, error: userRolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', invitation.email);
          
        if (userRolesError) {
          console.error("Error checking user roles:", userRolesError);
        }
        
        // Användaren har registrerats men inbjudan är inte markerad som använd
        if (userRoles && userRoles.length > 0) {
          statuses[invitation.id] = 'pending';
          continue;
        }
        
        // Kontrollera med en annan metod (genom profiles om det finns)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', invitation.email);
          
        if (profilesError) {
          console.error("Error checking profiles:", profilesError);
        }
        
        if (profiles && profiles.length > 0) {
          statuses[invitation.id] = 'pending';
          continue;
        }
        
        // Om vi inte kan bekräfta att användaren finns, markera som aktiv
        statuses[invitation.id] = 'active';
        
      } catch (error) {
        console.error("Error verifying invitation status:", error);
        statuses[invitation.id] = 'active'; // Default om något går fel
      }
    }
    
    setInvitationStatuses(statuses);
  };

  const fetchInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setInvitations(data || []);
      
      // Verifiera status för varje inbjudan
      await verifyInvitationStatus(data || []);
    } catch (error) {
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Validera e-postadressen
      if (!email.trim() || !email.includes('@')) {
        throw new Error("Vänligen ange en giltig e-postadress");
      }

      // Kontrollera om användaren är inloggad
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData?.user?.id;
      if (!userId) {
        throw new Error("Du måste vara inloggad för att skapa inbjudningar");
      }

      console.log("Creating invitation for email:", email, "by user:", userId);

      // Kontrollera om e-postadressen redan är registrerad
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

      // Skapa en unik token för inbjudan
      const token = nanoid(32);
      console.log("Generated token:", token);
      
      // Spara inbjudan i databasen
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

      // Generera inbjudningslänken med absolut URL
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/register?token=${token}`;
      console.log("Generated invite link:", inviteLink);
      
      setGeneratedLink(inviteLink);

      // Uppdatera listan med inbjudningar
      fetchInvitations();

      // Rensa formuläret
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
      // Skapa en ny token
      const newToken = nanoid(32);
      
      // Uppdatera inbjudan i databasen
      const { error } = await supabase
        .from('invitations')
        .update({
          invitation_token: newToken,
          // Förnya utgångsdatum om inbjudan har förfallit
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', invitation.id);
      
      if (error) throw error;

      // Generera ny inbjudningslänk
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/register?token=${newToken}`;
      
      // Uppdatera lokal data
      setInvitations(invitations.map(inv => 
        inv.id === invitation.id 
          ? {...inv, invitation_token: newToken, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()} 
          : inv
      ));
      
      // Uppdatera status för denna inbjudan
      setInvitationStatuses({
        ...invitationStatuses,
        [invitation.id]: 'active'
      });

      // Kopiera länkar automatiskt till urklipp
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

  const confirmDeleteInvitation = (invitation: Invitation) => {
    setInvitationToDelete(invitation);
    setShowDeleteDialog(true);
  };

  const handleDeleteInvitation = async () => {
    if (!invitationToDelete) return;
    
    setDeletingInvitation(invitationToDelete.id);
    setShowDeleteDialog(false);
    
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationToDelete.id);
      
      if (error) throw error;
      
      // Ta bort från lokal data
      setInvitations(invitations.filter(inv => inv.id !== invitationToDelete.id));
      
      toast({
        title: "Inbjudan borttagen",
        description: `Inbjudan för ${invitationToDelete.email} har tagits bort.`,
      });
    } catch (error: any) {
      console.error("Error deleting invitation:", error);
      toast({
        variant: "destructive",
        title: "Kunde inte ta bort inbjudan",
        description: error.message || "Ett fel uppstod när inbjudan skulle tas bort.",
      });
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
      description: "Inbjudningslänken har kopierats till urklipp.",
    });
  };

  const getInviteLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?token=${token}`;
  };

  const getStatusLabel = (invitation: Invitation) => {
    const status = invitationStatuses[invitation.id];
    
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

  if (isLoggedIn === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Bjud in säljare</CardTitle>
          <CardDescription>
            Hantera inbjudningar för nya säljare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create">
            <TabsList className="mb-4">
              <TabsTrigger value="create">Skapa ny inbjudan</TabsTrigger>
              <TabsTrigger value="manage">Hantera inbjudningar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              {errorMessage && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Säljarens e-postadress"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
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
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-2">Inbjudningslänk:</p>
                    <div className="relative">
                      <div className="text-sm break-all bg-background p-3 rounded border mb-2 max-h-24 overflow-y-auto">
                        {generatedLink}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => copyToClipboard(generatedLink)}
                      >
                        {copied === "new" ? (
                          <>
                            <Check className="h-4 w-4" />
                            Kopierad
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Kopiera länk
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Denna länk är giltig i 7 dagar. Säljaren kommer att kunna välja sitt lösenord när de registrerar sig.
                    </p>
                  </div>
                )}
              </form>
            </TabsContent>
            
            <TabsContent value="manage">
              {isLoadingInvitations ? (
                <div className="flex justify-center my-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Inga inbjudningar har skapats än.
                </div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 bg-muted p-3 border-b text-sm font-medium">
                    <div className="col-span-4">E-post</div>
                    <div className="col-span-3">Skapad</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2">Åtgärd</div>
                  </div>
                  <div className="divide-y">
                    {invitations.map((invitation) => {
                      const statusInfo = getStatusLabel(invitation);
                      const inviteLink = getInviteLink(invitation.invitation_token);
                      const isUsed = invitation.used_at !== null;
                      const isDeleting = deletingInvitation === invitation.id;
                      
                      return (
                        <div key={invitation.id} className="grid grid-cols-12 p-3 text-sm items-center">
                          <div className="col-span-4 font-medium">{invitation.email}</div>
                          <div className="col-span-3 text-muted-foreground">
                            {format(new Date(invitation.created_at), 'yyyy-MM-dd')}
                          </div>
                          <div className="col-span-3">
                            <span className={`px-2 py-1 ${statusInfo.className} rounded-full text-xs`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="col-span-2 flex gap-2">
                            {isDeleting ? (
                              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                {!isUsed && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => copyToClipboard(inviteLink, invitation.id)}
                                      disabled={regenerateLoading === invitation.id}
                                    >
                                      {copied === invitation.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => regenerateInviteLink(invitation)}
                                      disabled={regenerateLoading === invitation.id}
                                    >
                                      {regenerateLoading === invitation.id ? 
                                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : 
                                        <RefreshCw className="h-3 w-3" />
                                      }
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => confirmDeleteInvitation(invitation)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={fetchInvitations}
                disabled={isLoadingInvitations}
              >
                {isLoadingInvitations ? "Uppdaterar..." : "Uppdatera lista"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort inbjudan</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort inbjudan för {invitationToDelete?.email}? Denna åtgärd kan inte ångras.
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
    </div>
  );
};

export default Invite;
