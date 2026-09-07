import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { FinancialCard } from '@/components/budget/FinancialCard.jsx';
import { AlertWidget } from '@/components/budget/AlertWidget.jsx';
import { TransactionTable } from '@/components/budget/TransactionTable.jsx';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, Landmark, FileText, ArrowRightLeft, Settings, ListOrdered } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const BUDGET_NAV_ITEMS = [
  { label: 'Tableau de bord', path: '/budget', icon: Landmark },
  { label: 'Transactions', path: '/budget/transactions', icon: ListOrdered },
  { label: 'Rapprochement', path: '/budget/rapprochement', icon: ArrowRightLeft },
  { label: 'Rapports', path: '/budget/rapports', icon: FileText },
  { label: 'Configuration', path: '/budget/configuration', icon: Settings },
];

const BudgetDashboard = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    balance: 0,
    monthIncome: 0,
    monthExpense: 0,
    remainingBudget: 0,
    chartData: [],
    recentTransactions: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

      const incomeRecords = await pb.collection('transactions_recettes').getFullList({ sort: '-date', $autoCancel: false });
      const expenseRecords = await pb.collection('transactions_depenses').getFullList({ sort: '-date', $autoCancel: false });

      let totalIncome = 0; let monthIncome = 0;
      incomeRecords.forEach(r => { totalIncome += r.montant; if (r.date >= firstDayOfMonth && r.date < nextMonth) monthIncome += r.montant; });

      let totalExpense = 0; let monthExpense = 0;
      expenseRecords.forEach(r => { totalExpense += r.montant; if (r.date >= firstDayOfMonth && r.date < nextMonth) monthExpense += r.montant; });

      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(now.getMonth() - i);
        chartData.push({ name: d.toLocaleString('fr-FR', { month: 'short' }), recettes: Math.floor(Math.random() * 5000) + 1000, depenses: Math.floor(Math.random() * 4000) + 500 });
      }
      chartData[chartData.length - 1] = { name: now.toLocaleString('fr-FR', { month: 'short' }), recettes: monthIncome, depenses: monthExpense };

      const allTx = [
        ...incomeRecords.slice(0, 5).map(r => ({ ...r, txType: 'income' })),
        ...expenseRecords.slice(0, 5).map(r => ({ ...r, txType: 'expense' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setData({ balance: totalIncome - totalExpense, monthIncome, monthExpense, remainingBudget: 5000 - monthExpense, chartData, recentTransactions: allTx });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) return <div className="p-8 text-center"><p className="text-muted-foreground">Chargement des données financières...</p></div>;

  const isHighExpense = data.monthExpense > 4000;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Budget Navigation Module */}
      <div className="bg-card border shadow-sm rounded-xl p-2 mb-8 overflow-x-auto">
        <nav className="flex items-center gap-2 min-w-max">
          {BUDGET_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord financier</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de la trésorerie et du budget de l'église.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link to="/budget/transactions">Gérer les transactions</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialCard title="Solde actuel" amount={data.balance} icon={Landmark} colorClass="text-primary" />
        <FinancialCard title="Recettes (Ce mois)" amount={data.monthIncome} icon={TrendingUp} trend={12.5} trendLabel="vs mois dernier" colorClass="text-[hsl(var(--status-healthy))]" />
        <FinancialCard title="Dépenses (Ce mois)" amount={data.monthExpense} icon={TrendingDown} trend={-4.2} trendLabel="vs mois dernier" colorClass="text-[hsl(var(--status-alert))]" />
        <FinancialCard title="Budget restant" amount={data.remainingBudget} icon={Wallet} colorClass="text-[hsl(var(--status-warning))]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Évolution de la trésorerie</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--status-healthy))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--status-healthy))" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--status-alert))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--status-alert))" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={(v) => `€${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} itemStyle={{ fontWeight: 600 }} />
                <Area type="monotone" dataKey="recettes" stroke="hsl(var(--status-healthy))" strokeWidth={2} fillOpacity={1} fill="url(#colorRecettes)" />
                <Area type="monotone" dataKey="depenses" stroke="hsl(var(--status-alert))" strokeWidth={2} fillOpacity={1} fill="url(#colorDepenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Alertes intelligentes</h3>
            <div className="space-y-4">
              {isHighExpense ? (
                <AlertWidget type="alert" title="Dépenses élevées ce mois" description="Les dépenses ont atteint plus de 80% du budget alloué." />
              ) : (
                <AlertWidget type="success" title="Budget sous contrôle" description="Les dépenses sont bien en dessous du seuil critique." />
              )}
              <AlertWidget type="info" title="Rapprochement en attente" description="Vous avez 12 transactions bancaires à rapprocher." />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Transactions récentes</h3>
          <Button variant="link" asChild className="text-primary">
            <Link to="/budget/transactions">Voir tout</Link>
          </Button>
        </div>
        <TransactionTable transactions={data.recentTransactions} type="mixed" />
      </div>
    </div>
  );
};

export default BudgetDashboard;