import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Calendar,
  MessageSquare, 
  Share2, 
  Settings, 
  HeartHandshake, 
  LogOut,
  PieChart,
  KanbanSquare,
  Package
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  // Each link carries its own module color token for a rich, identity-driven nav
  const mainLinks = [
    { name: 'Tableau de bord', path: '/', icon: LayoutDashboard, color: 'var(--primary)' },
    { name: 'Membres', path: '/members', icon: Users, color: 'var(--mod-members)' },
    { name: 'Groupes', path: '/groups', icon: Users, color: 'var(--mod-groups)' },
    { name: 'Événements', path: '/events', icon: Calendar, color: 'var(--mod-events)' },
    { name: 'Suivis (Kanban)', path: '/suivi', icon: KanbanSquare, color: 'var(--mod-followups)' },
    { name: 'Calendrier', path: '/calendar', icon: CalendarDays, color: 'var(--mod-calendar)' },
    { name: 'Communication', path: '/communication', icon: MessageSquare, color: 'var(--mod-comm)' },
    { name: 'Réseaux Sociaux', path: '/social-media', icon: Share2, color: 'var(--mod-comm)' },
    { name: 'Budget', path: '/budget', icon: PieChart, color: 'var(--mod-budget)' },
    { name: 'Inventaire', path: '/inventory', icon: Package, color: 'var(--mod-inventory)' },
  ];

  return (
    <div className="h-screen w-64 border-r flex flex-col fixed left-0 top-0 z-40 font-premium tracking-premium leading-premium sidebar-shell">
      <div className="p-6 border-b border-border/60">
        <h1 className="text-2xl font-extrabold tracking-premium-tight flex items-center gap-2.5">
          <span className="logo-mark w-9 h-9 rounded-xl flex items-center justify-center">
            <HeartHandshake className="w-5 h-5 text-primary-foreground" />
          </span>
          <span className="text-gradient">ChurchFlow</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 hide-scrollbar">
        {mainLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path) && link.path !== '/' || location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn('nav-item', isActive ? 'nav-item-active' : 'nav-item-idle')}
            >
              <Icon
                className="w-5 h-5 shrink-0"
                strokeWidth={2}
                style={!isActive ? { color: `hsl(${link.color})` } : undefined}
              />
              <span className="truncate">{link.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-border/60 space-y-1 bg-card/80 backdrop-blur">
        <Link
          to="/settings"
          className={cn(
            'nav-item',
            location.pathname === '/settings' ? 'nav-item-active' : 'nav-item-idle'
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          Paramètres
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-premium tracking-premium h-11" 
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
