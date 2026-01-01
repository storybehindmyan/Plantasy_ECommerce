import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showMenuButton }) => {
  const { adminUser } = useAuth();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden admin-btn-ghost p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {/* Search */}
        <div className="hidden sm:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="admin-input pl-10 w-64 py-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="admin-btn-ghost p-2 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {adminUser?.displayName?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{adminUser?.displayName || 'Admin'}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {adminUser?.role?.replace('_', ' ') || 'User'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
