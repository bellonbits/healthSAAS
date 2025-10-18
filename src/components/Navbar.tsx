'use client';
import { useAuth } from './providers/AuthProvider';

export function Navbar() {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex justify-between items-center py-4 px-4 lg:px-6">
        <div className="lg:ml-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 text-sm lg:text-base">
            Community Health Worker Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-health-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get page title based on current route
function getPageTitle(): string {
  if (typeof window === 'undefined') return 'Dashboard';
  
  const pathname = window.location.pathname;
  const pageTitles: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/patients': 'Patients',
    '/households': 'Households',
    '/visits': 'Health Visits',
    '/users': 'User Management',
    '/analytics': 'Analytics',
    '/ai-assistant': 'AI Health Assistant',
    '/settings': 'Settings',
  };
  
  return pageTitles[pathname] || 'HealthSaaS';
}