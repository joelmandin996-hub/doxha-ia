import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, LayoutDashboard, Filter, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStatusLabel, getStatusEmoji, getTypeEmoji, getTypeLabel } from '@/lib/followUpUtils.js';
import FollowUpDetailModal from '@/components/FollowUpDetailModal.jsx';
import FollowUpPriorityBadge from '@/components/FollowUpPriorityBadge.jsx';
import { PRIORITY_LEVELS, PRIORITY_ORDER, getPriorityLabel } from '@/lib/followUpPriorityUtils.js';

const FollowUpListPage = () => {
  const navigate = useNavigate();
  const [suivis, setSuivis] = useState([]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent'); // 'recent', 'priority'
  const [selectedSuiviId, setSelectedSuiviId] = useState(null);
  const [selectedSuiviObj, setSelectedSuiviObj] = useState(null);

  const fetchSuivis = async () => {
    try {
      const records = await pb.collection('suivis').getFullList({
        expand: 'membre_id',
        sort: '-created',
        $autoCancel: false
      });
      setSuivis(records);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuivis();
  }, []);

  const handleSuiviUpdate = (updatedSuivi) => {
    setSuivis(prev => prev.map(s => s.id === updatedSuivi.id ? { ...updatedSuivi, expand: s.expand } : s));
    if (selectedSuiviObj && selectedSuiviObj.id === updatedSuivi.id) {
      setSelectedSuiviObj({ ...updatedSuivi, expand: selectedSuiviObj.expand });
    }
  };

  const handleOpenDetail = (item) => {
    setSelectedSuiviId(item.id);
    setSelectedSuiviObj(item);
  };

  // Filter & Sort
  const filteredSuivis = suivis.filter(s => {
    const matchesSearch = 
      (s.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.expand?.membre_id?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || s.priorite === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const sortedSuivis = [...filteredSuivis].sort((a, b) => {
    if (sortOption === 'priority') {
      const orderA = PRIORITY_ORDER[a.priorite] || 0;
      const orderB = PRIORITY_ORDER[b.priorite] || 0;
      if (orderA !== orderB) return orderB - orderA; // Descending (Urgent first)
    }
    return new Date(b.created) - new Date(a.created); // Default recent
  });

  const toggleSort = () => {
    setSortOption(prev => prev === 'priority' ? 'recent' : 'priority');
  };

  return (
    <>
      <Helmet><title>Liste des Suivis - ChurchFlow</title></Helmet>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Liste des Suivis</h1>
            <p className="text-muted-foreground mt-1">Vue détaillée de toutes vos interactions.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/suivi')} className="rounded-xl shadow-sm">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Vue Kanban
          </Button>
        </div>

        <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-sm flex-wrap">
          <div className="relative flex-1 min-w-[200px] w-full flex items-center bg-card rounded-xl px-3 border-transparent hover:shadow-sm focus-within:shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/20">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input 
              placeholder="Rechercher par description ou nom..." 
              className="border-none shadow-none focus-visible:ring-0 text-base h-11 bg-transparent w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="h-8 w-px bg-border hidden sm:block mx-1" />
          
          <div className="flex items-center gap-2 w-full sm:w-auto bg-card rounded-xl px-3 h-11 border-transparent hover:shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/20">
            <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px] border-none shadow-none focus:ring-0 bg-transparent text-sm font-medium">
                <SelectValue placeholder="Toutes priorités" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-medium">Toutes priorités</SelectItem>
                {Object.values(PRIORITY_LEVELS).map(p => (
                  <SelectItem key={p} value={p} className="font-medium">{getPriorityLabel(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="w-[30%] font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">
                    <button onClick={toggleSort} className="flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none">
                      Priorité <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="font-semibold">Membre</TableHead>
                  <TableHead className="text-right font-semibold">Créé le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSuivis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground bg-muted/10">
                      Aucun suivi ne correspond à votre recherche.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSuivis.map(suivi => (
                    <TableRow key={suivi.id} className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => handleOpenDetail(suivi)}>
                      <TableCell className="font-medium">
                        <div className="line-clamp-2">{suivi.description || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md text-xs font-medium border border-border/50">
                          {getTypeEmoji(suivi.type)} {suivi.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <FollowUpPriorityBadge priority={suivi.priorite} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1.5 w-max bg-background shadow-sm text-xs">
                          {getStatusEmoji(suivi.statut)} {suivi.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {suivi.expand?.membre_id?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums-custom text-sm">
                        {format(new Date(suivi.created), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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

export default FollowUpListPage;