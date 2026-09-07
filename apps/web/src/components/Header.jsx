import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggle = () => {
    if (toggleSidebar) {
      toggleSidebar();
    }
  };

  const initials = (currentUser?.name || currentUser?.email || 'U')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-colors duration-300 font-premium tracking-premium leading-premium header-shell">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="-ml-2 hover:bg-accent active:scale-95 transition-all rounded-xl" 
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            <Link to="/" className="flex items-center gap-2.5">
              <span className="logo-mark w-8 h-8 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-base">C</span>
              </span>
              <span className="font-semibold text-lg tracking-premium-tight hidden sm:block text-foreground">Church CRM</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="rounded-xl bg-muted/40 hover:bg-muted border border-transparent hover:border-border transition-colors">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-xl logo-mark text-primary-foreground font-semibold text-sm transition-transform active:scale-95 cursor-pointer">
                  {initials || <User className="w-5 h-5" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 font-premium tracking-premium rounded-xl shadow-lg">
                <div className="px-3 py-2.5 text-sm border-b border-border/50 mb-1">
                  <p className="font-semibold truncate text-foreground">{currentUser?.name || currentUser?.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                </div>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium rounded-lg">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('header.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
