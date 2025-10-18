'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './providers/AuthProvider';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Stethoscope, 
  User, 
  Brain, 
  Settings,
  LogOut,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Households', href: '/households', icon: Home },
  { name: 'Visits', href: '/visits', icon: Stethoscope },
  { name: 'Users', href: '/users', icon: User },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Brain },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  // Don't show sidebar on login/register pages
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileSidebar}
          className="h-10 w-10 bg-white shadow-md"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40",
        "fixed inset-y-0 left-0 transform",
        "lg:relative lg:translate-x-0",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <div className={cn(
              "flex items-center transition-opacity duration-200",
              isCollapsed ? "w-full justify-center opacity-100" : "w-full opacity-100"
            )}>
              {!isCollapsed && (
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">⚕️</span>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-semibold text-gray-900">HealthSaaS</h1>
                    <p className="text-xs text-gray-500">Community Health</p>
                  </div>
                </div>
              )}
              {isCollapsed && (
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚕️</span>
                </div>
              )}
              
              {/* Desktop collapse button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={cn(
                  "ml-auto hidden lg:flex",
                  "h-8 w-8",
                  isCollapsed ? "mx-auto" : "ml-3"
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    "hover:bg-gray-50 hover:text-gray-900",
                    isActive
                      ? 'bg-health-teal-50 text-health-teal-700 border border-health-teal-200'
                      : 'text-gray-600',
                    isCollapsed ? "justify-center px-2" : ""
                  )}
                >
                  <item.icon className={cn(
                    "flex-shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"
                  )} />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className={cn(
              "flex items-center transition-all duration-200",
              isCollapsed ? "justify-center" : ""
            )}>
              {!isCollapsed && (
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 bg-health-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                    <p className="text-xs font-medium text-gray-500 capitalize truncate">{user?.role}</p>
                  </div>
                </div>
              )}
              {isCollapsed && (
                <div className="w-8 h-8 bg-health-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Logout button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className={cn(
                  "text-gray-400 hover:text-gray-500 flex-shrink-0",
                  isCollapsed ? "ml-0" : "ml-3"
                )}
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}