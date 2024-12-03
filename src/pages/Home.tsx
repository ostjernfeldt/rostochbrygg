import { Settings, UserRound } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const updateTimeLeft = () => {
      const startTime = localStorage.getItem("workStartTime") || "17:00";
      const endTime = localStorage.getItem("workEndTime") || "20:00";
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      const startTimeMinutes = startHours * 60 + startMinutes;
      const endTimeMinutes = endHours * 60 + endMinutes;
      
      // Calculate total work duration and time elapsed
      const totalDuration = endTimeMinutes - startTimeMinutes;
      const timeElapsed = currentTime - startTimeMinutes;
      
      // Calculate remaining time and progress
      let remainingMinutes = endTimeMinutes - currentTime;
      let progress = (timeElapsed / totalDuration) * 100;
      
      // Handle cases where current time is outside work hours
      if (currentTime < startTimeMinutes) {
        remainingMinutes = totalDuration;
        progress = 0;
      } else if (currentTime > endTimeMinutes) {
        remainingMinutes = 0;
        progress = 100;
      }
      
      // Update state
      setTimeLeft(`${Math.max(0, Math.round(remainingMinutes))} min`);
      setProgressValue(Math.min(100, Math.max(0, progress)));
    };

    // Update immediately and then every minute
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 pb-24">
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
          <span className="text-lg">{timeLeft}</span>
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
        <div className="text-4xl font-bold mt-1">SEK 15,000</div>
        <div className="text-green-500 mt-1">+10% från förra gången</div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:400ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Antal sälj</span>
        <div className="text-4xl font-bold mt-1">42</div>
        <div className="text-green-500 mt-1">+15% från förra gången</div>
      </div>

      <div className="stat-card animate-fade-in [animation-delay:600ms] hover:scale-[1.02] transition-transform duration-200">
        <span className="text-gray-400 text-lg">Snittordervärde</span>
        <div className="text-4xl font-bold mt-1">SEK 327</div>
        <div className="text-red-500 mt-1">-5% från förra gången</div>
      </div>
    </div>
  );
};

export default Home;