import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FolderKanban, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

const DashboardPage = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ members: 0, groups: 0, followUps: 0 });
  const [recentFollowUps, setRecentFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersResult, groupsResult, followUpsResult, recentResult] = await Promise.all([
          pb.collection('members').getList(1, 1, { $autoCancel: false }),
          pb.collection('groups').getList(1, 1, { $autoCancel: false }),
          pb.collection('follow_ups').getList(1, 1, { $autoCancel: false }),
          pb.collection('follow_ups').getList(1, 5, { 
            sort: '-date',
            expand: 'member_id',
            $autoCancel: false 
          })
        ]);

        setStats({
          members: membersResult.totalItems,
          groups: groupsResult.totalItems,
          followUps: followUpsResult.totalItems
        });
        setRecentFollowUps(recentResult.items);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { title: t('dashboard.totalMembers'), value: stats.members, icon: Users, token: '--mod-members' },
    { title: t('dashboard.totalGroups'), value: stats.groups, icon: FolderKanban, token: '--mod-groups' },
    { title: t('dashboard.followUps'), value: stats.followUps, icon: Calendar, token: '--mod-followups' }
  ];

  const getTypeColor = (type) => {
    const colors = {
      visit: 'bg-blue-100 text-blue-700',
      call: 'bg-green-100 text-green-700',
      email: 'bg-purple-100 text-purple-700',
      prayer: 'bg-amber-100 text-amber-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.other;
  };

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - Church CRM</title>
        <meta name="description" content="Church CRM dashboard with member statistics and recent follow-ups" />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 font-premium tracking-premium leading-premium">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-premium-tight leading-premium-tight mb-2 text-gradient">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.title}
                  className="relative overflow-hidden rounded-2xl border-border/60 premium-shadow premium-shadow-hover"
                  style={{ background: `linear-gradient(140deg, hsl(var(${stat.token}) / 0.08), hsl(var(--card)) 45%)` }}
                >
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, hsl(var(${stat.token})), hsl(var(${stat.token}) / 0.35))` }} />
                  <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: `hsl(var(${stat.token}) / 0.12)`, color: `hsl(var(${stat.token}))` }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tabular-nums-custom tracking-premium-tight" style={{ color: `hsl(var(${stat.token}))` }}>{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.recentFollowUps')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{t('dashboard.latestInteractions')}</p>
            </div>
            <Link 
              to="/follow-ups" 
              className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
            >
              {t('dashboard.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentFollowUps.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('dashboard.noFollowUps')}</p>
                <Link to="/follow-ups" className="text-sm text-primary hover:underline mt-2 inline-block font-medium">
                  {t('dashboard.createFirst')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentFollowUps.map((followUp) => (
                  <div key={followUp.id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-all duration-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {followUp.expand?.member_id?.name || 'Unknown Member'}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium tracking-premium ${getTypeColor(followUp.type)}`}>
                          {followUp.type || 'other'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(followUp.date), 'MMM d, yyyy')}
                      </p>
                      {followUp.notes && (
                        <p className="text-sm mt-2 line-clamp-2">{followUp.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;