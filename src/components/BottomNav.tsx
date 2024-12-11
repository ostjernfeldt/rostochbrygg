import { Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/", label: "Idag" },
    { path: "/competitions", label: "Tävlingar" },
    { path: "/leaderboard", label: "Topplista" },
    { path: "/staff", label: "Personal" },
    { path: "/learn", label: "Lär dig" },
    { path: "/settings", label: "Inställningar" },
  ];

  return (
    <div className="fixed top-4 left-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <button className="p-2 rounded-lg bg-card hover:bg-card/80 transition-colors">
            <Menu className="h-6 w-6 text-white" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] bg-card border-r border-gray-800">
          <nav className="flex flex-col gap-2 mt-8">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                }}
                className={`p-3 text-left rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-card/80"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};