import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Calendar, Users, QrCode, Download, Printer, ArrowLeft, Ticket, MessageSquare, Edit, Trash2, List } from 'lucide-react';
import { toast } from 'sonner';
import EventFormModal from '@/components/events/EventFormModal.jsx';

function OverviewTab({ event, occupancy }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <Card className="premium-shadow border-none">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">À propos</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description || "Aucune description fournie pour cet événement."}
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Date et Heure</p>
                  <p className="text-sm text-muted-foreground">Début: {format(new Date(event.date_debut), "PPP 'à' HH:mm", { locale: fr })}</p>
                  <p className="text-sm text-muted-foreground">Fin: {format(new Date(event.date_fin), "PPP 'à' HH:mm", { locale: fr })}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--warning))]/10 flex items-center justify-center text-[hsl(var(--warning))] shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Lieu</p>
                  <p className="text-sm text-muted-foreground">{event.lieu || "Lieu non spécifié"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {(event.has_ticketing || event.has_attendance) && (
          <Card className="premium-shadow border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" /> Capacité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-bold tabular-nums-custom">{occupancy}</span>
                <span className="text-muted-foreground mb-1">/ {event.capacite_max} places</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${occupancy / event.capacite_max > 0.9 ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (occupancy / event.capacite_max) * 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function QrCodeTab({ event }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-md mx-auto">
      <Card className="premium-shadow border-none bg-gradient-to-b from-card to-muted/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2"><QrCode className="w-6 h-6" /> Code QR d'accès</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">Scannez ce code pour accéder à l'événement ou enregistrer une présence.</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center pb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8 border">
            <QRCodeSVG value={event.qr_code || event.id} size={240} />
          </div>
          <div className="flex gap-4 w-full">
            <Button variant="outline" className="w-full rounded-xl h-12"><Download className="w-5 h-5 mr-2" /> Télécharger</Button>
            <Button variant="outline" className="w-full rounded-xl h-12"><Printer className="w-5 h-5 mr-2" /> Imprimer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TicketingTab({ event }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border">
        <div>
          <h3 className="text-xl font-bold">Billetterie</h3>
          <p className="text-muted-foreground">Gérez les types de billets et les ventes.</p>
        </div>
        <Button className="rounded-xl"><Ticket className="w-4 h-4 mr-2"/> Ajouter Billet</Button>
      </div>
      
      <div className="flex items-center justify-center p-12 bg-muted/30 border border-dashed rounded-2xl text-center">
        <div>
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h4 className="text-lg font-semibold">Module Billetterie</h4>
          <p className="text-muted-foreground">Fonctionnalité en cours de développement. Les types de billets s'afficheront ici.</p>
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({ event }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-shadow border-none col-span-1 md:col-span-2">
          <CardHeader><CardTitle>Scanner QR Code</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <input type="text" placeholder="Scannez ou entrez le code manuellement..." className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              <Button className="rounded-xl"><QrCode className="w-4 h-4 mr-2" /> Scanner</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="premium-shadow border-none bg-primary text-primary-foreground">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <p className="text-primary-foreground/80 font-medium">Présents actuellement</p>
            <p className="text-4xl font-bold mt-2">0</p>
          </CardContent>
        </Card>
      </div>

      <Card className="premium-shadow border-none">
        <CardHeader><CardTitle>Liste des présences</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Aucune présence enregistrée.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function WaitlistTab({ event }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border">
        <div>
          <h3 className="text-xl font-bold">Liste d'attente</h3>
          <p className="text-muted-foreground">Gérez les personnes en attente de places.</p>
        </div>
      </div>
      <Card className="premium-shadow border-none">
        <CardContent>
          <p className="text-muted-foreground text-center py-12">La liste d'attente est vide.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FollowUpTab({ event }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border">
        <div>
          <h3 className="text-xl font-bold">Suivi et Communications</h3>
          <p className="text-muted-foreground">Envoyez des rappels ou des remerciements.</p>
        </div>
        <Button className="rounded-xl"><MessageSquare className="w-4 h-4 mr-2"/> Nouveau Message</Button>
      </div>
      <Card className="premium-shadow border-none">
        <CardContent>
          <p className="text-muted-foreground text-center py-12">Aucun message de suivi envoyé pour cet événement.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [occupancy, setOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const pathParts = location.pathname.split('/');
  const activeTabFromUrl = pathParts.length > 3 ? pathParts[3] : 'overview';
  const [activeTab, setActiveTab] = useState(activeTabFromUrl);

  const fetchEvent = async () => {
    try {
      const record = await pb.collection('evenements').getOne(id, { $autoCancel: false });
      setEvent(record);
      
      if (record.has_attendance || record.has_ticketing) {
        const presences = await pb.collection('presences').getFullList({ filter: `evenement_id="${id}"`, $autoCancel: false });
        setOccupancy(presences.length);
      }
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger l\'événement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'overview') navigate(`/events/${id}`);
    else navigate(`/events/${id}/${value}`);
  };

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.")) {
      try {
        await pb.collection('evenements').delete(id, { $autoCancel: false });
        toast.success("Événement supprimé.");
        navigate('/events');
      } catch (e) {
        toast.error("Erreur lors de la suppression.");
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        <Skeleton className="h-12 w-[300px] rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] rounded-2xl md:col-span-2" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) return <div className="p-8 text-center text-muted-foreground">Événement introuvable.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Helmet><title>{`${event.titre} - ChurchFlow`}</title></Helmet>

      <Button variant="ghost" onClick={() => navigate('/events')} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux événements
      </Button>

      <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className={event.statut === 'fait' ? 'badge-success' : event.statut === 'annule' ? 'badge-destructive' : 'badge-primary'}>
              {event.statut === 'a_venir' ? 'À venir' : event.statut === 'fait' ? 'Terminé' : 'Annulé'}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md">{event.categorie}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{event.titre}</h1>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="rounded-xl"><Edit className="w-4 h-4 mr-2"/> Modifier</Button>
          <Button variant="outline" onClick={handleDelete} className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start h-auto bg-transparent border-b rounded-none p-0 gap-6 overflow-x-auto hide-scrollbar mb-8 flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 text-base data-[state=active]:text-foreground text-muted-foreground pb-4 pt-2">
            Infos
          </TabsTrigger>
          
          {event.has_qr_code && (
            <TabsTrigger value="qrcode" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 text-base data-[state=active]:text-foreground text-muted-foreground pb-4 pt-2">
              QR Code
            </TabsTrigger>
          )}
          
          {event.has_ticketing && (
            <TabsTrigger value="billets" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 text-base data-[state=active]:text-foreground text-muted-foreground pb-4 pt-2">
              Billetterie
            </TabsTrigger>
          )}
          
          {event.has_attendance && (
            <TabsTrigger value="presences" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 text-base data-[state=active]:text-foreground text-muted-foreground pb-4 pt-2">
              Présences
            </TabsTrigger>
          )}

          {event.has_waitlist && (
            <TabsTrigger value="attente" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 text-base data-[state=active]:text-foreground text-muted-foreground pb-4 pt-2">
              Liste d'attente
            </TabsTrigger>
          )}
          
          {event.has_followup && (
            <TabsTrigger value="suivi" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 text-base data-[state=active]:text-foreground text-muted-foreground pb-4 pt-2">
              Suivi
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="m-0 focus-visible:outline-none"><OverviewTab event={event} occupancy={occupancy} /></TabsContent>
        {event.has_qr_code && <TabsContent value="qrcode" className="m-0 focus-visible:outline-none"><QrCodeTab event={event} /></TabsContent>}
        {event.has_ticketing && <TabsContent value="billets" className="m-0 focus-visible:outline-none"><TicketingTab event={event} /></TabsContent>}
        {event.has_attendance && <TabsContent value="presences" className="m-0 focus-visible:outline-none"><AttendanceTab event={event} /></TabsContent>}
        {event.has_waitlist && <TabsContent value="attente" className="m-0 focus-visible:outline-none"><WaitlistTab event={event} /></TabsContent>}
        {event.has_followup && <TabsContent value="suivi" className="m-0 focus-visible:outline-none"><FollowUpTab event={event} /></TabsContent>}
      </Tabs>

      {isEditModalOpen && (
        <EventFormModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          initialData={event}
          onSuccess={fetchEvent} 
        />
      )}
    </div>
  );
}