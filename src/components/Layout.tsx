'use client';
import { useAuth } from './providers/AuthProvider';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        
        {/* Main content with proper padding */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50">
          <div className={cn(
            "container mx-auto p-4 lg:p-6",
            "pt-16 lg:pt-6" // Extra top padding for mobile navbar
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}