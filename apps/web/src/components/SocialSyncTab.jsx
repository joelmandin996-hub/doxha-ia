import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Database } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';

const SocialSyncTab = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSyncStatus = async () => {
    try {
      const response = await apiServerClient.fetch('/social/sync-status');
      if (!response.ok) throw new Error("Failed to fetch sync status");
      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error("Error fetching sync status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await apiServerClient.fetch('/social/sync', { method: 'POST' });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur de synchronisation");
      }
      
      toast.success(`Synchronisation réussie: ${data.syncedCount} éléments mis à jour.`);
      setSyncStatus({
        lastSyncTime: data.lastSyncTime,
        status: data.status,
        postsCount: (syncStatus?.postsCount || 0) + data.syncedCount
      });
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(error.message || "La synchronisation a échoué.");
      setSyncStatus(prev => ({ ...prev, status: 'Erreur' }));
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Réussi':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Réussi</Badge>;
      case 'Erreur':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Erreur</Badge>;
      case 'En cours':
        return <Badge variant="secondary" className="gap-1 animate-pulse"><RefreshCw className="w-3 h-3" /> En cours</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> {status || 'Non synchronisé'}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card className="border-2 border-primary/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <RefreshCw className={`w-6 h-6 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
            Centre de Synchronisation
          </CardTitle>
          <CardDescription>
            Maintenez vos données à jour avec Facebook et Instagram. La synchronisation récupère les nouvelles publications, commentaires et statistiques.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stats-card bg-background/50">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Dernière Sync
              </span>
              <span className="text-xl font-semibold">
                {syncStatus?.lastSyncTime ? format(new Date(syncStatus.lastSyncTime), "d MMM yyyy 'à' HH:mm", { locale: fr }) : 'Jamais'}
              </span>
            </div>
            <div className="stats-card bg-background/50">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Statut
              </span>
              <div className="mt-1">{getStatusBadge(isSyncing ? 'En cours' : syncStatus?.status)}</div>
            </div>
            <div className="stats-card bg-background/50">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="w-4 h-4" /> Publications Indexées
              </span>
              <span className="text-xl font-semibold tabular-currency">{syncStatus?.postsCount || 0}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <Button 
              size="lg" 
              onClick={handleSync} 
              disabled={isSyncing}
              className="gap-2 sm:w-auto w-full"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}
            </Button>
            <div className="text-sm text-muted-foreground flex items-center bg-muted/30 px-4 py-2 rounded-lg border">
              <Clock className="w-4 h-4 mr-2" /> 
              Prochaine synchronisation auto: {format(new Date(Date.now() + 3600000), "HH:mm")}
            </div>
          </div>

        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique récent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock history for UI realism, in production this would fetch a sync_logs collection */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Database className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Synchronisation manuelle</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(Date.now() - i * 86400000), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Succès</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialSyncTab;