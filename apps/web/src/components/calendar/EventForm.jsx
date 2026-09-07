import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import CategoryIcon from './CategoryIcon.jsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EVENT_CATEGORIES } from '@/lib/calendarUtils.js';
import { CalendarPlus as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const EventForm = ({ initialData, initialDate, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);

  const defaultStart = initialDate ? new Date(initialDate) : new Date();
  defaultStart.setHours(10, 0, 0, 0);
  
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(12, 0, 0, 0);

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_debut: defaultStart,
    date_fin: defaultEnd,
    categorie: 'Réunion de prière',
    lieu: '',
    responsable: 'none',
    recurrence: 'une_fois',
    statut: 'a_venir'
  });

  // États pour contrôler l'ouverture des popovers
  const [debutOpen, setDebutOpen] = useState(false);
  const [finOpen, setFinOpen] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const records = await pb.collection('members').getFullList({ sort: 'name', $autoCancel: false });
        setMembers(records);
      } catch (err) {
        console.error('Failed to load members', err);
      }
    };
    fetchMembers();

    if (initialData) {
      setFormData({
        titre: initialData.titre || '',
        description: initialData.description || '',
        date_debut: new Date(initialData.date_debut),
        date_fin: new Date(initialData.date_fin),
        categorie: initialData.categorie || 'Réunion de prière',
        lieu: initialData.lieu || '',
        responsable: initialData.responsable || 'none',
        recurrence: initialData.recurrence || 'une_fois',
        statut: initialData.statut || 'a_venir'
      });
    }
  }, [initialData]);

  const handleDateChange = (field, newDate) => {
    if (!newDate) return;
    setFormData(prev => {
      const updated = new Date(prev[field]);
      updated.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      return { ...prev, [field]: updated };
    });
  };

  const handleTimeChange = (field, e) => {
    if (!e.target.value) return;
    const [hours, minutes] = e.target.value.split(':');
    setFormData(prev => {
      const updated = new Date(prev[field]);
      updated.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des dates
    if (formData.date_fin < formData.date_debut) {
      toast.error('La date de fin doit être postérieure ou égale à la date de début.');
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        date_debut: formData.date_debut.toISOString(),
        date_fin: formData.date_fin.toISOString(),
        responsable: formData.responsable === 'none' ? null : formData.responsable,
        created_by: pb.authStore.model.id,
      };

      if (initialData?.id) {
        await pb.collection('evenements').update(initialData.id, dataToSubmit, { $autoCancel: false });
        toast.success('Événement mis à jour avec succès.');
      } else {
        await pb.collection('evenements').create(dataToSubmit, { $autoCancel: false });
        toast.success('Événement créé avec succès.');
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="titre">Titre de l'événement <span className="text-destructive">*</span></Label>
          <Input 
            id="titre" 
            required 
            placeholder="Ex: Culte de célébration" 
            value={formData.titre}
            onChange={(e) => setFormData({...formData, titre: e.target.value})}
            className="text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Date de début <span className="text-destructive">*</span></Label>
            <Popover open={debutOpen} onOpenChange={setDebutOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background text-foreground",
                    !formData.date_debut && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                  {formData.date_debut ? format(formData.date_debut, "dd MMM yyyy 'à' HH:mm", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date_debut}
                  onSelect={(date) => handleDateChange('date_debut', date)}
                  initialFocus
                  locale={fr}
                />
                <div className="p-3 border-t bg-muted/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" /> Heure
                    </Label>
                    <Input 
                      type="time" 
                      value={format(formData.date_debut, "HH:mm")} 
                      onChange={(e) => handleTimeChange('date_debut', e)}
                      className="w-[120px] h-8 text-sm"
                    />
                  </div>
                  <Button type="button" size="sm" className="w-full" onClick={() => setDebutOpen(false)}>
                    Valider
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>Date de fin <span className="text-destructive">*</span></Label>
            <Popover open={finOpen} onOpenChange={setFinOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background text-foreground",
                    !formData.date_fin && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                  {formData.date_fin ? format(formData.date_fin, "dd MMM yyyy 'à' HH:mm", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date_fin}
                  onSelect={(date) => handleDateChange('date_fin', date)}
                  initialFocus
                  locale={fr}
                />
                <div className="p-3 border-t bg-muted/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" /> Heure
                    </Label>
                    <Input 
                      type="time" 
                      value={format(formData.date_fin, "HH:mm")} 
                      onChange={(e) => handleTimeChange('date_fin', e)}
                      className="w-[120px] h-8 text-sm"
                    />
                  </div>
                  <Button type="button" size="sm" className="w-full" onClick={() => setFinOpen(false)}>
                    Valider
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="categorie">Catégorie <span className="text-destructive">*</span></Label>
            <Select 
              value={formData.categorie || undefined} 
              onValueChange={(v) => setFormData({...formData, categorie: v})}
            >
              <SelectTrigger id="categorie" className="text-foreground">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {EVENT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <CategoryIcon categorie={cat.value} showLabel={true} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="statut">Statut <span className="text-destructive">*</span></Label>
            <Select 
              value={formData.statut || undefined} 
              onValueChange={(v) => setFormData({...formData, statut: v})}
            >
              <SelectTrigger id="statut" className="text-foreground">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a_venir">À venir</SelectItem>
                <SelectItem value="fait">Terminé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="lieu">Lieu</Label>
          <Input 
            id="lieu" 
            placeholder="Salle principale, Zoom, etc." 
            value={formData.lieu}
            onChange={(e) => setFormData({...formData, lieu: e.target.value})}
            className="text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="responsable">Responsable</Label>
            <Select 
              value={formData.responsable || undefined} 
              onValueChange={(v) => setFormData({...formData, responsable: v})}
            >
              <SelectTrigger id="responsable" className="text-foreground">
                <SelectValue placeholder="Sélectionner un responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recurrence">Récurrence</Label>
            <Select 
              value={formData.recurrence || undefined} 
              onValueChange={(v) => setFormData({...formData, recurrence: v})}
            >
              <SelectTrigger id="recurrence" className="text-foreground">
                <SelectValue placeholder="Sélectionner une récurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="une_fois">Une fois</SelectItem>
                <SelectItem value="quotidien">Quotidien</SelectItem>
                <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                <SelectItem value="mensuel">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="Détails supplémentaires..." 
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="text-foreground"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="rounded-xl">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading} className="min-w-[120px] rounded-xl shadow-sm">
          {loading ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Créer l\'événement'}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;