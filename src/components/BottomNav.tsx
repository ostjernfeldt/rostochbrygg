
import { useLocation, Link } from "react-router-dom";
import { Trophy, Home, Users, Receipt } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export const BottomNav = () => {
  const location = useLocation();
  const { data: userRole } = useUserRole();
  
  const isActive = (path: string) => location.pathname === path;

  // Visa bara relevanta navigationslänkar baserat på användarroll
  const links = userRole === 'admin' ? [
    { path: '/', icon: Home, label: 'Hem' },
    { path: '/leaderboard', icon: Trophy, label: 'Topplista' },
    { path: '/staff', icon: Users, label: 'Personal' },
    { path: '/transactions', icon: Receipt, label: 'Transaktioner' },
  ] : [
    { path: '/leaderboard', icon: Trophy, label: 'Topplista' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10">
      <div className="flex justify-around items-center h-16 px-4 mx-auto max-w-lg">
        {links.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              isActive(path)
                ? "text-primary"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
