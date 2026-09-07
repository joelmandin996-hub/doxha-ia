import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Banknote } from 'lucide-react';

const MemberDonationsTab = ({ memberId }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        let filterStr = `membre_id="${memberId}"`;
        if (categoryFilter !== 'all') {
          filterStr += ` && categorie="${categoryFilter}"`;
        }
        
        const records = await pb.collection('transactions_recettes').getFullList({
          filter: filterStr,
          sort: '-date',
          $autoCancel: false
        });
        setDonations(records);
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchDonations();
    }
  }, [memberId, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold tracking-tight">Historique des dons</h3>
        <div className="w-full sm:w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="Dîmes">Dîmes</SelectItem>
              <SelectItem value="Offrandes">Offrandes</SelectItem>
              <SelectItem value="Dons">Dons</SelectItem>
              <SelectItem value="Dons par projet">Dons par projet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : donations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <Banknote className="w-8 h-8 opacity-20" />
                    <p>Aucun don enregistré</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell className="font-medium">
                    {format(new Date(donation.date), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(donation.montant)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{donation.categorie}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{donation.description || '-'}</TableCell>
                  <TableCell>
                    {donation.rapproche ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-transparent shadow-none">Rapproché</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 border-transparent shadow-none">En attente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MemberDonationsTab;