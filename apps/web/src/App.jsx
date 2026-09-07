import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { LanguageProvider } from '@/contexts/LanguageContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from '@/components/MainLayout.jsx';

// Core Pages
import LoginPage from '@/pages/LoginPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';

// Modules
import MembersPage from '@/pages/MembersPage.jsx';
import MemberDetailPage from '@/pages/MemberDetailPage.jsx';
import GroupsPage from '@/pages/GroupsPage.jsx';
import GroupDetailPage from '@/pages/GroupDetailPage.jsx';
import CommunicationPage from '@/pages/CommunicationPage.jsx';
import SocialMediaPage from '@/pages/SocialMediaPage.jsx';

// Events Module
import EventsPage from '@/pages/events/EventsPage.jsx';
import EventDetailPage from '@/pages/events/EventDetailPage.jsx';
import EventsDashboard from '@/pages/events/EventsDashboard.jsx';

// Kanban Suivis Module
import FollowUpKanbanPage from '@/pages/FollowUpKanbanPage.jsx';

// Legacy Suivis
import FollowUpsPage from '@/pages/FollowUpsPage.jsx';
import FollowUpListPage from '@/pages/FollowUpListPage.jsx';
import FollowUpCalendarPage from '@/pages/FollowUpCalendarPage.jsx';
import FollowUpByResponsiblePage from '@/pages/FollowUpByResponsiblePage.jsx';
import FollowUpNewPage from '@/pages/FollowUpNewPage.jsx';
import FollowUpEditPage from '@/pages/FollowUpEditPage.jsx';

// Calendar Module
import CalendarPage from '@/pages/CalendarPage.jsx';
import NewEventPage from '@/pages/NewEventPage.jsx';
import EditEventPage from '@/pages/EditEventPage.jsx';

// Budget & Donations Module
import BudgetPage from '@/pages/BudgetPage.jsx';
import DonationsPage from '@/pages/DonationsPage.jsx';

// Inventory Module
import InventoryPage from '@/pages/InventoryPage.jsx';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes wrapped in MainLayout */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/" element={<DashboardPage />} />
                
                {/* Members */}
                <Route path="/members" element={<MembersPage />} />
                <Route path="/members/:id" element={<MemberDetailPage />} />
                
                {/* Groups */}
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />

                {/* Events Hub */}
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/dashboard" element={<EventsDashboard />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/events/:id/:tab" element={<EventDetailPage />} />
                
                {/* Kanban Suivi Route */}
                <Route path="/suivi" element={<FollowUpKanbanPage />} />

                {/* Legacy Suivis Routes */}
                <Route path="/suivis" element={<FollowUpsPage />} />
                <Route path="/suivis/list" element={<FollowUpListPage />} />
                <Route path="/suivis/calendar" element={<FollowUpCalendarPage />} />
                <Route path="/suivis/by-responsible" element={<FollowUpByResponsiblePage />} />
                <Route path="/suivis/new" element={<FollowUpNewPage />} />
                <Route path="/suivis/:id/edit" element={<FollowUpEditPage />} />

                {/* Calendar */}
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/calendar/new" element={<NewEventPage />} />
                <Route path="/calendar/edit/:id" element={<EditEventPage />} />
                
                {/* Comm & Social */}
                <Route path="/communication" element={<CommunicationPage />} />
                <Route path="/social-media" element={<SocialMediaPage />} />
                
                {/* Accounting, Budget & Donations */}
                <Route path="/budget/*" element={<BudgetPage />} />
                <Route path="/donations" element={<DonationsPage />} />

                {/* Inventory */}
                <Route path="/inventory" element={<InventoryPage />} />
                
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              
              {/* Catch-all route */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                    <h1 className="text-6xl font-bold text-primary/20 mb-4 tabular-nums-custom">404</h1>
                    <h2 className="text-2xl font-semibold mb-2">Page non trouvée</h2>
                    <p className="text-muted-foreground mb-6">La page que vous recherchez n'existe pas ou a été déplacée.</p>
                    <a href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-sm">
                      Retour à l'accueil
                    </a>
                  </div>
                }
              />
            </Routes>
            <Toaster position="top-center" richColors />
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;