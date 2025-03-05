
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBookingSystemEnabled } from "@/hooks/useAppSettings";
import { useEffect } from "react";

export function AdminToggleFeature() {
  const { isEnabled, setEnabled, isLoading } = useBookingSystemEnabled();

  // Add debugging to check the value when the component mounts
  useEffect(() => {
    console.log('AdminToggleFeature rendered, isEnabled:', isEnabled);
  }, [isEnabled]);

  const handleToggle = async () => {
    console.log('Toggling booking system from', isEnabled, 'to', !isEnabled);
    await setEnabled(!isEnabled);
  };

  return (
    <Card className="bg-gradient-to-br from-[#1A1F2C]/90 to-[#222632]/95 backdrop-blur-sm border-[#33333A] shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium">Bokningssystem</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black/20 p-5 rounded-xl border border-[#33333A]/50 shadow-sm">
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
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
