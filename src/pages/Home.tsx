import { Settings, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeLeftCard } from "@/components/stats/TimeLeftCard";
import { SalesStats } from "@/components/stats/SalesStats";
import { PageLayout } from "@/components/PageLayout";

const Home = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  useEffect(() => {
    const lastRefreshTime = localStorage.getItem('lastRefreshTime');
    const currentTime = Date.now();
    
    if (!lastRefreshTime || currentTime - parseInt(lastRefreshTime) > 1000) {
      setShouldAnimate(true);
      localStorage.setItem('lastRefreshTime', currentTime.toString());
    } else {
      setShouldAnimate(false);
    }

    return () => {
      if (shouldAnimate) {
        setShouldAnimate(false);
      }
    };
  }, []);

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

  return (
    <PageLayout>
      <div 
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

        <TimeLeftCard />
        <SalesStats shouldAnimate={shouldAnimate} />
      </div>
    </PageLayout>
  );
};

export default Home;
