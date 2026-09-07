import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, RefreshCw, FileText, Download, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import DonationForm from '@/components/DonationForm.jsx';
import DonationDetailModal from '@/components/DonationDetailModal.jsx';
import DonationStatisticsTab from '@/components/DonationStatisticsTab.jsx';
import RecurringDonationForm from '@/components/RecurringDonationForm.jsx';
import AnnualSummaryGenerator from '@/components/AnnualSummaryGenerator.jsx';

const DonationsPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [donations, setDonations] = useState([]);
  const [recurringDonations, setRecurringDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [editingRecurring, setEditingRecurring] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [donationsRes, recurringRes] = await Promise.all([
        pb.collection('donations').getFullList({
          expand: 'membre_id',
          sort: '-date_don',
          $autoCancel: false
        }),
        pb.collection('dons_recurrents').getFullList({
          expand: 'membre_id',
          sort: '-created',
          $autoCancel: false
        })
      ]);
      setDonations(donationsRes);
      setRecurringDonations(recurringRes);
    } catch (error) {
      console.error('Error fetching donations data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering
  const filteredDonations = donations.filter(d => {
    const searchMatch = d.expand?.membre_id?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = typeFilter === 'all' || d.type_don === typeFilter;
    return searchMatch && typeMatch;
  });

  const handleDeleteDonation = async (id) => {
    try {
      await pb.collection('donations').delete(id, { $autoCancel: false });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecurring = async (id) => {
    if (window.confirm('Supprimer ce don récurrent ?')) {
      try {
        await pb.collection('dons_recurrents').delete(id, { $autoCancel: false });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <>
      <Helmet><title>Gestion des Dons - ChurchFlow</title></Helmet>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground text-gradient">Gestion des Dons</h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Suivez les contributions, gérez les reçus fiscaux et analysez la santé financière.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsSummaryModalOpen(true)} className="rounded-xl shadow-sm hidden sm:flex">
              <Download className="w-4 h-4 mr-2" /> Récap. Annuel
            </Button>
            <Button onClick={() => setIsFormOpen(true)} className="rounded-xl shadow-sm bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" /> Nouveau don
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto flex flex-wrap h-auto">
            <TabsTrigger value="list" className="rounded-lg py-2.5 px-4 font-medium data-[state=active]:shadow-sm">Dons Historique</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg py-2.5 px-4 font-medium data-[state=active]:shadow-sm">Statistiques</TabsTrigger>
            <TabsTrigger value="recurring" className="rounded-lg py-2.5 px-4 font-medium data-[state=active]:shadow-sm">Dons Récurrents</TabsTrigger>
          </TabsList>

          {/* LIST TAB */}
          <TabsContent value="list" className="mt-6 space-y-6">
            <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-sm flex-wrap">
              <div className="relative flex-1 min-w-[200px] w-full flex items-center bg-card rounded-xl px-3 focus-within:ring-1 focus-within:ring-primary/20">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <Input 
                  placeholder="Rechercher un donateur..." 
                  className="border-none shadow-none focus-visible:ring-0 h-11 bg-transparent w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="h-8 w-px bg-border hidden sm:block mx-1" />
              <div className="flex items-center gap-2 w-full sm:w-auto bg-card rounded-xl px-3 h-11">
                <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] border-none shadow-none focus:ring-0 bg-transparent text-sm font-medium">
                    <SelectValue placeholder="Type de don" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="unique">Unique</SelectItem>
                    <SelectItem value="recurrent">Récurrent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchData} className="h-11 w-11 rounded-xl">
                <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Donateur</TableHead>
                      <TableHead className="text-right font-semibold">Montant</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Chargement...</TableCell></TableRow>
                    ) : filteredDonations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">Aucun don trouvé.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDonations.map(d => (
                        <TableRow key={d.id} className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setSelectedDonation(d)}>
                          <TableCell className="font-medium tabular-nums-custom">{format(new Date(d.date_don), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-semibold">{d.expand?.membre_id?.name || 'Inconnu'}</TableCell>
                          <TableCell className="text-right font-bold tabular-nums-custom">{d.montant.toFixed(2)} €</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={d.type_don === 'unique' ? 'badge-muted' : 'badge-primary'}>
                              {d.type_don === 'unique' ? 'Unique' : 'Récurrent'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={d.statut === 'completed' ? 'badge-success' : 'badge-warning'}>
                              {d.statut === 'completed' ? 'Complété' : 'En attente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* STATS TAB */}
          <TabsContent value="stats" className="mt-6">
            <DonationStatisticsTab donations={donations} recurringDonations={recurringDonations} />
          </TabsContent>

          {/* RECURRING TAB */}
          <TabsContent value="recurring" className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Dons Réguliers</h2>
              <Button onClick={() => { setEditingRecurring(null); setIsRecurringFormOpen(true); }} variant="outline" className="rounded-xl shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Nouveau prélèvement
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recurringDonations.map(rd => (
                <div key={rd.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-lg">{rd.expand?.membre_id?.name}</p>
                      <p className="text-sm text-muted-foreground">Le {rd.jour_du_mois} de chaque mois</p>
                    </div>
                    <Badge variant="outline" className={
                      rd.statut === 'actif' ? 'badge-success' : 
                      rd.statut === 'suspendu' ? 'badge-warning' : 'badge-muted'
                    }>
                      {rd.statut}
                    </Badge>
                  </div>
                  <div className="text-3xl font-extrabold tabular-nums-custom mb-6 text-primary">
                    {rd.montant_mensuel.toFixed(2)} €
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm" className="w-full rounded-lg" onClick={() => { setEditingRecurring(rd); setIsRecurringFormOpen(true); }}>
                      Modifier
                    </Button>
                    <Button variant="destructive" size="sm" className="rounded-lg" onClick={() => handleDeleteRecurring(rd.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
              {recurringDonations.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                  Aucun don récurrent configuré.
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      <DonationForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={() => { setIsFormOpen(false); fetchData(); }} 
      />

      <RecurringDonationForm
        isOpen={isRecurringFormOpen}
        onClose={() => { setIsRecurringFormOpen(false); setEditingRecurring(null); }}
        initialData={editingRecurring}
        onSuccess={() => { setIsRecurringFormOpen(false); fetchData(); }}
      />

      <DonationDetailModal
        isOpen={!!selectedDonation}
        onClose={() => setSelectedDonation(null)}
        donation={selectedDonation}
        onDelete={handleDeleteDonation}
        onEdit={(d) => { setSelectedDonation(null); /* Handle edit open if needed */ }}
        onReceiptUpdate={fetchData}
      />

      <AnnualSummaryGenerator
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />
    </>
  );
};

export default DonationsPage;