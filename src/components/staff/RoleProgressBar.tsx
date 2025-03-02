
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RoleProgressBarProps {
  currentRole: string;
  nextRole?: string;
  currentPoints: number;
  currentThreshold: number;
  nextThreshold?: number;
  animationDelay?: string;
}

export const RoleProgressBar = ({
  currentRole,
  nextRole,
  currentPoints,
  currentThreshold,
  nextThreshold,
  animationDelay = "0ms"
}: RoleProgressBarProps) => {
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!nextThreshold) return 100; // If there's no next level, show 100%
    
    const pointsInCurrentLevel = currentPoints - currentThreshold;
    const pointsNeededForNextLevel = nextThreshold - currentThreshold;
    
    // Calculate percentage, but ensure it's between 0 and 100
    const percentage = Math.min(
      Math.max(
        Math.floor((pointsInCurrentLevel / pointsNeededForNextLevel) * 100),
        0
      ),
      100
    );
    
    return percentage;
  };

  const progressPercentage = getProgressPercentage();
  const pointsToNextLevel = nextThreshold 
    ? nextThreshold - currentPoints 
    : 0;

  return (
    <Card className="animate-fade-in" style={{ animationDelay }}>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">
              {currentRole}
            </span>
            {nextRole && (
              <span className="text-sm font-medium">
                {nextRole}
              </span>
            )}
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{currentPoints} poäng</span>
            {nextThreshold && (
              <span>{nextThreshold} poäng</span>
            )}
          </div>
          
          {nextRole && (
            <p className="text-sm text-center mt-2 text-muted-foreground">
              {pointsToNextLevel} poäng till {nextRole}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
