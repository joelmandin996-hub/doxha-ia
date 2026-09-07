import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight, Plus, Download, FileText, Search, MoreHorizontal, Edit, Trash2, Package } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TransactionForm } from '@/components/budget/TransactionForm.jsx';
import { formatCurrency } from '@/lib/formatters.js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, recette, depense
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isRecetteModalOpen, setIsRecetteModalOpen] = useState(false);
  const [isDepenseModalOpen, setIsDepenseModalOpen] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [recettes, depenses] = await Promise.all([
        pb.collection('transactions_recettes').getFullList({ sort: '-date', $autoCancel: false }),
        pb.collection('transactions_depenses').getFullList({ sort: '-date', $autoCancel: false })
      ]);

      const formattedRecettes = recettes.map(r => ({
        ...r,
        type: 'recette',
        description_display: r.description || 'Recette',
        statut_display: 'Reçu'
      }));

      const formattedDepenses = depenses.map(d => ({
        ...d,
        type: 'depense',
        description_display: d.note || 'Dépense',
        statut_display: d.statut || 'Payé'
      }));

      const merged = [...formattedRecettes, ...formattedDepenses].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(merged);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (tx) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette transaction ?')) return;
    
    try {
      const collection = tx.type === 'recette' ? 'transactions_recettes' : 'transactions_depenses';
      await pb.collection(collection).delete(tx.id, { $autoCancel: false });
      toast.success('Transaction supprimée.');
      fetchTransactions();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression.');
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredTransactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString('fr-FR'),
        Type: t.type === 'recette' ? 'Recette' : 'Dépense',
        Catégorie: t.categorie,
        Description: t.description_display,
        Montant: t.montant,
        Statut: t.statut_display
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export Excel réussi');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Journal des Transactions", 14, 15);
      
      const tableData = filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString('fr-FR'),
        t.type === 'recette' ? 'Recette' : 'Dépense',
        t.categorie,
        t.description_display,
        `${t.montant.toFixed(2)} €`
      ]);

      doc.autoTable({
        head: [['Date', 'Type', 'Catégorie', 'Description', 'Montant']],
        body: tableData,
        startY: 20,
      });

      doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Export PDF réussi');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchType = filterType === 'all' || tx.type === filterType;
    const matchSearch = tx.description_display.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        tx.categorie.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">Consultez et gérez l'ensemble de vos recettes et dépenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={isRecetteModalOpen} onOpenChange={setIsRecetteModalOpen}>
            <Button onClick={() => setIsRecetteModalOpen(true)} className="bg-[hsl(var(--transaction-revenue))] text-white hover:bg-[hsl(var(--transaction-revenue))]/90">
              <Plus className="w-4 h-4 mr-2" /> Recette
            </Button>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouvelle Recette</DialogTitle>
              </DialogHeader>
              <TransactionForm 
                type="recette" 
                onSuccess={() => { setIsRecetteModalOpen(false); fetchTransactions(); }} 
                onCancel={() => setIsRecetteModalOpen(false)} 
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isDepenseModalOpen} onOpenChange={setIsDepenseModalOpen}>
            <Button onClick={() => setIsDepenseModalOpen(true)} variant="outline" className="border-[hsl(var(--transaction-expense))] text-[hsl(var(--transaction-expense))] hover:bg-[hsl(var(--transaction-expense))]/10">
              <Plus className="w-4 h-4 mr-2" /> Dépense
            </Button>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouvelle Dépense</DialogTitle>
              </DialogHeader>
              <TransactionForm 
                type="depense" 
                onSuccess={() => { setIsDepenseModalOpen(false); fetchTransactions(); }} 
                onCancel={() => setIsDepenseModalOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="shadow-sm border-0 ring-1 ring-border/50">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-card">
          <Tabs value={filterType} onValueChange={setFilterType} className="w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-[300px] grid-cols-3">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="recette">Recettes</TabsTrigger>
              <TabsTrigger value="depense">Dépenses</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-1 sm:flex-none w-full sm:w-auto gap-3 items-center">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une transaction..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToExcel}><FileText className="h-4 w-4 mr-2" /> Export CSV / Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}><FileText className="h-4 w-4 mr-2" /> Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p>Aucune transaction trouvée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      {tx.type === 'recette' ? (
                        <Badge variant="outline" className="border-[hsl(var(--transaction-revenue))]/30 text-[hsl(var(--transaction-revenue))] bg-[hsl(var(--transaction-revenue))]/10">
                          <ArrowDownRight className="w-3 h-3 mr-1" /> Recette
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-[hsl(var(--transaction-expense))]/30 text-[hsl(var(--transaction-expense))] bg-[hsl(var(--transaction-expense))]/10">
                          <ArrowUpRight className="w-3 h-3 mr-1" /> Dépense
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{tx.description_display}</TableCell>
                    <TableCell>
                      <span className="text-sm px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">{tx.categorie}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{tx.statut_display}</span>
                    </TableCell>
                    <TableCell className={`text-right tabular-currency font-semibold ${tx.type === 'recette' ? 'text-[hsl(var(--transaction-revenue))]' : 'text-foreground'}`}>
                      {tx.type === 'recette' ? '+' : '-'}{formatCurrency(tx.montant)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {tx.type === 'depense' && (
                            <DropdownMenuItem onClick={() => navigate(`/inventory?invoice=${tx.id}`)}>
                              <Package className="h-4 w-4 mr-2" /> Articles liés (inventaire)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(tx)} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;