
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBookingSystemEnabled } from "@/hooks/useAppSettings";

export function AdminToggleFeature() {
  const { isEnabled, setEnabled, isLoading } = useBookingSystemEnabled();

  const handleToggle = async () => {
    await setEnabled(!isEnabled);
  };

  return (
    <Card className="bg-card border-[#33333A]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Bokningssystem</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-card/80 p-4 rounded-xl border border-[#33333A]/50 shadow-sm">
          <div className="flex items-center justify-between space-y-0">
            <div className="space-y-0.5">
              <Label htmlFor="booking-system-toggle" className="text-base font-medium">
                {isEnabled ? "Aktiverat" : "Inaktiverat"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isEnabled
                  ? "Säljare kan boka säljpass."
                  : "Bokningssystemet är stängt för säljare."}
              </p>
            </div>
            <Switch
              id="booking-system-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
