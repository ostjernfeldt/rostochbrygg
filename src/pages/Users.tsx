
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AppRole } from "@/types/database";

interface User {
  id: string;
  email: string;
  role?: AppRole;
}

const Users = () => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Hämta alla användare från auth.users
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      // Hämta alla användarroller
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Kombinera användar- och rolldata
      return users.map(user => ({
        id: user.id,
        email: user.email,
        role: roles.find(r => r.user_id === user.id)?.role || 'user'
      })) as User[];
    }
  });

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setIsUpdating(userId);
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select()
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Uppdatera existerande roll
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Skapa ny roll
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast.success("Användarroll uppdaterad");
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Kunde inte uppdatera användarroll");
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return <div className="p-4">Laddar användare...</div>;
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Hantera användare</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Roll</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value: AppRole) => handleRoleChange(user.id, value)}
                  disabled={isUpdating === user.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Users;
