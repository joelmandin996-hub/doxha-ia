import React from 'react';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const GroupEventList = ({ events, onEdit, onRefresh }) => {
  
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    
    try {
      await pb.collection('group_events').delete(id, { $autoCancel: false });
      toast.success('Événement supprimé avec succès.');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erreur lors de la suppression.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 border rounded-2xl bg-muted/20">
        <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Aucun événement</h3>
        <p className="text-muted-foreground">Ce groupe n'a pas encore d'événements planifiés.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden hover:border-primary/30 transition-colors">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className="bg-primary/5 sm:w-48 p-4 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-border">
                <p className="text-sm font-medium text-primary capitalize">{formatDate(event.date)}</p>
                <div className="flex items-center text-muted-foreground text-sm mt-2 gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{event.start_time} - {event.end_time}</span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{event.title}</h4>
                  {event.location && (
                    <div className="flex items-center text-muted-foreground text-sm mt-1 gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{event.description}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(event)}>
                    <Pencil className="w-4 h-4 mr-1.5" /> Modifier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-1.5" /> Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GroupEventList;