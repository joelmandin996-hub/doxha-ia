import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar, List, Users, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { STATUTS_SUIVI, getPriorityColor, getTypeEmoji } from '@/lib/followUpUtils.js';
import FollowUpDetailModal from '@/components/FollowUpDetailModal.jsx';
import CalendarGrid from '@/components/calendar/CalendarGrid.jsx';
import { toast } from 'sonner';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const FollowUpsPage = () => {
  const navigate = useNavigate();
  const [suivis, setSuivis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSuiviId, setSelectedSuiviId] = useState(null);
  const [selectedSuiviObj, setSelectedSuiviObj] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchSuivis = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('suivis').getFullList({
        expand: 'responsable_assigne,membre_id',
        sort: '-created',
        $autoCancel: false
      });
      setSuivis(records);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des suivis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuivis();
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    const updatedSuivis = suivis.map(s => {
      if (s.id === draggableId) {
        return { ...s, statut: newStatus };
      }
      return s;
    });
    setSuivis(updatedSuivis);

    try {
      await pb.collection('suivis').update(draggableId, { statut: newStatus }, { $autoCancel: false });
      
      await pb.collection('suivis_historique').create({
        suivi_id: draggableId,
        action: 'deplacement',
        ancien_statut: oldStatus,
        nouveau_statut: newStatus,
        auteur: pb.authStore.model.id,
        details: `Déplacé de ${oldStatus} vers ${newStatus}`
      }, { $autoCancel: false });

    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du déplacement.');
      fetchSuivis();
    }
  };

  const handleSuiviUpdate = (updatedSuivi) => {
    setSuivis(prev => prev.map(s => s.id === updatedSuivi.id ? { ...updatedSuivi, expand: s.expand } : s));
    if (selectedSuiviObj && selectedSuiviObj.id === updatedSuivi.id) {
      setSelectedSuiviObj({ ...updatedSuivi, expand: selectedSuiviObj.expand });
    }
  };

  const handleOpenDetail = (item) => {
    setSelectedSuiviId(item.id);
    setSelectedSuiviObj(item.original || item);
  };

  const filteredSuivis = suivis.filter(s => 
    (s.nom_personne || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.telephone && s.telephone.includes(search)) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = STATUTS_SUIVI.map(statut => ({
    ...statut,
    items: filteredSuivis.filter(s => s.statut === statut.value)
  }));

  // Map suivis to calendar events format
  const calendarEvents = filteredSuivis.map(s => ({
    id: s.id,
    titre: s.description || s.nom_personne || 'Suivi',
    date_debut: s.created,
    date_fin: s.created,
    categorie: 'Accompagnement',
    original: s
  }));

  return (
    <>
      <Helmet><title>Suivis - ChurchFlow</title></Helmet>
      <div className="container mx-auto px-4 py-8 flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pipeline de Suivis</h1>
            <p className="text-muted-foreground mt-1">Gérez les suivis pastoraux et contacts.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-muted p-1 rounded-xl mr-2">
              <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')} className="rounded-lg">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Kanban
              </Button>
              <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')} className="rounded-lg">
                <Calendar className="w-4 h-4 mr-2" /> Calendrier
              </Button>
            </div>
            <Button onClick={() => navigate('/suivis/new')} className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> Nouveau Suivi</Button>
          </div>
        </div>

        <div className="mb-6 shrink-0 flex justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un nom, description..." 
              className="pl-9 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-2 bg-background border rounded-xl p-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden pb-4">
          {viewMode === 'kanban' ? (
            <div className="h-full overflow-x-auto hide-scrollbar">
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 h-full items-start">
                  {columns.map(column => (
                    <div key={column.value} className="flex flex-col w-80 shrink-0 h-full bg-muted/30 rounded-xl border">
                      <div className="p-3 border-b bg-muted/50 rounded-t-xl flex justify-between items-center">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <span>{column.emoji}</span> {column.label}
                        </h3>
                        <span className="bg-background text-xs font-medium px-2 py-0.5 rounded-full border">
                          {column.items.length}
                        </span>
                      </div>
                      
                      <Droppable droppableId={column.value}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps}
                            className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
                          >
                            {column.items.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleOpenDetail(item)}
                                    className={`bg-card p-3 rounded-lg border shadow-sm cursor-pointer transition-all ${snapshot.isDragging ? 'shadow-lg scale-[1.02] rotate-1' : 'hover:shadow-md hover:-translate-y-0.5'}`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      borderLeftWidth: '4px',
                                      borderLeftColor: getPriorityColor(item.priorite)
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-semibold text-sm line-clamp-2 pr-2">{item.description || item.nom_personne}</h4>
                                      <span className="text-lg leading-none" title={item.type_suivi}>{getTypeEmoji(item.type_suivi)}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      <p className="truncate">Resp: {item.expand?.responsable_assigne?.name || 'Aucun'}</p>
                                      {item.date_prochain_rappel && (
                                        <p className={`flex items-center gap-1 ${new Date(item.date_prochain_rappel) < new Date() ? 'text-destructive font-medium' : ''}`}>
                                          <Calendar className="w-3 h-3" /> 
                                          {format(new Date(item.date_prochain_rappel), 'dd/MM/yyyy')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </DragDropContext>
            </div>
          ) : (
            <div className="h-full animate-in fade-in duration-300">
              <CalendarGrid 
                currentDate={currentDate} 
                events={calendarEvents} 
                onEventClick={handleOpenDetail}
                onDayClick={(day) => setCurrentDate(day)}
              />
            </div>
          )}
        </div>
      </div>

      <FollowUpDetailModal 
        suivi={selectedSuiviObj} 
        isOpen={!!selectedSuiviId} 
        onClose={() => { setSelectedSuiviId(null); setSelectedSuiviObj(null); }}
        onUpdate={handleSuiviUpdate}
        onDeleteSuccess={() => {
          setSelectedSuiviId(null);
          setSelectedSuiviObj(null);
          fetchSuivis();
        }}
      />
    </>
  );
};

export default FollowUpsPage;