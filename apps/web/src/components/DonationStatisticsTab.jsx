import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';
import { format, subMonths, isAfter, startOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Heart, TrendingUp, Users, RefreshCw } from 'lucide-react';

const DonationStatisticsTab = ({ donations, recurringDonations }) => {
  const currentYear = new Date().getFullYear();
  
  // Basic Metrics
  const totalAmount = donations.reduce((sum, d) => sum + d.montant, 0);
  const yearDonations = donations.filter(d => isAfter(new Date(d.date_don), startOfYear(new Date())));
  const totalYearAmount = yearDonations.reduce((sum, d) => sum + d.montant, 0);
  
  const uniqueDonors = new Set(donations.map(d => d.membre_id)).size;
  const avgDonation = donations.length > 0 ? totalAmount / donations.length : 0;
  
  const activeRecurring = recurringDonations.filter(d => d.statut === 'actif').length;
  const recurringTotal = recurringDonations.filter(d => d.statut === 'actif').reduce((sum, d) => sum + d.montant_mensuel, 0);

  // Trend Data (Last 6 Months)
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthStr = format(month, 'MMM yyyy', { locale: fr });
      const monthDonations = donations.filter(d => {
        const dDate = new Date(d.date_don);
        return dDate.getMonth() === month.getMonth() && dDate.getFullYear() === month.getFullYear();
      });
      data.push({
        name: monthStr,
        total: monthDonations.reduce((sum, d) => sum + d.montant, 0)
      });
    }
    return data;
  }, [donations]);

  // Top Donors
  const topDonors = useMemo(() => {
    const donorTotals = {};
    donations.forEach(d => {
      const name = d.expand?.membre_id?.name || 'Inconnu';
      donorTotals[name] = (donorTotals[name] || 0) + d.montant;
    });
    return Object.entries(donorTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [donations]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Année ({currentYear})</p>
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold tabular-nums-custom">{totalYearAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Donateurs Uniques</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold tabular-nums-custom">{uniqueDonors}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Don Moyen</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold tabular-nums-custom">{avgDonation.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dons Récurrents</p>
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold tabular-nums-custom">{activeRecurring}</div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums-custom">
              {recurringTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} / mois
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle>Tendance des dons</CardTitle>
            <CardDescription>Évolution sur les 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `${value}€`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} €`, 'Total']}
                  />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Top Donateurs</CardTitle>
            <CardDescription>Par volume total de dons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDonors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>
              ) : (
                topDonors.map((donor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm">{donor.name}</span>
                    </div>
                    <span className="font-bold tabular-nums-custom text-sm">
                      {donor.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonationStatisticsTab;