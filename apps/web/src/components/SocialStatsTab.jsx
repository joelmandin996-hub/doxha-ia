import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, TrendingUp, Users, Eye, ThumbsUp, MessageSquare, Share } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import pb from '@/lib/pocketbaseClient.js';
import { Skeleton } from '@/components/ui/skeleton';

const SocialStatsTab = () => {
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const filterDate = format(subDays(new Date(), parseInt(period)), 'yyyy-MM-dd');
        const records = await pb.collection('social_analytics').getFullList({
          filter: `date >= "${filterDate}"`,
          sort: 'date',
          expand: 'post_id,account_id',
          $autoCancel: false
        });
        setAnalytics(records);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  // Aggregate data for top cards
  const totalLikes = analytics.reduce((sum, item) => sum + (item.likes_count || 0), 0);
  const totalComments = analytics.reduce((sum, item) => sum + (item.comments_count || 0), 0);
  const totalShares = analytics.reduce((sum, item) => sum + (item.shares_count || 0), 0);
  const totalImpressions = analytics.reduce((sum, item) => sum + (item.impressions || 0), 0);
  const avgEngagement = totalImpressions > 0 ? ((totalLikes + totalComments + totalShares) / totalImpressions * 100).toFixed(2) : 0;

  // Process data for charts
  const chartData = analytics.reduce((acc, item) => {
    const dateStr = format(new Date(item.date), 'dd MMM', { locale: fr });
    const existing = acc.find(d => d.date === dateStr);
    if (existing) {
      existing.likes += item.likes_count || 0;
      existing.comments += item.comments_count || 0;
      existing.reach += item.reach || 0;
    } else {
      acc.push({
        date: dateStr,
        likes: item.likes_count || 0,
        comments: item.comments_count || 0,
        reach: item.reach || 0
      });
    }
    return acc;
  }, []);

  // Top posts
  const topPosts = [...analytics]
    .filter(a => a.expand?.post_id)
    .sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Performances globales</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Impressions</p>
                <p className="text-3xl font-bold mt-1 tabular-currency">{totalImpressions.toLocaleString()}</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg"><Eye className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'engagement</p>
                <p className="text-3xl font-bold mt-1 tabular-currency">{avgEngagement}%</p>
              </div>
              <div className="bg-green-500/10 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interactions (J'aime)</p>
                <p className="text-3xl font-bold mt-1 tabular-currency">{totalLikes.toLocaleString()}</p>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-lg"><ThumbsUp className="w-5 h-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commentaires</p>
                <p className="text-3xl font-bold mt-1 tabular-currency">{totalComments.toLocaleString()}</p>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-lg"><MessageSquare className="w-5 h-5 text-purple-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="evolution">Évolution temporelle</TabsTrigger>
          <TabsTrigger value="topposts">Meilleures publications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="evolution" className="mt-0 outline-none">
          <Card className="pt-6">
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="reach" name="Portée" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="likes" name="J'aime" stroke="hsl(var(--social-facebook))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topposts" className="mt-0 outline-none">
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Publication</TableHead>
                  <TableHead className="text-right">J'aime</TableHead>
                  <TableHead className="text-right">Commentaires</TableHead>
                  <TableHead className="text-right">Partages</TableHead>
                  <TableHead className="text-right">Portée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune donnée disponible</TableCell>
                  </TableRow>
                ) : (
                  topPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {post.expand?.post_id?.content || 'Publication sans texte'}
                      </TableCell>
                      <TableCell className="text-right tabular-currency">{post.likes_count || 0}</TableCell>
                      <TableCell className="text-right tabular-currency">{post.comments_count || 0}</TableCell>
                      <TableCell className="text-right tabular-currency">{post.shares_count || 0}</TableCell>
                      <TableCell className="text-right tabular-currency">{post.reach || 0}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialStatsTab;