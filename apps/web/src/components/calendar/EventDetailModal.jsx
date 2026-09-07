import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatEventTime, getCategoryColor, getCategoryForeground, getRecurrenceLabel } from '@/lib/calendarUtils.js';
import CategoryIcon from './CategoryIcon.jsx';
import { MapPin, Clock, Repeat, AlignLeft, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const EventDetailModal = ({ event, isOpen, onClose, onRefresh }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Validate event exists and has valid data
  useEffect(() => {
    if (isOpen && event) {
      if (!event.id || !event.titre || !event.date_debut) {
        setIsValid(false);
        toast.error("Les données de cet événement sont corrompues ou incomplètes.");
      } else {
        setIsValid(true);
      }
    }
  }, [isOpen, event]);

  if (!event || !isOpen) return null;

  if (!isValid) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Événement introuvable
            </DialogTitle>
            <DialogDescription>
              Cet événement n'existe plus ou ses données sont invalides. Il a peut-être été supprimé récemment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const responsable = event.expand?.responsable;
  const avatarUrl = responsable?.profile_photo 
    ? pb.files.getURL(responsable, responsable.profile_photo) 
    : undefined;

  const bgColor = getCategoryColor(event.categorie);
  const fgColor = getCategoryForeground(event.categorie);
  const isReadOnly = event.id.startsWith('grp_') || event.id.startsWith('agd_') || event.id.startsWith('sync_');

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet événement ?')) return;
    setLoading(true);
    try {
      const realId = event.originalId || event.id;
      
      // Determine collection based on event type if we need multi-support, assuming 'evenements' primarily
      let collection = 'evenements';
      if (event.id.startsWith('sync_') || event.collection === 'events') {
         toast.error('Veuillez gérer cet événement synchronisé depuis son groupe source.');
         setLoading(false);
         return;
      }

      await pb.collection(collection).delete(realId, { $autoCancel: false });
      toast.success('Événement supprimé avec succès.');
      onClose();
      onRefresh();
    } catch (err) {
      console.error('[EventDetailModal] Error deleting event:', err);
      if (err.status === 404) {
        toast.error('Cet événement a déjà été supprimé.');
        onClose();
        onRefresh();
      } else {
        toast.error('Erreur lors de la suppression.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (newStatus) => {
    setLoading(true);
    try {
      const realId = event.originalId || event.id;
      await pb.collection('evenements').update(realId, { statut: newStatus }, { $autoCancel: false });
      toast.success('Statut mis à jour.');
      onRefresh();
    } catch (err) {
      console.error('[EventDetailModal] Error updating event status:', err);
      if (err.status === 404) {
         toast.error("L'événement n'existe plus.");
         onClose();
         onRefresh();
      } else {
        toast.error('Erreur lors de la mise à jour du statut.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header Banner */}
        <div 
          className="p-6 pb-8 transition-colors" 
          style={{ backgroundColor: bgColor, color: fgColor }}
        >
          <div className="flex justify-between items-start mb-4">
            <Badge variant="outline" className="bg-white/20 border-white/30 text-current hover:bg-white/30">
              <CategoryIcon categorie={event.categorie} showLabel={true} />
            </Badge>
            {event.statut === 'fait' && <Badge className="bg-green-500/20 text-green-100 border-0"><CheckCircle2 className="w-3 h-3 mr-1" /> Terminé</Badge>}
            {event.statut === 'annule' && <Badge className="bg-red-500/20 text-red-100 border-0"><XCircle className="w-3 h-3 mr-1" /> Annulé</Badge>}
            {isReadOnly && <Badge className="bg-black/20 text-white border-0 font-medium">Lecture seule</Badge>}
          </div>
          <DialogTitle className="text-2xl font-bold leading-tight mb-2 text-current">
            {event.titre}
          </DialogTitle>
          <div className="flex items-center gap-2 opacity-90">
            <Clock className="w-4 h-4 shrink-0" />
            <span className="tabular-nums-custom font-medium">
              {formatEventTime(event.date_debut, event.date_fin)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-card">
          {(event.lieu || event.recurrence !== 'une_fois') && (
            <div className="flex flex-col gap-3">
              {event.lieu && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-primary/60" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Lieu</p>
                    <p className="text-sm">{event.lieu}</p>
                  </div>
                </div>
              )}
              {event.recurrence && event.recurrence !== 'une_fois' && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Repeat className="w-5 h-5 shrink-0 mt-0.5 text-primary/60" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Récurrence</p>
                    <p className="text-sm">{getRecurrenceLabel(event.recurrence)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {responsable && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border shadow-sm">
              <Avatar className="h-10 w-10 border bg-background">
                <AvatarImage src={avatarUrl} alt={responsable.name} />
                <AvatarFallback>{responsable.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Responsable</p>
                <p className="text-sm font-semibold">{responsable.name}</p>
              </div>
            </div>
          )}

          {event.description && (
            <div className="flex items-start gap-3">
              <AlignLeft className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {!isReadOnly && (
          <div className="p-4 border-t bg-muted/20 flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { onClose(); navigate(`/calendar/edit/${event.originalId || event.id}`); }} disabled={loading}>
                <Edit className="w-4 h-4 mr-2" /> Modifier
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-transparent shadow-sm" onClick={handleDelete} disabled={loading}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              {event.statut !== 'fait' && (
                <Button size="sm" variant="secondary" className="shadow-sm" onClick={() => handleToggleStatus('fait')} disabled={loading}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Marquer terminé
                </Button>
              )}
              {event.statut !== 'annule' && (
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => handleToggleStatus('annule')} disabled={loading}>
                  Annuler
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;