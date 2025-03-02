
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
      className="animate-fade-in overflow-hidden bg-gradient-to-r from-card/90 to-card/70 border border-primary/10 shadow-md" 
      style={{ animationDelay }}
    >
      <CardContent className="p-3">
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-gray-400 text-xs">NUVARANDE ROLL</span>
              <div className="font-medium text-white/90">{currentRole}</div>
            </div>
            {nextRole && pointsToNextLevel > 0 && (
              <div className="text-right">
                <span className="text-gray-400 text-xs">NÄSTA NIVÅ</span>
                <div className="text-primary/90 font-medium text-sm">{nextRole}</div>
              </div>
            )}
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-1.5 bg-primary/5" 
          />
          
          <div className="flex justify-between text-xs">
            <span className="text-white/70">{currentPoints}p</span>
            {nextThreshold && pointsToNextLevel > 0 && (
              <span className="text-primary/80">{pointsToNextLevel}p kvar</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
