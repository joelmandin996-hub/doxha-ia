import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Facebook, Instagram, Trash2, RefreshCw, Loader2, Share2, CalendarDays, ExternalLink, Settings, AlertTriangle, Info } from 'lucide-react';
import { useOAuthFacebook } from '@/hooks/useOAuthFacebook.js';
import { useOAuthInstagram } from '@/hooks/useOAuthInstagram.js';
import ManualFacebookConnectionForm from '@/components/ManualFacebookConnectionForm.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const SocialAccountsTab = ({ onRefresh }) => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    connectFacebook, 
    disconnectFacebook, 
    loadSDK: retryFbSdk,
    isConnecting: fbConnecting, 
    isSdkLoaded: fbSdkLoaded, 
    sdkError: fbSdkError 
  } = useOAuthFacebook();
  
  const { 
    connectInstagram, 
    disconnectInstagram, 
    isConnecting: igConnecting, 
    isSdkLoaded: igSdkLoaded, 
    sdkError: igSdkError 
  } = useOAuthInstagram();
  
  const [disconnectingId, setDisconnectingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('oauth');

  const fetchAccountsList = async () => {
    setIsLoading(true);
    try {
      const records = await pb.collection('social_accounts').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setAccounts(records);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Erreur lors du chargement des comptes. Veuillez vérifier votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsList();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAccountsList();
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleConnectFacebook = async () => {
    const result = await connectFacebook();
    if (result.success) {
      toast.success(`Comptes Facebook connectés avec succès.`);
      handleRefresh();
    }
    // Error is already handled/toasted inside hook
  };

  const handleConnectInstagram = async () => {
    const result = await connectInstagram();
    if (result.success) {
      toast.success(`Comptes Instagram connectés avec succès.`);
      handleRefresh();
    }
  };

  const handleDisconnect = async (account) => {
    if (!window.confirm('Êtes-vous sûr de vouloir déconnecter ce compte ? Cette action est irréversible.')) return;
    
    setDisconnectingId(account.id);
    try {
      if (account.platform === 'facebook') {
        const result = await disconnectFacebook(account.id);
        if (result.success) {
          toast.success("Compte déconnecté avec succès.");
        } else {
          toast.error(`Erreur de déconnexion: ${result.error}`);
        }
      } else {
        await pb.collection('social_accounts').delete(account.id, { $autoCancel: false });
        toast.success("Compte déconnecté avec succès.");
      }
      handleRefresh();
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Échec de la déconnexion du compte.");
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleSwitchToManual = () => {
    setActiveTab('manual');
  };

  return (
    <div className="space-y-8">
      {/* Connection Methods Container */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="border-b bg-muted/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Ajouter un nouveau compte</h3>
            <p className="text-sm text-muted-foreground">Connectez vos pages sociales pour publier et analyser vos statistiques.</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="oauth">Connexion Rapide</TabsTrigger>
              <TabsTrigger value="manual">Connexion Manuelle</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="oauth" className="p-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {fbSdkError && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Le SDK Facebook n'a pas pu charger</h4>
                  <p className="text-sm opacity-90">{fbSdkError}</p>
                  <p className="text-xs opacity-80 pt-1">
                    Cela peut être dû à un bloqueur de publicités (ex: uBlock Origin, Brave). 
                    Vous pouvez désactiver le bloqueur pour cette page ou <button onClick={handleSwitchToManual} className="underline font-medium hover:text-destructive">utiliser la connexion manuelle</button>.
                  </p>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={retryFbSdk} className="h-8 border-destructive/30 hover:bg-destructive/10 text-destructive">
                      <RefreshCw className="w-3 h-3 mr-2" /> Réessayer de charger
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          onClick={handleConnectFacebook} 
                          disabled={fbConnecting || !fbSdkLoaded || !!fbSdkError} 
                          className="bg-[hsl(var(--social-facebook))] text-white hover:bg-[hsl(var(--social-facebook))]/90 gap-2 min-w-[220px] h-12 w-full sm:w-auto"
                        >
                          {!fbSdkLoaded && !fbSdkError ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                           fbConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                           <Facebook className="w-5 h-5" />}
                          {fbConnecting ? "Connexion en cours..." : 
                           !fbSdkLoaded && !fbSdkError ? "Chargement du SDK..." : 
                           fbSdkError ? "Indisponible" : "Connecter Facebook"}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {fbSdkError && (
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p>Le SDK est bloqué. Veuillez utiliser la méthode manuelle.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex flex-col gap-1">
                <Button 
                  onClick={handleConnectInstagram} 
                  disabled={igConnecting || !igSdkLoaded} 
                  className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white hover:opacity-90 gap-2 border-0 min-w-[220px] h-12 w-full sm:w-auto"
                >
                  {!igSdkLoaded && !igSdkError ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                   igConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                   <Instagram className="w-5 h-5" />}
                  {igConnecting ? "Connexion en cours..." : !igSdkLoaded && !igSdkError ? "Chargement du SDK..." : "Connecter Instagram"}
                </Button>
                {igSdkError && <span className="text-xs text-destructive max-w-[220px] leading-tight mt-1">{igSdkError}</span>}
              </div>
            </div>

            <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-lg border text-sm text-muted-foreground mt-4 max-w-2xl">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p>
                La connexion rapide ouvre une fenêtre sécurisée. Si vous avez fermé la fenêtre par erreur ou refusé des permissions, vous pouvez simplement cliquer à nouveau pour recommencer. <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">Gérer mes intégrations Facebook <ExternalLink className="w-3 h-3 ml-1" /></a>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="p-6 mt-0">
            <ManualFacebookConnectionForm onSuccess={handleRefresh} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Connected Accounts List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Comptes connectés <Badge variant="secondary" className="ml-2">{!isLoading ? accounts.length : '...'}</Badge>
        </h3>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(account => (
              <Card key={account.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
                <div className={`h-1.5 w-full ${account.platform === 'facebook' ? 'bg-[hsl(var(--social-facebook))]' : 'bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500'}`} />
                <CardHeader className="pb-3 flex-none">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {account.profile_image_url ? (
                        <img src={account.profile_image_url} alt={account.account_name} className="w-12 h-12 rounded-xl object-cover border shadow-sm bg-muted" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border shadow-sm">
                          {account.platform === 'facebook' ? <Facebook className="w-6 h-6 text-muted-foreground" /> : <Instagram className="w-6 h-6 text-muted-foreground" />}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base font-semibold line-clamp-1" title={account.account_name}>{account.account_name}</CardTitle>
                        <CardDescription className="text-xs font-mono mt-0.5">{account.account_id}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={account.status === 'Actif' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-muted text-muted-foreground"}>
                      {account.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                  <div className="flex flex-col gap-3 mt-4">
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                      <CalendarDays className="w-4 h-4 opacity-70" />
                      <span>Connecté le {format(new Date(account.created), 'd MMM yyyy', { locale: fr })}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> En direct
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          onClick={() => handleDisconnect(account)}
                          disabled={disconnectingId === account.id}
                        >
                          {disconnectingId === account.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                          Déconnecter
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {accounts.length === 0 && (
              <div className="col-span-full bg-card border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
                  <Share2 className="w-8 h-8 text-muted-foreground/70" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Aucun compte connecté</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm">
                  Connectez vos pages de réseaux sociaux en utilisant le bouton OAuth ou la connexion manuelle ci-dessus pour commencer.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialAccountsTab;