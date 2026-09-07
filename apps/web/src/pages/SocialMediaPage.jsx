import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Calendar as CalendarIcon, Settings, Plus, RefreshCw, MessageSquare, BarChart3, MessageCircle, Activity } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import SocialAccountsTab from '@/components/SocialAccountsTab.jsx';
import SocialCalendarTab from '@/components/SocialCalendarTab.jsx';
import SocialPostForm from '@/components/SocialPostForm.jsx';
import SocialSyncTab from '@/components/SocialSyncTab.jsx';
import SocialCommentsTab from '@/components/SocialCommentsTab.jsx';
import SocialStatsTab from '@/components/SocialStatsTab.jsx';
import SocialMessagesTab from '@/components/SocialMessagesTab.jsx';
import SocialAnalyticsDashboard from '@/components/SocialAnalyticsDashboard.jsx';

const SocialMediaPage = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [accounts, setAccounts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);

  const fetchAccounts = async () => {
    try {
      const records = await pb.collection('social_accounts').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setAccounts(records);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleNewPost = () => {
    setEditingPost(null);
    setActiveTab('compose');
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setActiveTab('compose');
  };

  const handlePostSaved = () => {
    setActiveTab('calendar');
    setEditingPost(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Helmet>
        <title>Réseaux Sociaux | Church CRM</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Share2 className="w-8 h-8 text-primary" />
            Réseaux Sociaux
          </h1>
          <p className="text-muted-foreground mt-1">Gérez l'ensemble de votre communication sociale depuis un seul endroit</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="hidden sm:flex text-sm text-muted-foreground mr-4 items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
             {accounts.length} compte(s) actif(s)
           </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full pb-2">
          <TabsList className="flex w-max mb-6 h-12">
            <TabsTrigger value="analytics" className="gap-2 px-4"><Activity className="w-4 h-4" /> Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 px-4"><CalendarIcon className="w-4 h-4" /> Calendrier</TabsTrigger>
            <TabsTrigger value="compose" className="gap-2 px-4"><Plus className="w-4 h-4" /> Créer</TabsTrigger>
            <TabsTrigger value="messages" className="gap-2 px-4"><MessageSquare className="w-4 h-4" /> Messages</TabsTrigger>
            <TabsTrigger value="comments" className="gap-2 px-4"><MessageCircle className="w-4 h-4" /> Commentaires</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 px-4"><BarChart3 className="w-4 h-4" /> Statistiques</TabsTrigger>
            <TabsTrigger value="sync" className="gap-2 px-4"><RefreshCw className="w-4 h-4" /> Synchronisation</TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2 px-4"><Settings className="w-4 h-4" /> Comptes</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="analytics" className="mt-0 outline-none">
          <SocialAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0 outline-none">
          <SocialCalendarTab onNewPost={handleNewPost} onEditPost={handleEditPost} />
        </TabsContent>

        <TabsContent value="compose" className="mt-0 outline-none">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">{editingPost ? 'Modifier la publication' : 'Nouvelle publication'}</h2>
            <SocialPostForm 
              postToEdit={editingPost} 
              accounts={accounts} 
              onSaved={handlePostSaved}
              onCancel={() => setActiveTab('calendar')}
            />
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-0 outline-none">
          <SocialMessagesTab />
        </TabsContent>

        <TabsContent value="comments" className="mt-0 outline-none">
          <SocialCommentsTab />
        </TabsContent>

        <TabsContent value="stats" className="mt-0 outline-none">
          <SocialStatsTab />
        </TabsContent>

        <TabsContent value="sync" className="mt-0 outline-none">
          <SocialSyncTab />
        </TabsContent>

        <TabsContent value="accounts" className="mt-0 outline-none">
          <SocialAccountsTab accounts={accounts} onRefresh={fetchAccounts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Simplified ScrollArea helper just for the tabs list to overflow nicely on mobile
const ScrollArea = ({ children, className }) => (
  <div className={`overflow-x-auto ${className}`}>
    {children}
  </div>
);

export default SocialMediaPage;