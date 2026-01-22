import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showMenuButton }) => {
  const { adminUser } = useAuth();

  return (
  <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30 relative">
    {/* Left: menu button */}
    <div className="flex items-center gap-4">
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="lg:hidden admin-btn-ghost p-2"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </div>

    {/* Center: Logo */}
    <div className="absolute left-1/2 transform -translate-x-1/2">
      <div className="flex items-center gap-2">
        {/* replace src with your logo path */}
        <img
          src="\favicon.ico"
          alt="Plantasy"
          className="h-36 w-auto object-contain"
        />
      </div>
    </div>

    {/* Right: User avatar */}
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
          {adminUser?.displayName?.charAt(0).toUpperCase() || "A"}
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium">
            {adminUser?.displayName || "Admin"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {adminUser?.role?.replace("_", " ") || "User"}
          </p>
        </div>
      </div>
    </div>
  </header>
);

};

export default Header;
