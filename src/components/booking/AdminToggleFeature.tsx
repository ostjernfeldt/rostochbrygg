
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookingSystemEnabled } from "@/hooks/useAppSettings";

export function AdminToggleFeature() {
  const { isEnabled, setEnabled, isLoading, isUpdating } = useBookingSystemEnabled();
  
  const handleToggleChange = (checked: boolean) => {
    setEnabled(checked);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Administrera bokningssystemet</CardTitle>
        <CardDescription>
          Styr om bokningssystemet ska vara tillgängligt för användare
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch 
            id="booking-system-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggleChange}
            disabled={isLoading || isUpdating}
          />
          <Label htmlFor="booking-system-toggle">
            {isEnabled ? "Bokningssystemet är aktiverat" : "Bokningssystemet är inaktiverat"}
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {isEnabled 
            ? "Användare kan se och boka säljpass" 
            : "Användare ser ett meddelande om att bokningssystemet är stängt"
          }
        </p>
      </CardContent>
    </Card>
  );
}
