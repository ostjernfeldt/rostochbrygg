import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export const TimeLeftCard = () => {
  const [timeLeft, setTimeLeft] = useState("0 min");
  const [progressValue, setProgressValue] = useState(0);
  const [isWorkInProgress, setIsWorkInProgress] = useState(false);

  useEffect(() => {
    const updateTimeLeft = () => {
      const startTime = localStorage.getItem("workStartTime") || "17:00";
      const endTime = localStorage.getItem("workEndTime") || "20:00";
      
      const now = new Date();
      const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      const startTimeSeconds = startHours * 3600 + startMinutes * 60;
      const endTimeSeconds = endHours * 3600 + endMinutes * 60;
      
      const totalDuration = endTimeSeconds - startTimeSeconds;
      const timeElapsed = currentTime - startTimeSeconds;
      
      let remainingSeconds = endTimeSeconds - currentTime;
      let progress = (timeElapsed / totalDuration) * 100;
      
      if (currentTime < startTimeSeconds) {
        remainingSeconds = totalDuration;
        progress = 0;
        setIsWorkInProgress(false);
      } else if (currentTime > endTimeSeconds) {
        remainingSeconds = 0;
        progress = 100;
        setIsWorkInProgress(false);
      } else {
        setIsWorkInProgress(true);
      }

      const hours = Math.floor(Math.max(0, remainingSeconds) / 3600);
      const minutes = Math.floor((Math.max(0, remainingSeconds) % 3600) / 60);
      const seconds = Math.floor(Math.max(0, remainingSeconds) % 60);

      let timeString = "";
      if (hours > 0) {
        timeString += `${hours}h `;
      }
      if (minutes > 0 || hours > 0) {
        timeString += `${minutes}m `;
      }
      timeString += `${seconds}s`;
      
      setTimeLeft(timeString);
      setProgressValue(Math.min(100, Math.max(0, progress)));
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-lg">Tid kvar av dagen</span>
        <span className="text-lg font-mono">{timeLeft}</span>
      </div>
      <div className="relative">
        <Progress 
          value={progressValue} 
          className="h-2 relative z-10 bg-opacity-50 [&>div]:animate-pulse [&>div]:shadow-[0_0_10px_rgba(51,195,240,0.7)] [&>div]:bg-primary" 
        />
        <div 
          className="absolute inset-0 bg-primary/20 blur-md rounded-full"
          style={{
            transform: `scaleX(${progressValue / 100})`,
            transformOrigin: 'left',
            transition: 'transform 0.3s ease-out'
          }}
        />
      </div>
      <div className="mt-2">
        {isWorkInProgress ? (
          <span className="text-gray-400">Arbetspasset pågår</span>
        ) : progressValue >= 100 ? (
          <span className="text-gray-400">Dagens arbetspass är slut</span>
        ) : (
          <span className="text-gray-400">
            Inget pass igång för tillfället, visar data från senaste passet
          </span>
        )}
      </div>
    </div>
  );
};