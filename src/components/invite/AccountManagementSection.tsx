
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, UserX } from "lucide-react";

interface AccountManagementProps {
  onResetPasswordClick: () => void;
  onDeleteAccountClick: () => void;
}

export const AccountManagementSection = ({
  onResetPasswordClick,
  onDeleteAccountClick
}: AccountManagementProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 mb-3">
      <Card className="border-white/10 shadow-sm">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-base">Återställ lösenord</CardTitle>
          <CardDescription className="text-xs">
            Återställ lösenord för en säljare
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <Button 
            variant="outline"
            size="sm"
            className="w-full text-sm h-8"
            onClick={onResetPasswordClick}
          >
            <Key className="h-3 w-3 mr-1" /> Återställ lösenord
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
            onClick={onDeleteAccountClick}
          >
            <UserX className="h-3 w-3 mr-1" /> Ta bort konto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
