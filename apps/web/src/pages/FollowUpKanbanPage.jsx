import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Plus, Search, Filter, RefreshCw, LayoutTemplate, ArrowUpDown, AlertCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

import FollowUpCard from '@/components/FollowUpCard.jsx';
import FollowUpForm from '@/components/FollowUpForm.jsx';
import FollowUpDetailModal from '@/components/FollowUpDetailModal.jsx';
import { FOLLOW_UP_TYPES } from '@/components/FollowUpTypeIcon.jsx';
import { PRIORITY_LEVELS, PRIORITY_ORDER, getPriorityLabel, getPriorityIcon } from '@/lib/followUpPriorityUtils.js';
import FollowUpPriorityBadge from '@/components/FollowUpPriorityBadge.jsx';

const COLUMNS = ['Nouveau', 'À contacter', 'Planifié', 'En cours', 'Terminé'];

const FollowUpKanbanPage = () => {
  const { currentUser } = useAuth();
  const [suivis, setSuivis] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSuivi, setEditingSuivi] = useState(null);
  const [selectedSuivi, setSelectedSuivi] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent'); // 'recent', 'priority'

  const fetchSuivis = useCallback(async () => {
    try {
      setLoading(true);
      const records = await pb.collection('suivis').getFullList({
        filter: `created_by = "${currentUser.id}"`,
        expand: 'membre_id',
        sort: '-updated',
        $autoCancel: false
      });
      setSuivis(records);
    } catch (error) {
      console.error('Error fetching suivis:', error);
      toast.error('Erreur lors du chargement des suivis');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchSuivis();
    }
  }, [currentUser, fetchSuivis]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    // Optimistic UI update
    setSuivis(prev => prev.map(s => s.id === draggableId ? { ...s, statut: newStatus } : s));

    try {
      await pb.collection('suivis').update(draggableId, { statut: newStatus }, { $autoCancel: false });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors du déplacement');
      // Revert on error
      fetchSuivis();
    }
  };

  const handleSuiviUpdate = (updatedSuivi) => {
    setSuivis(prev => prev.map(s => s.id === updatedSuivi.id ? { ...updatedSuivi, expand: s.expand } : s));
    if (selectedSuivi && selectedSuivi.id === updatedSuivi.id) {
      setSelectedSuivi({ ...updatedSuivi, expand: selectedSuivi.expand });
    }
  };

  // Calculate summaries
  const prioritySummary = suivis.reduce((acc, s) => {
    const p = s.priorite || PRIORITY_LEVELS.NORMAL;
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, { urgent: 0, normal: 0, basse: 0 });

  // Prepare filtered and sorted data
  const filteredSuivis = suivis.filter(s => {
    const matchesSearch = 
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.expand?.membre_id?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || s.priorite === priorityFilter;
    return matchesSearch && matchesType && matchesPriority;
  });

  const sortedSuivis = [...filteredSuivis].sort((a, b) => {
    if (sortOption === 'priority') {
      const orderA = PRIORITY_ORDER[a.priorite] || 0;
      const orderB = PRIORITY_ORDER[b.priorite] || 0;
      if (orderA !== orderB) return orderB - orderA; // Descending (Urgent first)
    }
    // Default to recent (which was the default fetch order, but ensure consistent sorting locally)
    return new Date(b.updated) - new Date(a.updated);
  });

  const columnsData = COLUMNS.reduce((acc, col) => {
    acc[col] = sortedSuivis.filter(s => s.statut === col);
    return acc;
  }, {});

  const handleCreateNew = () => {
    setEditingSuivi(null);
    setIsFormOpen(true);
  };

  const handleEdit = (suivi) => {
    setEditingSuivi(suivi);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground text-gradient">Suivis</h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Gérez votre pipeline de relations, vos tâches et vos notes d'interaction.
          </p>
          <div className="flex items-center gap-3 mt-4 overflow-x-auto hide-scrollbar">
            <span className="text-sm text-muted-foreground font-medium mr-1">Vue d'ensemble :</span>
            {Object.values(PRIORITY_LEVELS).map(p => (
              <div key={p} className="flex items-center gap-1.5 shrink-0">
                <FollowUpPriorityBadge priority={p} size="sm" />
                <span className="text-sm font-semibold tabular-nums-custom">{prioritySummary[p]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={fetchSuivis} className="h-11 w-11 rounded-xl shadow-sm hover:shadow-md transition-all shrink-0" title="Rafraîchir">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button onClick={handleCreateNew} size="lg" className="rounded-xl shadow-sm hover:shadow-md transition-all bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shrink-0">
            <Plus className="w-5 h-5 mr-2" /> Nouveau suivi
          </Button>
        </div>
      </div>

      {/* Elegant Filters Section */}
      <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-sm flex-wrap">
        <div className="relative flex-1 min-w-[200px] w-full flex items-center bg-card rounded-xl px-3 border-transparent shadow-none hover:shadow-sm focus-within:shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/20">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input 
            placeholder="Rechercher un contact..." 
            className="border-none shadow-none focus-visible:ring-0 text-base h-11 bg-transparent w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="h-8 w-px bg-border hidden sm:block mx-1" />
        
        <div className="flex items-center gap-2 w-full sm:w-auto bg-card rounded-xl px-3 h-11 border-transparent hover:shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/20">
          <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] border-none shadow-none focus:ring-0 bg-transparent text-sm font-medium">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="font-medium">Tous les types</SelectItem>
              {Object.keys(FOLLOW_UP_TYPES).map(type => (
                <SelectItem key={type} value={type} className="font-medium">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto bg-card rounded-xl px-3 h-11 border-transparent hover:shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/20">
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[150px] border-none shadow-none focus:ring-0 bg-transparent text-sm font-medium">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="font-medium">Toutes priorités</SelectItem>
              {Object.values(PRIORITY_LEVELS).map(p => (
                <SelectItem key={p} value={p} className="font-medium">{getPriorityLabel(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-11 px-4 rounded-xl gap-2 font-medium bg-card hover:bg-card/80 hover:shadow-sm transition-all border-transparent w-full sm:w-auto">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              Trier par: {sortOption === 'recent' ? 'Récent' : 'Priorité'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl w-[200px]">
            <DropdownMenuCheckboxItem 
              checked={sortOption === 'recent'} 
              onCheckedChange={() => setSortOption('recent')}
              className="py-2.5 font-medium rounded-lg"
            >
              Plus récent
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={sortOption === 'priority'} 
              onCheckedChange={() => setSortOption('priority')}
              className="py-2.5 font-medium rounded-lg"
            >
              Priorité (Urgent d'abord)
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Kanban Board Area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Chargement de votre pipeline...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar -mx-2 px-2 pb-6 pt-2">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex h-full items-start gap-6">
              {COLUMNS.map(columnId => {
                const columnItems = columnsData[columnId];
                return (
                  <div key={columnId} className="kanban-column group">
                    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4 text-muted-foreground/60" />
                        <h3 className="font-bold text-sm tracking-wide uppercase text-foreground/80">{columnId}</h3>
                      </div>
                      <span className="bg-card text-foreground text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm tabular-nums-custom">
                        {columnItems.length}
                      </span>
                    </div>
                    
                    <Droppable droppableId={columnId}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 flex flex-col gap-3 min-h-[200px] p-2.5 transition-colors overflow-y-auto hide-scrollbar ${snapshot.isDraggingOver ? 'bg-primary/[0.03]' : ''}`}
                        >
                          {columnItems.map((suivi, index) => (
                            <FollowUpCard 
                              key={suivi.id} 
                              suivi={suivi} 
                              index={index} 
                              onClick={setSelectedSuivi} 
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Form Modal */}
      <FollowUpForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingSuivi}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchSuivis();
        }}
      />

      {/* Detail Modal */}
      <FollowUpDetailModal
        isOpen={!!selectedSuivi}
        onClose={() => setSelectedSuivi(null)}
        suivi={selectedSuivi}
        onEdit={handleEdit}
        onUpdate={handleSuiviUpdate}
        onDeleteSuccess={() => {
          setSelectedSuivi(null);
          fetchSuivis();
        }}
      />
    </div>
  );
};

export default FollowUpKanbanPage;