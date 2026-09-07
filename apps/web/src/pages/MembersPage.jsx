import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Users, MoreHorizontal, Eye, Pencil, Trash2, Upload, SlidersHorizontal, ChevronLeft, ChevronRight, List, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import MemberForm from '@/components/MemberForm.jsx';
import MemberAvatar from '@/components/MemberAvatar.jsx';
import MemberImportModal from '@/components/MemberImportModal.jsx';
import MemberExportExcel from '@/components/MemberExportExcel.jsx';
import MemberExportPDF from '@/components/MemberExportPDF.jsx';
import AdvancedSearchBar from '@/components/AdvancedSearchBar.jsx';
import AdvancedFiltersPanel from '@/components/AdvancedFiltersPanel.jsx';
import ActiveFiltersDisplay from '@/components/ActiveFiltersDisplay.jsx';
import CalendarGrid from '@/components/calendar/CalendarGrid.jsx';
import { filterBySearchTerm, filterByGroups, filterByStatuses, filterByDateRange } from '@/lib/FilterUtils.js';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const MembersPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [allMembers, setAllMembers] = useState([]);
  const [groupsData, setGroupsData] = useState([]);
  const [groupMembersMappings, setGroupMembersMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    groups: [],
    statuses: [],
    dateRange: { start: '', end: '' }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [membersReq, groupsReq, gmReq] = await Promise.all([
        pb.collection('members').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('groups').getFullList({ sort: 'name', $autoCancel: false }),
        pb.collection('group_members').getFullList({ $autoCancel: false })
      ]);

      const groupsWithCounts = groupsReq.map(g => {
        const count = gmReq.filter(gm => gm.group_id === g.id).length;
        return { ...g, memberCount: count };
      });

      setAllMembers(membersReq);
      setGroupsData(groupsWithCounts);
      setGroupMembersMappings(gmReq);
    } catch (error) {
      console.error('Error fetching directory data:', error);
      toast.error('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredMembers = useMemo(() => {
    setIsFiltering(true);
    let result = allMembers;

    result = filterBySearchTerm(result, searchTerm);
    result = filterByGroups(result, activeFilters.groups, groupMembersMappings);
    result = filterByStatuses(result, activeFilters.statuses);
    result = filterByDateRange(result, activeFilters.dateRange.start, activeFilters.dateRange.end);

    setIsFiltering(false);
    return result;
  }, [allMembers, searchTerm, activeFilters, groupMembersMappings]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE) || 1;
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredMembers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMembers, currentPage]);

  const handleDeleteMember = async (id) => {
    if (!window.confirm(t('members.delete') + '?')) return;
    
    try {
      await pb.collection('members').delete(id, { $autoCancel: false });
      toast.success('Member deleted successfully');
      setAllMembers(allMembers.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  const handleRemoveFilter = (filterType, value) => {
    if (filterType === 'dateRange') {
      setActiveFilters({ ...activeFilters, dateRange: { start: '', end: '' } });
    } else if (filterType === 'groups' || filterType === 'statuses') {
      setActiveFilters({
        ...activeFilters,
        [filterType]: activeFilters[filterType].filter(v => v !== value)
      });
    }
  };

  const openCreateDialog = () => {
    setEditingMember(null);
    setDialogOpen(true);
  };

  const openEditDialog = (member) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setTimeout(() => setEditingMember(null), 300);
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'actif') return 'bg-[hsl(var(--success))]/12 text-[hsl(var(--success))] border-[hsl(var(--success))]/25 shadow-[0_2px_8px_-4px_hsl(var(--success)/0.4)]';
    if (s === 'inactif') return 'bg-destructive/12 text-destructive border-destructive/25 shadow-[0_2px_8px_-4px_hsl(var(--destructive)/0.4)]';
    if (s === 'visiteur') return 'bg-[hsl(var(--sky))]/12 text-[hsl(var(--sky))] border-[hsl(var(--sky))]/25 shadow-[0_2px_8px_-4px_hsl(var(--sky)/0.4)]';
    if (s === 'nouveau') return 'bg-[hsl(var(--amber))]/14 text-[hsl(var(--amber))] border-[hsl(var(--amber))]/25 shadow-[0_2px_8px_-4px_hsl(var(--amber)/0.4)]';
    if (s === 'baptisé') return 'bg-primary/12 text-primary border-primary/25 shadow-[0_2px_8px_-4px_hsl(var(--primary)/0.4)]';
    return 'bg-muted text-muted-foreground border-border';
  };

  const calendarEvents = filteredMembers.filter(m => m.join_date || m.created).map(m => ({
    id: m.id,
    titre: `Adhésion: ${m.name}`,
    date_debut: m.join_date || m.created,
    date_fin: m.join_date || m.created,
    categorie: 'Vie d\'Église',
    original: m
  }));

  return (
    <>
      <Helmet>
        <title>{t('members.title') || 'Members'} - ChurchFlow</title>
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-premium-tight mb-1 text-gradient">{t('members.title') || 'Directory'}</h1>
            <p className="text-muted-foreground text-lg">{t('members.subtitle') || 'Manage congregation members'}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-muted p-1 rounded-xl mr-2">
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-lg">
                <List className="w-4 h-4 mr-2" /> Liste
              </Button>
              <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')} className="rounded-lg">
                <Calendar className="w-4 h-4 mr-2" /> Calendrier
              </Button>
            </div>
            <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2 rounded-xl">
              <Upload className="w-4 h-4" />
              Importer
            </Button>
            <MemberExportExcel />
            <MemberExportPDF />
            <Button onClick={openCreateDialog} className="gap-2 rounded-xl shadow-sm ml-auto lg:ml-2">
              <Plus className="w-5 h-5" />
              {t('members.addMember') || 'Add Member'}
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[550px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? (t('members.editMember') || 'Edit Member') : (t('members.addMember') || 'Add Member')}
                </DialogTitle>
              </DialogHeader>
              <MemberForm member={editingMember} onSuccess={() => { closeDialog(); fetchAllData(); }} onCancel={closeDialog} />
            </DialogContent>
          </Dialog>

          <MemberImportModal 
            open={importModalOpen} 
            onOpenChange={setImportModalOpen} 
            onSuccess={fetchAllData} 
          />
        </div>

        <div className="mb-6 space-y-4 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex-1 max-w-md">
              <AdvancedSearchBar 
                searchTerm={searchTerm} 
                onSearchChange={setSearchTerm} 
              />
            </div>
            
            {viewMode === 'calendar' ? (
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
            ) : (
              <Button 
                variant={showFiltersPanel ? "secondary" : "outline"} 
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="gap-2 rounded-xl shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres avancés
              </Button>
            )}
          </div>

          <div className={`transition-all duration-300 ease-in-out origin-top ${showFiltersPanel && viewMode === 'list' ? 'opacity-100 max-h-[800px] mb-6' : 'opacity-0 max-h-0 overflow-hidden mb-0'}`}>
            <AdvancedFiltersPanel 
              groups={groupsData}
              filterState={activeFilters}
              onChange={setActiveFilters}
              onApply={() => setShowFiltersPanel(false)}
            />
          </div>

          {viewMode === 'list' && (
            <ActiveFiltersDisplay 
              activeFilters={activeFilters} 
              groups={groupsData} 
              onRemoveFilter={handleRemoveFilter} 
              totalCount={filteredMembers.length}
            />
          )}
        </div>

        <div className="flex-1 overflow-hidden pb-4">
          {viewMode === 'calendar' ? (
            <div className="h-full animate-in fade-in duration-300">
              <CalendarGrid 
                currentDate={currentDate} 
                events={calendarEvents} 
                onEventClick={(evt) => navigate(`/members/${evt.id}`)}
                onDayClick={(day) => setCurrentDate(day)}
              />
            </div>
          ) : (
            <Card className="shadow-sm rounded-2xl overflow-hidden border-border/60 h-full flex flex-col">
              <CardContent className="p-0 flex-1 overflow-y-auto">
                {loading || isFiltering ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-6 text-lg">Aucun membre ne correspond à vos critères.</p>
                    {(searchTerm || activeFilters.groups.length > 0 || activeFilters.statuses.length > 0 || activeFilters.dateRange.start) && (
                      <Button onClick={() => {
                        setSearchTerm('');
                        setActiveFilters({ groups: [], statuses: [], dateRange: { start: '', end: '' } });
                      }} variant="outline" className="rounded-xl">
                        Réinitialiser tous les filtres
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className="pl-6">Membre</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMembers.map((member) => (
                        <TableRow 
                          key={member.id} 
                          className="group transition-colors hover:bg-muted/40 cursor-pointer"
                          onClick={(e) => {
                            if(e.target.closest('.action-menu')) return;
                            navigate(`/members/${member.id}`);
                          }}
                        >
                          <TableCell className="pl-6 font-medium">
                            <div className="flex items-center gap-4">
                              <MemberAvatar member={member} size="md" />
                              <div>
                                <p className="font-semibold text-foreground">{member.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{member.email}</span>
                              {member.phone && <span className="text-xs text-muted-foreground">{member.phone}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusClass(member.status)}`}>
                              {member.status || 'Actif'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-6 action-menu">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                  <span className="sr-only">Menu actions</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                                <DropdownMenuItem onClick={() => navigate(`/members/${member.id}`)} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> Voir Profil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(member)} className="cursor-pointer">
                                  <Pencil className="mr-2 h-4 w-4 text-muted-foreground" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer mt-1" onClick={() => handleDeleteMember(member.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              
              {!loading && filteredMembers.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10 shrink-0">
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Affichage de <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> à <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filteredMembers.length)}</span> sur <span className="font-medium">{filteredMembers.length}</span> membres
                  </p>
                  <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto justify-between sm:justify-start">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 rounded-lg px-2"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
                    </Button>
                    <span className="text-sm font-medium tabular-nums-custom mx-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 rounded-lg px-2"
                    >
                      Suivant <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default MembersPage;