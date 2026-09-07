import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useSidebarAutoClose } from '@/hooks/useSidebarAutoClose.js';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const MainLayout = () => {
  const isMobile = useIsMobile();
  const { isDarkMode } = useTheme();
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.innerWidth > 768;
  });

  console.log('[MainLayout] Rendered. sidebarOpen:', sidebarOpen, 'isMobile:', isMobile);

  // Automatically close sidebar on budget routes
  useSidebarAutoClose(setSidebarOpen);

  useEffect(() => {
    if (localStorage.getItem('sidebarOpen') === null) {
      setSidebarOpen(!isMobile);
    }
  }, [isMobile]);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    console.log('[MainLayout] toggleSidebar called. Toggling from', sidebarOpen, 'to', !sidebarOpen);
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 font-premium tracking-premium leading-premium">
      <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar Container */}
        <div 
          className={`hidden md:block transition-all duration-300 ease-in-out overflow-hidden border-r bg-card shrink-0 ${
            sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <div className="w-64 h-full">
            <Sidebar sidebarOpen={sidebarOpen} />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto w-full relative z-0">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobile && sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r font-premium tracking-premium leading-premium">
          <VisuallyHidden>
            <SheetTitle>Menu de Navigation</SheetTitle>
            <SheetDescription>Menu principal pour accéder aux différentes sections de l'application</SheetDescription>
          </VisuallyHidden>
          <Sidebar isMobile onNavigate={() => setSidebarOpen(false)} sidebarOpen={true} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MainLayout;