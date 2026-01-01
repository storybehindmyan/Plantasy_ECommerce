import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  FileText,
  Star,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: ('super_admin' | 'editor' | 'support')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package, },
  { label: 'Orders', path: '/orders', icon: ShoppingCart },
  { label: 'Coupons', path: '/coupons', icon: Ticket,  },
  { label: 'Blogs', path: '/blogs', icon: FileText,  },
  { label: 'Reviews', path: '/reviews', icon: Star },
  { label: 'Support', path: '/support', icon: MessageSquare },
  { label: 'Admin Users', path: '/admin-users', icon: Users,  },
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const { adminUser, logout, hasPermission } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return hasPermission(item.roles);
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-sidebar z-40 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <Store className="w-6 h-6 text-sidebar-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">Admin Panel</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center mx-auto">
            <Store className="w-6 h-6 text-sidebar-foreground" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${
                    isCollapsed ? 'justify-center px-3' : ''
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
<div className="p-3 border-t border-sidebar-border">
  {!isCollapsed && adminUser && (
    <div className="mb-3 px-3 py-2">
      <p className="text-sm font-medium text-sidebar-foreground truncate">
        {adminUser.displayName || 'Admin'}
      </p>
      <p className="text-xs text-sidebar-foreground/60 truncate">
        {adminUser.email || 'admin@example.com'}
      </p>
      <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-sidebar-accent text-sidebar-foreground capitalize">
        {(adminUser.role || 'admin').replace('_', ' ')}
      </span>
    </div>
  )}

        
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10 ${
            isCollapsed ? 'justify-center px-3' : ''
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
