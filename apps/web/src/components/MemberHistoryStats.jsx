import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, Banknote, Users, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MemberHistoryStats = ({ memberId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [attendances, donations, groups] = await Promise.all([
          pb.collection('attendances').getFullList({
            filter: `member_id="${memberId}"`,
            sort: '-created',
            $autoCancel: false
          }),
          pb.collection('transactions_recettes').getFullList({
            filter: `membre_id="${memberId}"`,
            sort: '-date',
            $autoCancel: false
          }),
          pb.collection('group_members').getFullList({
            filter: `member_id="${memberId}"`,
            sort: '-created',
            $autoCancel: false
          })
        ]);

        const totalDonations = donations.reduce((sum, d) => sum + d.montant, 0);
        const avgDonation = donations.length > 0 ? totalDonations / donations.length : 0;
        
        const presentCount = attendances.filter(a => a.attendance_status === 'present').length;
        const attendanceRate = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : 0;

        setStats({
          attendancesCount: attendances.length,
          attendanceRate,
          lastAttendance: attendances.length > 0 ? attendances[0].created : null,
          donationsCount: donations.length,
          totalDonations,
          avgDonation,
          lastDonation: donations.length > 0 ? donations[0].date : null,
          groupsCount: groups.length,
          lastGroupJoin: groups.length > 0 ? groups[0].created : null
        });
      } catch (error) {
        console.error('Error fetching member stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchStats();
    }
  }, [memberId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-xl shadow-sm border-none bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Présences</p>
              <h3 className="text-2xl font-bold tracking-tight">{stats.attendancesCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Taux de {stats.attendanceRate}%
                {stats.lastAttendance && ` • Dernier: ${format(new Date(stats.lastAttendance), 'dd/MM/yy')}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-none bg-emerald-500/5 dark:bg-emerald-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total des dons</p>
              <h3 className="text-2xl font-bold tracking-tight">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.totalDonations)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Moy. {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.avgDonation)}
                {stats.lastDonation && ` • Dernier: ${format(new Date(stats.lastDonation), 'dd/MM/yy')}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-none bg-blue-500/5 dark:bg-blue-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Groupes</p>
              <h3 className="text-2xl font-bold tracking-tight">{stats.groupsCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Groupes actifs
                {stats.lastGroupJoin && ` • Rejoint le ${format(new Date(stats.lastGroupJoin), 'dd/MM/yy')}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-none bg-orange-500/5 dark:bg-orange-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Activité Globale</p>
              <h3 className="text-2xl font-bold tracking-tight">Actif</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Basé sur les interactions récentes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberHistoryStats;