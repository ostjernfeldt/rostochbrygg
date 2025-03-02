
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
      className="animate-fade-in bg-card/80 border-primary/10 shadow-sm overflow-hidden" 
      style={{ animationDelay }}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-gray-400">Roll:</span>{" "}
              <span className="font-medium">{currentRole}</span>
            </div>
            {nextRole && pointsToNextLevel > 0 && (
              <div className="text-gray-400 text-xs">
                <span className="text-primary font-medium">{pointsToNextLevel}p</span> till {nextRole}
              </div>
            )}
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-primary/5" 
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{currentPoints}p</span>
            {nextThreshold && (
              <span>{nextThreshold}p</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
