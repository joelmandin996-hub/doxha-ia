import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Wallet, ArrowUpRight, ArrowDownRight, LayoutDashboard, ListOrdered, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import BudgetDashboard from '@/pages/BudgetDashboard.jsx';
import TransactionsPage from '@/pages/TransactionsPage.jsx';
import BudgetConfigPage from '@/pages/BudgetConfigPage.jsx';

const BudgetPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ budget: 0, revenue: 0, expense: 0, transactionsCount: 0 });

  const pathPart = location.pathname.split('/')[2];
  const activeTab = pathPart || 'dashboard';

  useEffect(() => {
    const fetchBudgetSummary = async () => {
      setLoading(true);
      try {
        const year = new Date().getFullYear();

        // Config fetch
        const configs = await pb.collection('budget_config').getFullList({
          filter: `annee = ${year}`,
          $autoCancel: false
        });
        const globalBudget = configs.length > 0 ? configs[0].budget_global : 0;

        // Transactions fetch
        const txRecords = await pb.collection('budget_transactions').getFullList({
          $autoCancel: false
        });

        let rev = 0;
        let exp = 0;
        txRecords.forEach(tx => {
          if (tx.type === 'revenue') rev += tx.amount;
          if (tx.type === 'expense') exp += tx.amount;
        });

        setSummary({
          budget: globalBudget,
          revenue: rev,
          expense: exp,
          transactionsCount: txRecords.length
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching budget summary:', err);
        setError('Impossible de charger les données budgétaires globales. Veuillez vérifier votre connexion.');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetSummary();
  }, []);

  const handleTabChange = (value) => {
    if (value === 'dashboard') {
      navigate('/budget');
    } else {
      navigate(`/budget/${value}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Helmet><title>Gestion du Budget - ChurchFlow</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-gradient">Gestion du Budget</h1>
          <p className="text-muted-foreground mt-1">Supervisez et gérez les finances, transactions et configurations.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && summary.budget === 0 && summary.transactionsCount === 0 && (
        <Alert className="bg-muted/50 text-muted-foreground border-dashed animate-in fade-in duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucune donnée budgétaire</AlertTitle>
          <AlertDescription>
            Vous n'avez pas encore défini de budget ou ajouté de transactions pour cette année. Commencez par la configuration.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[120px] w-full rounded-2xl" />
          <Skeleton className="h-[120px] w-full rounded-2xl" />
          <Skeleton className="h-[120px] w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <Card className="shadow-sm border-border bg-card premium-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Budget {new Date().getFullYear()}</p>
                  <p className="text-3xl font-extrabold tabular-nums-custom text-foreground">
                    {summary.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card premium-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Recettes</p>
                  <p className="text-3xl font-extrabold tabular-nums-custom text-[hsl(var(--success))]">
                    {summary.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="p-3 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] rounded-xl">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card premium-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Dépenses</p>
                  <p className="text-3xl font-extrabold tabular-nums-custom text-[hsl(var(--destructive))]">
                    {summary.expense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="p-3 bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] rounded-xl">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-8">
        <div className="border-b mb-6">
          <TabsList className="bg-transparent h-12 p-0 gap-8 w-full justify-start overflow-x-auto hide-scrollbar">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 font-semibold text-muted-foreground data-[state=active]:text-foreground pb-3"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 font-semibold text-muted-foreground data-[state=active]:text-foreground pb-3"
            >
              <ListOrdered className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="configuration"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 font-semibold text-muted-foreground data-[state=active]:text-foreground pb-3"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="m-0 focus-visible:outline-none min-h-[400px]">
          <BudgetDashboard />
        </TabsContent>

        <TabsContent value="transactions" className="m-0 focus-visible:outline-none min-h-[400px]">
          <TransactionsPage />
        </TabsContent>

        <TabsContent value="configuration" className="m-0 focus-visible:outline-none min-h-[400px]">
          <BudgetConfigPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetPage;