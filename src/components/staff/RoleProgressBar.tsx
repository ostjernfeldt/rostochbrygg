
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
    <Card 
      className="animate-fade-in bg-gradient-to-r from-card to-card/80 border-primary/20 shadow-lg overflow-hidden" 
      style={{ animationDelay }}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">Din nuvarande roll</h3>
              <p className="text-2xl font-bold">{currentRole}</p>
            </div>
            {nextRole && (
              <div className="text-right space-y-1">
                <h3 className="text-sm text-gray-400">Nästa nivå</h3>
                <p className="text-lg font-medium text-gray-300">{nextRole}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-primary/10" 
            />
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>{currentPoints} poäng</span>
              {nextThreshold && (
                <span>{nextThreshold} poäng</span>
              )}
            </div>
          </div>
          
          {nextRole && pointsToNextLevel > 0 && (
            <div className="mt-3 px-4 py-2 bg-primary/10 rounded-md text-center">
              <p className="text-sm font-medium">
                <span className="text-primary font-bold">{pointsToNextLevel} poäng</span> till {nextRole}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
