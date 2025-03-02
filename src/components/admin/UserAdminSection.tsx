
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, UserX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DeleteAccountDialog } from "@/components/invite/DeleteAccountDialog";

type UserData = {
  id: string;
  email: string;
  username?: string;
  last_sign_in_at?: string;
  role?: string;
};

export const UserAdminSection = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get users from the auth.users table through a function invocation
      const { data, error } = await supabase.functions.invoke('list-users', {
        body: {}
      });

      if (error) {
        throw error;
      }

      if (data && data.users) {
        // Fetch roles for each user
        const usersWithRoles = await Promise.all(
          data.users.map(async (user: any) => {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id)
              .single();
              
            return {
              ...user,
              role: roleData?.role || "user"
            };
          })
        );
        
        setUsers(usersWithRoles);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Kunde inte hämta användare",
        description: error.message || "Ett fel uppstod vid hämtning av användare",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (email: string) => {
    setSelectedUserEmail(email);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Aldrig";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <Card className="border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Hantera användare</CardTitle>
          <CardDescription>
            Se och hantera alla användare i systemet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
            >
              {isLoading ? "Hämtar..." : "Uppdatera listan"}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Hämtar användare...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Inga användare hittades</div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {users.map((user) => (
                <Card key={user.id} className="bg-card/50 border-gray-800">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="overflow-hidden">
                        <p className="font-medium">{user.username || "Namnlös användare"}</p>
                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {user.role}
                          </span>
                          <span className="text-xs text-gray-400">
                            Senast inloggad: {formatDate(user.last_sign_in_at)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(user.email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteAccountDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        initialEmail={selectedUserEmail}
      />
    </div>
  );
};
