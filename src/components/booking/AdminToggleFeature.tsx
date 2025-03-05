
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Settings } from "lucide-react";
import { useBookingSystemEnabled, useToggleBookingSystem } from "@/hooks/useAppSettings";
import { toast } from "@/components/ui/use-toast";

export function AdminToggleFeature() {
  const { isEnabled, isLoading } = useBookingSystemEnabled();
  const [isConfirming, setIsConfirming] = useState(false);
  const toggleFeature = useToggleBookingSystem();

  const handleToggle = async () => {
    if (isEnabled) {
      // If currently enabled, ask for confirmation before disabling
      setIsConfirming(true);
    } else {
      // If currently disabled, enable immediately
      try {
        await toggleFeature.mutateAsync(!isEnabled);
        toast({
          title: "Bokningssystemet aktiverat",
          description: "Säljare kan nu se och boka säljpass",
        });
      } catch (error) {
        console.error("Error toggling feature:", error);
        toast({
          variant: "destructive",
          title: "Ett fel uppstod",
          description: "Kunde inte aktivera bokningssystemet",
        });
      }
    }
  };

  const confirmDisable = async () => {
    try {
      await toggleFeature.mutateAsync(false);
      toast({
        title: "Bokningssystemet inaktiverat",
        description: "Säljare kan inte längre se eller boka säljpass",
      });
      setIsConfirming(false);
    } catch (error) {
      console.error("Error toggling feature:", error);
      toast({
        variant: "destructive",
        title: "Ett fel uppstod",
        description: "Kunde inte inaktivera bokningssystemet",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Systemstatus</CardTitle>
        </div>
        <CardDescription>Hantera åtkomst till bokningssystemet</CardDescription>
      </CardHeader>
      <CardContent>
        {isConfirming ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-400 mb-1">Bekräfta inaktivering</h4>
                <p className="text-sm text-muted-foreground">
                  Om du stänger av bokningssystemet kommer säljare inte längre att kunna se eller boka pass. 
                  Befintliga bokningar påverkas inte.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsConfirming(false)}>
                Avbryt
              </Button>
              <Button variant="destructive" onClick={confirmDisable} disabled={toggleFeature.isPending}>
                {toggleFeature.isPending ? "Inaktiverar..." : "Inaktivera"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Bokningssystem</div>
              <div className="text-sm text-muted-foreground">
                {isEnabled ? "Aktiv för alla säljare" : "Inaktiverat för säljare"}
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isLoading || toggleFeature.isPending}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
