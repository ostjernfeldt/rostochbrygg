import { Settings, UserRound } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { useCountAnimation } from "@/hooks/useCountAnimation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Home = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState("0 min");
  const [progressValue, setProgressValue] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Only animate if the page was actually refreshed
  useEffect(() => {
    const lastRefreshTime = localStorage.getItem('lastRefreshTime');
    const currentTime = Date.now();
    
    // If there's no last refresh time, or if it's been more than 1 second since last refresh
    if (!lastRefreshTime || currentTime - parseInt(lastRefreshTime) > 1000) {
      setShouldAnimate(true);
      localStorage.setItem('lastRefreshTime', currentTime.toString());
    } else {
      setShouldAnimate(false);
    }

    // Cleanup on unmount
    return () => {
      if (shouldAnimate) {
        setShouldAnimate(false);
      }
    };
  }, []);

  const animatedSalesAmount = useCountAnimation(shouldAnimate ? 15000 : 0, 2000);
  const animatedSalesCount = useCountAnimation(shouldAnimate ? 42 : 0, 2000);
  const animatedAverageValue = useCountAnimation(shouldAnimate ? 327 : 0, 2000);

  const handleSignOut = () => {
    localStorage.removeItem("isAuthenticated");
    toast({
      title: "Utloggad",
      description: "Du har loggats ut",
      className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
      duration: 1000,
    });
    navigate("/login");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = document.documentElement.scrollTop;
    if (scrollTop <= 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      if (distance > 0 && distance < 200) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 100) {
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      window.location.reload();
    }
    setStartY(0);
    setPullDistance(0);
  };

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
      } else if (currentTime > endTimeSeconds) {
        remainingSeconds = 0;
        progress = 100;
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
    <div 
      className="p-4 pb-24 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 flex justify-center items-center"
          style={{ 
            height: `${pullDistance}px`,
            transition: isRefreshing ? 'none' : 'height 0.2s ease-out'
          }}
        >
          <div className={`
            w-8 h-8 border-2 border-t-primary border-r-primary border-b-transparent border-l-transparent 
            rounded-full 
            ${isRefreshing ? 'animate-spin' : 'transform'} 
            ${!isRefreshing && `rotate-[${Math.min(pullDistance * 2, 360)}deg]`}
          `} />
        </div>
      )}

      <img 
        src="/lovable-uploads/f3b5392a-fb40-467e-b32d-aa71eb2156af.png" 
        alt="R&B Logo" 
        className="h-16 w-auto mb-4 mx-auto object-contain"
      />
      <div className="flex justify-between items-start mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-left">Välkommen Oscar</h1>
          <p className="text-gray-400 text-lg text-left">Här kan du se statistiken från idag.</p>
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 mt-2 text-gray-400 hover:text-primary transition-colors"
          >
            <Settings size={24} />
            <span>Inställningar för dagen</span>
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-2">
              <UserRound size={24} className="text-white hover:text-primary transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black text-white border-none">
            <DropdownMenuItem onClick={handleSignOut} className="hover:bg-gray-900 focus:bg-gray-900">
              Logga ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="stat-card animate-fade-in hover:scale-[1.02] transition-transform duration-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-lg">Tid kvar av dagen</span>
          <span className="text-lg font-mono">{timeLeft}</span>
        </div>
        <Progress value={progressValue} className="h-2" />
        <div className="mt-2">
          <span className="text-gray-400">
            {progressValue >= 100 ? "Dagens arbetspass är slut" : "Arbetspasset pågår"}
          </span>
        </div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:200ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Total försäljning</span>
        <div className="text-4xl font-bold mt-1">SEK {shouldAnimate ? animatedSalesAmount.toLocaleString() : "15,000"}</div>
        <div className="text-green-500 mt-1">+10% från förra gången</div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:400ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Antal sälj</span>
        <div className="text-4xl font-bold mt-1">{shouldAnimate ? animatedSalesCount : "42"}</div>
        <div className="text-green-500 mt-1">+15% från förra gången</div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:600ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Snittordervärde</span>
        <div className="text-4xl font-bold mt-1">SEK {shouldAnimate ? animatedAverageValue : "327"}</div>
        <div className="text-red-500 mt-1">-5% från förra gången</div>
      </div>
    </div>
  );
};

export default Home;
