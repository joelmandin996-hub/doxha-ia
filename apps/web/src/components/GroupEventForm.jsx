import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const GroupEventForm = ({ groupId, event = null, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    description: '',
    location: '',
    auto_sync: false
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        date: event.date ? event.date.split('T')[0] : '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        description: event.description || '',
        location: event.location || '',
        auto_sync: false
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error('L\'heure de fin doit être postérieure à l\'heure de début.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        date: new Date(`${formData.date}T12:00:00Z`).toISOString(),
        start_time: formData.start_time,
        end_time: formData.end_time,
        description: formData.description,
        location: formData.location,
        group_id: groupId
      };

      let savedEvent;
      if (event?.id) {
        savedEvent = await pb.collection('group_events').update(event.id, payload, { $autoCancel: false });
        toast.success('Événement mis à jour avec succès.');
      } else {
        savedEvent = await pb.collection('group_events').create(payload, { $autoCancel: false });
        toast.success('Événement créé avec succès.');
      }
      
      // Auto sync state is passed to parent which handles backend synchronization
      if (onSuccess) onSuccess({ auto_sync: formData.auto_sync, eventId: savedEvent.id });
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'événement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-premium tracking-premium">
      <div className="space-y-2">
        <Label htmlFor="title" className="font-medium">Titre de l'événement <span className="text-destructive">*</span></Label>
        <Input 
          id="title" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          placeholder="ex: Réunion de prière" 
          required 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="font-medium">Date <span className="text-destructive">*</span></Label>
          <Input 
            id="date" 
            name="date" 
            type="date" 
            value={formData.date} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time" className="font-medium">Heure de début <span className="text-destructive">*</span></Label>
          <Input 
            id="start_time" 
            name="start_time" 
            type="time" 
            value={formData.start_time} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time" className="font-medium">Heure de fin <span className="text-destructive">*</span></Label>
          <Input 
            id="end_time" 
            name="end_time" 
            type="time" 
            value={formData.end_time} 
            onChange={handleChange} 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="font-medium">Lieu</Label>
        <Input 
          id="location" 
          name="location" 
          value={formData.location} 
          onChange={handleChange} 
          placeholder="ex: Salle principale, Zoom..." 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="font-medium">Description</Label>
        <Textarea 
          id="description" 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Détails supplémentaires..." 
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2 pt-2 border-t mt-4">
        <Checkbox
          id="auto_sync"
          checked={formData.auto_sync}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_sync: checked }))}
        />
        <Label htmlFor="auto_sync" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Synchroniser automatiquement avec Agenda et Événements
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="font-medium">
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="font-medium">
          {loading ? 'Enregistrement...' : (event ? 'Mettre à jour' : 'Créer l\'événement')}
        </Button>
      </div>
    </form>
  );
};

export default GroupEventForm;