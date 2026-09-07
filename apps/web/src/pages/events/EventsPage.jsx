import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, MapPin, Calendar as CalendarIcon, Users, QrCode, Ticket, UserCheck, List, MessageSquare, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EventFormModal from '@/components/events/EventFormModal.jsx';
import { toast } from 'sonner';

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('tous');
  const [sortBy, setSortBy] = useState('date_desc');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    console.log('--- [EventsPage] DIAGNOSTIC: Fetching Manual and Auto Events ---');
    try {
      const safeFetch = async (collection, options) => {
        try {
          return await pb.collection(collection).getFullList(options);
        } catch (e) {
          console.warn(`[EventsPage] Failed to fetch ${collection}:`, e);
          return [];
        }
      };

      const [evenementsRes, eventsRes, presencesRes] = await Promise.all([
        safeFetch('evenements', { expand: 'responsable,created_by', $autoCancel: false }),
        safeFetch('events', { expand: 'group_id,created_by', $autoCancel: false }),
        safeFetch('presences', { $autoCancel: false })
      ]);

      console.log(`[EventsPage] Loaded: ${evenementsRes.length} Manuels, ${eventsRes.length} Automatiques.`);

      // Normalisation: Manual events
      const manualEvents = evenementsRes.map(evt => {
        const occupied = presencesRes.filter(p => p.evenement_id === evt.id).length;
        return { 
          ...evt, 
          occupied, 
          collection: 'evenements',
          isAuto: false,
          creatorName: evt.expand?.created_by?.name || 'Inconnu'
        };
      });

      // Normalisation: Auto events (synced from groups)
      const autoEvents = eventsRes.map(evt => {
        const occupied = presencesRes.filter(p => p.evenement_id === evt.id).length;
        return {
          id: evt.id,
          titre: evt.title || 'Sans titre',
          description: evt.description,
          date_debut: evt.start_date,
          date_fin: evt.end_date,
          group_id: evt.group_id,
          source: evt.source,
          auto_created: evt.auto_created,
          statut: 'a_venir',
          categorie: 'Réunion automatique',
          capacite_max: 50,
          occupied,
          collection: 'events',
          isAuto: true,
          creatorName: evt.expand?.created_by?.name || 'Inconnu',
          groupName: evt.expand?.group_id?.name
        };
      });

      const merged = [...manualEvents, ...autoEvents];
      setEvents(merged);
      console.log(`[EventsPage] Fusion complete. Total: ${merged.length}`);
    } catch (err) {
      console.error('[EventsPage] Error during fetch/merge:', err);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter & Sort Logic
  const processedEvents = events
    .filter(evt => {
      // Tab filter
      if (activeTab !== 'tous' && evt.statut !== activeTab) return false;
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        return (evt.titre || '').toLowerCase().includes(q) || 
               (evt.lieu || '').toLowerCase().includes(q) ||
               (evt.groupName || '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date_debut) - new Date(a.date_debut);
      if (sortBy === 'date_asc') return new Date(a.date_debut) - new Date(b.date_debut);
      if (sortBy === 'source') return (a.isAuto === b.isAuto) ? 0 : a.isAuto ? 1 : -1;
      if (sortBy === 'creator') return a.creatorName.localeCompare(b.creatorName);
      return 0;
    });

  const getStatusBadge = (statut) => {
    switch(statut) {
      case 'a_venir': return <Badge variant="outline" className="bg-primary/12 text-primary border-primary/25 shadow-[0_2px_8px_-4px_hsl(var(--primary)/0.4)]">À venir</Badge>;
      case 'fait': return <Badge variant="outline" className="bg-[hsl(var(--success))]/12 text-[hsl(var(--success))] border-[hsl(var(--success))]/25 shadow-[0_2px_8px_-4px_hsl(var(--success)/0.4)]">Terminé</Badge>;
      case 'annule': return <Badge variant="outline" className="bg-destructive/12 text-destructive border-destructive/25 shadow-[0_2px_8px_-4px_hsl(var(--destructive)/0.4)]">Annulé</Badge>;
      default: return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl font-premium tracking-premium">
      <Helmet><title>Événements - ChurchFlow</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-premium-tight text-foreground text-gradient mb-2">Tous les Événements</h1>
          <p className="text-muted-foreground text-lg">Gérez vos événements manuels et synchronisés.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-xl shadow-md transition-all h-12 px-6 font-medium">
          <Plus className="w-5 h-5 mr-2" /> Créer un événement
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between bg-card p-4 rounded-2xl border shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="tous" className="rounded-lg font-medium">Tous</TabsTrigger>
            <TabsTrigger value="a_venir" className="rounded-lg font-medium">À venir</TabsTrigger>
            <TabsTrigger value="fait" className="rounded-lg font-medium">Passés</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9 rounded-xl bg-background"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] rounded-xl bg-background">
              <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Plus récents</SelectItem>
              <SelectItem value="date_asc">Plus anciens</SelectItem>
              <SelectItem value="source">Source (Auto/Manuel)</SelectItem>
              <SelectItem value="creator">Créateur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[220px] rounded-2xl" />)}
        </div>
      ) : processedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card border border-dashed rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucun événement</h3>
          <p className="text-muted-foreground">Modifier vos filtres ou créez-en un nouveau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedEvents.map(evt => (
            <Card 
              key={evt.id} 
              className="hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden flex flex-col h-full bg-card border-border/50 premium-shadow premium-shadow-hover"
              style={{ background: `linear-gradient(160deg, hsl(var(--mod-events) / 0.06), hsl(var(--card)) 50%)` }}
              onClick={() => {
                if (evt.isAuto) {
                  toast.info("Événement auto: naviguez via le calendrier ou le groupe.");
                } else {
                  navigate(`/events/${evt.id}`);
                }
              }}
            >
              <div className={`h-1.5 w-full ${evt.isAuto ? 'bg-[hsl(var(--sky))]' : 'bg-[hsl(var(--emerald))]'}`} />
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                  {getStatusBadge(evt.statut)}
                  {evt.isAuto ? (
                    <Badge className="bg-[hsl(var(--sky))]/12 text-[hsl(var(--sky))] hover:bg-[hsl(var(--sky))]/20 border-none font-semibold">Auto-Sync</Badge>
                  ) : (
                    <Badge className="bg-[hsl(var(--emerald))]/12 text-[hsl(var(--emerald))] hover:bg-[hsl(var(--emerald))]/20 border-none font-semibold">Manuel</Badge>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-1 line-clamp-2 text-balance leading-tight">{evt.titre}</h3>
                {evt.groupName && <p className="text-sm text-muted-foreground mb-3 font-medium flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> {evt.groupName}</p>}
                
                <div className="space-y-2 mt-auto pt-4 border-t border-border/50">
                  <div className="flex items-center text-sm text-muted-foreground font-medium">
                    <CalendarIcon className="w-4 h-4 mr-2 opacity-70" />
                    {evt.date_debut ? format(new Date(evt.date_debut), "d MMM yyyy 'à' HH:mm", { locale: fr }) : 'Non définie'}
                  </div>
                  {evt.lieu && (
                    <div className="flex items-center text-sm text-muted-foreground font-medium">
                      <MapPin className="w-4 h-4 mr-2 opacity-70" />
                      {evt.lieu}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Par: {evt.creatorName}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <EventFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchEvents} 
        />
      )}
    </div>
  );
}