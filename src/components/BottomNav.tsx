import { Home, Trophy, Award, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center">
        <Link to="/" className={`bottom-nav-item ${isActive("/") ? "active" : ""}`}>
          <Home size={24} />
          <span>Hem</span>
        </Link>
        <Link to="/competitions" className={`bottom-nav-item ${isActive("/competitions") ? "active" : ""}`}>
          <Trophy size={24} />
          <span>Tävlingar</span>
        </Link>
        <Link to="/leaderboard" className={`bottom-nav-item ${isActive("/leaderboard") ? "active" : ""}`}>
          <Award size={24} />
          <span>Topplista</span>
        </Link>
        <Link to="/settings" className={`bottom-nav-item ${isActive("/settings") ? "active" : ""}`}>
          <Settings size={24} />
          <span>Inställningar</span>
        </Link>
      </div>
    </nav>
  );
};