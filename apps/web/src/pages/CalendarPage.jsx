import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, 
  addWeeks, subWeeks, addDays, subDays, format 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import CalendarGrid from '@/components/calendar/CalendarGrid.jsx';
import TimeSlotView from '@/components/calendar/TimeSlotView.jsx';
import EventListView from '@/components/calendar/EventListView.jsx';
import EventDetailModal from '@/components/calendar/EventDetailModal.jsx';
import CategoryIcon from '@/components/calendar/CategoryIcon.jsx';
import { filterEvents, generateRecurringEvents, CATEGORIES } from '@/lib/calendarUtils.js';

const VIEW_MODES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda'
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(VIEW_MODES.MONTH);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    categories: [...CATEGORIES],
    status: 'tous',
    responsable: 'tous',
    search: ''
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Check for targeted event in URL or localStorage
  useEffect(() => {
    const urlEventId = searchParams.get('eventId');
    const storedEventId = localStorage.getItem('cachedEventId');
    const targetId = urlEventId || storedEventId;

    if (targetId) {
      const fetchTargetEvent = async () => {
        try {
          const ev = await pb.collection('evenements').getOne(targetId, { expand: 'responsable', $autoCancel: false });
          if (ev) {
            setSelectedEvent(ev);
            setIsDetailOpen(true);
          }
        } catch (err) {
          console.warn(`[CalendarPage] Could not fetch targeted event ${targetId}:`, err);
          if (err.status === 404) {
            toast.error("L'événement demandé n'existe plus ou a été supprimé.");
            if (urlEventId) {
              searchParams.delete('eventId');
              setSearchParams(searchParams, { replace: true });
            }
            if (storedEventId) {
              localStorage.removeItem('cachedEventId');
            }
          }
        }
      };
      fetchTargetEvent();
    }
  }, [searchParams, setSearchParams]);

  const fetchEvents = async () => {
    setLoading(true);
    console.log('--- [CalendarPage] DIAGNOSTIC: Fetching all sources ---');
    try {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(addMonths(currentDate, 6)), { weekStartsOn: 1 });
      
      const filterStr = `date_debut >= "${start.toISOString()}" || recurrence != "une_fois"`;
      
      const safeFetch = async (collection, options) => {
        try {
          const res = await pb.collection(collection).getFullList(options);
          console.log(`[CalendarPage] ${collection} loaded: ${res.length} items`);
          return res;
        } catch (err) {
          console.error(`[CalendarPage] Error fetching ${collection}:`, err);
          return [];
        }
      };

      const [eventsRes, membersRes, groupsRes, agendaRes, syncedEventsRes] = await Promise.all([
        safeFetch('evenements', { filter: filterStr, expand: 'responsable', $autoCancel: false }),
        safeFetch('members', { sort: 'name', $autoCancel: false }),
        safeFetch('groups', { expand: 'event_id,agenda_id', $autoCancel: false }),
        safeFetch('agenda', { expand: 'group_id,event_id', $autoCancel: false }),
        safeFetch('events', { expand: 'group_id', $autoCancel: false }) 
      ]);

      setMembers(membersRes);
      let processedEvents = [];
      
      // 1. Manuel Events ('evenements') -> GREEN
      eventsRes.forEach(ev => {
        if (!ev || !ev.id) return;
        const instances = generateRecurringEvents(ev, end);
        instances.forEach(inst => {
          processedEvents.push({
            ...inst,
            titre: inst.titre || 'Sans titre',
            calendarSource: 'Manuel',
            sourceColor: 'bg-[hsl(var(--emerald))]',
            textColor: 'text-white'
          });
        });
      });

      // 2. Auto-Synced Events ('events') -> BLUE
      syncedEventsRes.forEach(ev => {
        if (ev && ev.start_date) {
           processedEvents.push({
            id: 'sync_' + ev.id,
            titre: ev.title || 'Événement de groupe',
            date_debut: ev.start_date,
            date_fin: ev.end_date || ev.start_date,
            statut: 'a_venir',
            recurrence: 'une_fois',
            categorie: 'Réunion automatique',
            calendarSource: 'Groupe (Auto)',
            sourceColor: 'bg-[hsl(var(--sky))]',
            textColor: 'text-white',
            originalEvent: ev,
            groupName: ev.expand?.group_id?.name
          });
        }
      });

      // 3. Agenda Entries -> ORANGE
      agendaRes.forEach(a => {
        if (!a || !a.id) return;
        processedEvents.push({
          id: 'agd_' + a.id,
          titre: a.expand?.group_id ? `Agenda: ${a.expand.group_id.name}` : `Entrée Agenda`,
          date_debut: a.created,
          date_fin: a.created,
          statut: 'a_venir',
          recurrence: 'une_fois',
          categorie: 'Autre',
          calendarSource: 'Agenda',
          sourceColor: 'bg-[hsl(var(--amber))]',
          textColor: 'text-white',
          originalAgenda: a
        });
      });

      // 4. Groups directly (if no event exists) -> INDIGO
      groupsRes.forEach(g => {
        if (!g || !g.id) return;
        // Skip if this group already has an event synced
        if (g.event_id && syncedEventsRes.some(e => e.id === g.event_id)) return;
        
        processedEvents.push({
          id: 'grp_' + g.id,
          titre: `Groupe: ${g.name}`,
          date_debut: g.created,
          date_fin: g.created,
          statut: 'a_venir',
          recurrence: 'une_fois',
          categorie: 'Autre',
          calendarSource: 'Groupe (Non-sync)',
          sourceColor: 'bg-[hsl(var(--secondary))]',
          textColor: 'text-white',
          originalGroup: g
        });
      });

      setEvents(processedEvents);
      console.log(`[CalendarPage] Fusion complete. Total normalized events: ${processedEvents.length}`);
    } catch (err) {
      console.error('[CalendarPage] Fatal error compiling calendar:', err);
      toast.error('Erreur lors de la fusion du calendrier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const handlePrev = () => {
    if (viewMode === VIEW_MODES.MONTH) setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === VIEW_MODES.WEEK) setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === VIEW_MODES.DAY) setCurrentDate(subDays(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === VIEW_MODES.MONTH) setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === VIEW_MODES.WEEK) setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === VIEW_MODES.DAY) setCurrentDate(addDays(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleEventClick = (event) => {
    if (!event || !event.id) {
      toast.error("Cet événement est invalide.");
      return;
    }
    
    if (!event.id.startsWith('grp_') && !event.id.startsWith('agd_') && !event.id.startsWith('sync_')) {
      const realId = event.originalId || event.id;
      localStorage.setItem('cachedEventId', realId);
    }
    
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleModalClose = () => {
    setIsDetailOpen(false);
    localStorage.removeItem('cachedEventId');
    if (searchParams.has('eventId')) {
      searchParams.delete('eventId');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const toggleCategoryFilter = (cat) => {
    setFilters(prev => {
      const newCats = prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: newCats };
    });
  };

  const toggleAllCategories = () => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.length === CATEGORIES.length ? [] : [...CATEGORIES]
    }));
  };

  const filteredEvents = filterEvents(events, filters);

  const renderHeaderDate = () => {
    if (viewMode === VIEW_MODES.MONTH || viewMode === VIEW_MODES.AGENDA) {
      return format(currentDate, 'MMMM yyyy', { locale: fr });
    }
    if (viewMode === VIEW_MODES.WEEK) {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy', { locale: fr })}`;
    }
    return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr });
  };

  return (
    <>
      <Helmet>
        <title>Calendrier Global - ChurchFlow</title>
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-4rem)] font-premium tracking-premium">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-premium-tight text-foreground text-gradient">Calendrier Global</h1>
            <p className="text-muted-foreground mt-1 flex gap-3">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[hsl(var(--emerald))]"></span> Manuels</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[hsl(var(--sky))]"></span> Groupes Sync</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[hsl(var(--amber))]"></span> Agenda</span>
            </p>
          </div>
          <Button onClick={() => navigate('/calendar/new')} className="w-full md:w-auto shadow-sm hover:shadow-md transition-shadow rounded-xl font-medium">
            <Plus className="w-4 h-4 mr-2" /> Nouvel Événement
          </Button>
        </div>

        <div className="bg-card p-3 rounded-xl shadow-sm border mb-6 shrink-0 flex flex-wrap lg:flex-nowrap gap-4 justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleToday} className="hidden sm:inline-flex bg-background hover:bg-accent rounded-lg font-medium">Aujourd'hui</Button>
            <div className="flex items-center border rounded-lg overflow-hidden bg-background">
              <Button variant="ghost" size="icon" className="rounded-none h-10 w-10 hover:bg-accent" onClick={handlePrev}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="w-[1px] h-6 bg-border"></div>
              <Button variant="ghost" size="icon" className="rounded-none h-10 w-10 hover:bg-accent" onClick={handleNext}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <h2 className="text-xl font-semibold capitalize ml-2 lg:min-w-[200px] text-foreground tracking-premium-tight">
              {renderHeaderDate()}
            </h2>
          </div>

          <div className="flex items-center gap-4 flex-1 lg:flex-none w-full lg:w-auto justify-end">
            <div className="relative hidden sm:block max-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-9 h-9 bg-background rounded-lg text-sm"
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 bg-background rounded-lg font-medium">
                  <Filter className="w-4 h-4 mr-2" /> Filtres
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4 max-h-[80vh] overflow-hidden flex flex-col rounded-2xl">
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 hide-scrollbar">
                  <div className="flex items-center justify-between sticky top-0 bg-popover z-10 pb-2 border-b">
                    <h4 className="font-semibold text-sm">Catégories</h4>
                    <Button variant="ghost" size="sm" onClick={toggleAllCategories} className="h-7 text-xs">
                      {filters.categories.length === CATEGORIES.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-4">
                    {CATEGORIES.map(cat => (
                      <div key={cat} className="flex items-start space-x-2">
                        <Checkbox 
                          id={`filter-${cat}`} 
                          className="mt-1"
                          checked={filters.categories.includes(cat)}
                          onCheckedChange={() => toggleCategoryFilter(cat)}
                        />
                        <Label htmlFor={`filter-${cat}`} className="text-sm cursor-pointer font-medium leading-tight">
                          <CategoryIcon categorie={cat} showLabel={true} />
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Tabs value={viewMode} onValueChange={setViewMode} className="w-[300px] lg:w-auto">
              <TabsList className="grid w-full grid-cols-4 h-9 rounded-lg">
                <TabsTrigger value={VIEW_MODES.MONTH} className="text-xs rounded-md">Mois</TabsTrigger>
                <TabsTrigger value={VIEW_MODES.WEEK} className="text-xs rounded-md">Sem</TabsTrigger>
                <TabsTrigger value={VIEW_MODES.DAY} className="text-xs rounded-md">Jour</TabsTrigger>
                <TabsTrigger value={VIEW_MODES.AGENDA} className="text-xs rounded-md">Liste</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
          {loading ? (
            <div className="h-full bg-card rounded-2xl border p-4 shadow-sm flex items-center justify-center">
               <Skeleton className="w-16 h-16 rounded-full opacity-50" />
            </div>
          ) : (
            <>
              {viewMode === VIEW_MODES.MONTH && (
                <CalendarGrid 
                  currentDate={currentDate} 
                  events={filteredEvents} 
                  onEventClick={handleEventClick}
                  onDayClick={(day) => { setCurrentDate(day); setViewMode(VIEW_MODES.DAY); }}
                />
              )}
              
              {(viewMode === VIEW_MODES.WEEK || viewMode === VIEW_MODES.DAY) && (
                <TimeSlotView 
                  currentDate={currentDate} 
                  events={filteredEvents} 
                  viewType={viewMode}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={(date) => {
                    navigate('/calendar/new', { state: { date: date.toISOString() } });
                  }}
                />
              )}
              
              {viewMode === VIEW_MODES.AGENDA && (
                <EventListView 
                  events={filteredEvents} 
                  onEventClick={handleEventClick}
                />
              )}
            </>
          )}
        </div>
      </div>

      <EventDetailModal 
        event={selectedEvent} 
        isOpen={isDetailOpen} 
        onClose={handleModalClose} 
        onRefresh={fetchEvents}
      />
    </>
  );
};

export default CalendarPage;