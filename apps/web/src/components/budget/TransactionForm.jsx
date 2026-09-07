import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CalendarPlus as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils.js';

const CATEGORIES_RECETTE = ['Dîmes', 'Offrandes', 'Dons', 'Dons par projet', 'Subventions', 'Événements', 'Autres'];
const CATEGORIES_DEPENSE = ['Loyer', 'Électricité', 'Eau', 'Assurance', 'Communication', 'Matériel', 'Missions', 'Aide sociale', 'Salaires', 'Événements', 'Transport', 'Travaux', 'Autres'];

export function TransactionForm({ type = 'recette', onSuccess, onCancel }) {
  const isRecette = type === 'recette';
  const collectionName = isRecette ? 'transactions_recettes' : 'transactions_depenses';
  const categories = isRecette ? CATEGORIES_RECETTE : CATEGORIES_DEPENSE;

  const [loading, setLoading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(),
    categorie: '',
    montant: '',
    description: '',
    statut: 'Payé',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categorie || !formData.montant) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        date: `${format(formData.date, 'yyyy-MM-dd')} 12:00:00.000Z`,
        categorie: formData.categorie,
        montant: parseFloat(formData.montant),
        created_by: pb.authStore.model.id,
      };

      if (isRecette) {
        dataToSubmit.description = formData.description;
      } else {
        dataToSubmit.note = formData.description;
        dataToSubmit.statut = formData.statut;
      }

      await pb.collection(collectionName).create(dataToSubmit, { $autoCancel: false });
      
      toast.success(isRecette ? 'Recette ajoutée avec succès.' : 'Dépense ajoutée avec succès.');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Une erreur est survenue lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
      <div className="space-y-1.5">
        <Label>Date *</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={loading}
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.date ? format(formData.date, "PPP", { locale: fr }) : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.date}
              onSelect={(date) => {
                setFormData({...formData, date});
                setDateOpen(false);
              }}
              initialFocus
              locale={fr}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categorie">Catégorie *</Label>
        <Select 
          required 
          value={formData.categorie || undefined} 
          onValueChange={v => setFormData({...formData, categorie: v})}
          disabled={loading}
        >
          <SelectTrigger id="categorie">
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="montant">Montant (€) *</Label>
        <Input 
          id="montant"
          type="number" 
          step="0.01" 
          min="0.01" 
          required 
          value={formData.montant} 
          onChange={e => setFormData({...formData, montant: e.target.value})} 
          placeholder="0.00" 
          disabled={loading}
        />
      </div>

      {!isRecette && (
        <div className="space-y-1.5">
          <Label htmlFor="statut">Statut *</Label>
          <Select 
            required 
            value={formData.statut || undefined} 
            onValueChange={v => setFormData({...formData, statut: v})}
            disabled={loading}
          >
            <SelectTrigger id="statut">
              <SelectValue placeholder="Sélectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Payé">Payé</SelectItem>
              <SelectItem value="Non payé">Non payé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="description">{isRecette ? 'Description' : 'Note'} (Optionnel)</Label>
        <Input 
          id="description"
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          placeholder="Détails supplémentaires..." 
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}