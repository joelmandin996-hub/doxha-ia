import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, Calendar as CalendarIcon, TrendingUp, Ticket, QrCode, UserCheck, List, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--warning))'];

export default function EventsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalEvents: 0, upcoming: 0, totalAttendees: 0, revenue: 0 });
  const [timelineData, setTimelineData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState({ simple: 0, qr: 0, ticketing: 0, attendance: 0, complete: 0 });
  const [hasAnyTicketing, setHasAnyTicketing] = useState(false);
  const [hasAnyAttendance, setHasAnyAttendance] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [events, presences, billets] = await Promise.all([
          pb.collection('evenements').getFullList({ $autoCancel: false }),
          pb.collection('presences').getFullList({ $autoCancel: false }),
          pb.collection('billets').getFullList({ $autoCancel: false })
        ]);

        const upcoming = events.filter(e => e.statut === 'a_venir').length;
        const revenue = billets.reduce((sum, b) => sum + (b.prix || 0), 0);

        const anyTicketing = events.some(e => e.has_ticketing);
        const anyAttendance = events.some(e => e.has_attendance);
        
        setHasAnyTicketing(anyTicketing);
        setHasAnyAttendance(anyAttendance);

        setMetrics({
          totalEvents: events.length,
          upcoming,
          totalAttendees: presences.filter(p => p.statut === 'Présent').length,
          revenue
        });

        // Event Types Summary
        let simple = 0, qr = 0, ticketing = 0, attendance = 0, complete = 0;
        events.forEach(e => {
          if (!e.has_qr_code && !e.has_ticketing && !e.has_attendance && !e.has_waitlist && !e.has_followup) simple++;
          if (e.has_qr_code) qr++;
          if (e.has_ticketing) ticketing++;
          if (e.has_attendance) attendance++;
          if (e.has_qr_code && e.has_ticketing && e.has_attendance && e.has_waitlist && e.has_followup) complete++;
        });
        setEventTypes({ simple, qr, ticketing, attendance, complete });

        // Attendance Pie
        if (anyAttendance) {
          const present = presences.filter(p => p.statut === 'Présent').length;
          const absent = presences.filter(p => p.statut === 'Absent').length;
          setAttendanceData([
            { name: 'Présents', value: present },
            { name: 'Absents', value: absent }
          ]);
        }

        // Timeline (Events per month)
        const monthCounts = {};
        events.forEach(evt => {
          const m = format(new Date(evt.date_debut), 'MMM yy', { locale: fr });
          monthCounts[m] = (monthCounts[m] || 0) + 1;
        });
        const timeline = Object.keys(monthCounts).map(k => ({ name: k, Evénements: monthCounts[k] }));
        setTimelineData(timeline);

        // Top Events
        if (anyAttendance) {
          const eventAttendance = {};
          presences.filter(p => p.statut === 'Présent').forEach(p => {
            eventAttendance[p.evenement_id] = (eventAttendance[p.evenement_id] || 0) + 1;
          });
          
          const top = events
            .filter(e => e.has_attendance)
            .map(evt => ({
              name: evt.titre.substring(0, 15) + '...',
              Présents: eventAttendance[evt.id] || 0
            }))
            .sort((a, b) => b.Présents - a.Présents)
            .slice(0, 5);
          
          setTopEvents(top);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-6 max-w-7xl">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-[120px] rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      <Helmet><title>Tableau de bord Événements - ChurchFlow</title></Helmet>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble des performances événementielles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-shadow border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Événements</p>
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><CalendarIcon className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold tabular-nums-custom">{metrics.totalEvents}</p>
          </CardContent>
        </Card>
        
        <Card className="premium-shadow border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">À venir</p>
              <div className="p-2 bg-[hsl(var(--warning))]/10 rounded-lg text-[hsl(var(--warning))]"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold tabular-nums-custom">{metrics.upcoming}</p>
          </CardContent>
        </Card>

        {hasAnyAttendance && (
          <Card className="premium-shadow border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Présences</p>
                <div className="p-2 bg-[hsl(var(--success))]/10 rounded-lg text-[hsl(var(--success))]"><Users className="w-5 h-5" /></div>
              </div>
              <p className="text-3xl font-bold tabular-nums-custom">{metrics.totalAttendees}</p>
            </CardContent>
          </Card>
        )}

        {hasAnyTicketing && (
          <Card className="premium-shadow border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Revenus (Billets)</p>
                <div className="p-2 bg-[hsl(var(--secondary))]/10 rounded-lg text-[hsl(var(--secondary))]"><Ticket className="w-5 h-5" /></div>
              </div>
              <p className="text-3xl font-bold tabular-nums-custom">{metrics.revenue.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <Card className="premium-shadow border-none col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Répartition des fonctionnalités</CardTitle>
            <CardDescription>Utilisation des options par événement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl text-center border">
                <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{eventTypes.simple}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Simples</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl text-center border">
                <QrCode className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{eventTypes.qr}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Avec QR</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl text-center border">
                <Ticket className="w-6 h-6 mx-auto mb-2 text-[hsl(var(--secondary))]" />
                <p className="text-2xl font-bold">{eventTypes.ticketing}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Billetterie</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl text-center border">
                <UserCheck className="w-6 h-6 mx-auto mb-2 text-[hsl(var(--success))]" />
                <p className="text-2xl font-bold">{eventTypes.attendance}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Présences</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-2xl text-center border border-primary/20">
                <List className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{eventTypes.complete}</p>
                <p className="text-xs text-primary/80 uppercase tracking-wider mt-1">Complets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasAnyAttendance && (
          <>
            <Card className="premium-shadow border-none col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Événements (Présences)</CardTitle>
                <CardDescription>Les 5 événements avec le plus de participants</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topEvents}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="Présents" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="premium-shadow border-none col-span-1">
              <CardHeader>
                <CardTitle>Taux de Participation</CardTitle>
                <CardDescription>Répartition globale des présences</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={attendanceData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        <Card className={`premium-shadow border-none col-span-1 ${hasAnyAttendance ? 'lg:col-span-3' : 'lg:col-span-3'}`}>
          <CardHeader>
            <CardTitle>Évolution des événements</CardTitle>
            <CardDescription>Nombre d'événements créés par mois</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="Evénements" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4, fill: 'hsl(var(--primary))'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}