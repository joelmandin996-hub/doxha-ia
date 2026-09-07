import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const CATEGORIES = [
  'Réunion de prière', 'Cellule de maison', 'Prédication spéciale', 'Louange & Adoration', 
  'Jeunesse', 'Enfants', 'Événement spécial', 'Conférence', 'Bénévolat & Service'
];

const STATUTS = [
  { value: 'a_venir', label: 'À venir' },
  { value: 'fait', label: 'Terminé' },
  { value: 'annule', label: 'Annulé' }
];

export default function EventFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
    capacite_max: 100,
    statut: 'a_venir',
    categorie: 'Événement spécial',
    has_qr_code: false,
    has_ticketing: false,
    has_attendance: false,
    has_waitlist: false,
    has_followup: false
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          titre: initialData.titre || '',
          description: initialData.description || '',
          date_debut: initialData.date_debut ? new Date(initialData.date_debut).toISOString().slice(0, 16) : '',
          date_fin: initialData.date_fin ? new Date(initialData.date_fin).toISOString().slice(0, 16) : '',
          lieu: initialData.lieu || '',
          capacite_max: initialData.capacite_max || 100,
          statut: initialData.statut || 'a_venir',
          categorie: initialData.categorie || 'Événement spécial',
          has_qr_code: !!initialData.has_qr_code,
          has_ticketing: !!initialData.has_ticketing,
          has_attendance: !!initialData.has_attendance,
          has_waitlist: !!initialData.has_waitlist,
          has_followup: !!initialData.has_followup
        });
      } else {
        const now = new Date();
        const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        setFormData({
          titre: '',
          description: '',
          date_debut: now.toISOString().slice(0, 16),
          date_fin: later.toISOString().slice(0, 16),
          lieu: '',
          capacite_max: 100,
          statut: 'a_venir',
          categorie: 'Événement spécial',
          has_qr_code: false,
          has_ticketing: false,
          has_attendance: false,
          has_waitlist: false,
          has_followup: false
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.date_debut || !formData.date_fin) {
      return toast.error('Veuillez remplir tous les champs obligatoires correctement.');
    }

    if ((formData.has_ticketing || formData.has_attendance) && formData.capacite_max < 1) {
      return toast.error('Une capacité maximale est requise pour la billetterie ou les présences.');
    }

    if (new Date(formData.date_fin) <= new Date(formData.date_debut)) {
      return toast.error('La date de fin doit être après la date de début.');
    }

    setLoading(true);
    try {
      const payload = {
        titre: formData.titre,
        description: formData.description,
        date_debut: new Date(formData.date_debut).toISOString(),
        date_fin: new Date(formData.date_fin).toISOString(),
        lieu: formData.lieu,
        capacite_max: (formData.has_ticketing || formData.has_attendance) ? parseInt(formData.capacite_max, 10) : 0,
        statut: formData.statut,
        categorie: formData.categorie,
        has_qr_code: formData.has_qr_code,
        has_ticketing: formData.has_ticketing,
        has_attendance: formData.has_attendance,
        has_waitlist: formData.has_waitlist,
        has_followup: formData.has_followup,
        created_by: currentUser.id
      };

      if (!isEdit && formData.has_qr_code) {
        payload.qr_code = `EVT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      }

      if (isEdit) {
        await pb.collection('evenements').update(initialData.id, payload, { $autoCancel: false });
        toast.success('Événement mis à jour avec succès.');
      } else {
        await pb.collection('evenements').create(payload, { $autoCancel: false });
        toast.success('Nouvel événement créé.');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement de l'événement.");
    } finally {
      setLoading(false);
    }
  };

  const showCapacity = formData.has_ticketing || formData.has_attendance;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] rounded-[1.5rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{isEdit ? "Modifier l'événement" : 'Créer un événement'}</DialogTitle>
          <DialogDescription>
            Remplissez les détails de l'événement. Les champs avec * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Titre de l'événement *</Label>
              <Input name="titre" value={formData.titre} onChange={handleChange} placeholder="Ex: Culte de célébration" autoFocus required />
            </div>

            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={formData.categorie} onValueChange={(v) => handleSelectChange('categorie', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select value={formData.statut} onValueChange={(v) => handleSelectChange('statut', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {STATUTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Input type="datetime-local" name="date_debut" value={formData.date_debut} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Date de fin *</Label>
              <Input type="datetime-local" name="date_fin" value={formData.date_fin} onChange={handleChange} required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Lieu</Label>
              <Input name="lieu" value={formData.lieu} onChange={handleChange} placeholder="Ex: Salle principale" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Détails de l'événement..." className="h-20 resize-none" />
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h4 className="font-semibold text-lg">Options de l'événement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex items-start space-x-3 bg-muted/30 p-3 rounded-xl border border-transparent hover:border-border transition-colors">
                <Checkbox id="has_qr_code" checked={formData.has_qr_code} onCheckedChange={(c) => handleSelectChange('has_qr_code', c)} className="mt-1" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="has_qr_code" className="cursor-pointer font-medium">QR Code d'entrée</Label>
                  <p className="text-xs text-muted-foreground">Génère un QR code unique pour l'événement.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-muted/30 p-3 rounded-xl border border-transparent hover:border-border transition-colors">
                <Checkbox id="has_ticketing" checked={formData.has_ticketing} onCheckedChange={(c) => handleSelectChange('has_ticketing', c)} className="mt-1" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="has_ticketing" className="cursor-pointer font-medium">Billetterie</Label>
                  <p className="text-xs text-muted-foreground">Active la vente ou réservation de billets.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-muted/30 p-3 rounded-xl border border-transparent hover:border-border transition-colors">
                <Checkbox id="has_attendance" checked={formData.has_attendance} onCheckedChange={(c) => handleSelectChange('has_attendance', c)} className="mt-1" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="has_attendance" className="cursor-pointer font-medium">Présences</Label>
                  <p className="text-xs text-muted-foreground">Permet de pointer les participants présents.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-muted/30 p-3 rounded-xl border border-transparent hover:border-border transition-colors">
                <Checkbox id="has_waitlist" checked={formData.has_waitlist} onCheckedChange={(c) => handleSelectChange('has_waitlist', c)} className="mt-1" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="has_waitlist" className="cursor-pointer font-medium">Liste d'attente</Label>
                  <p className="text-xs text-muted-foreground">Gère les inscriptions au-delà de la capacité.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-muted/30 p-3 rounded-xl border border-transparent hover:border-border transition-colors">
                <Checkbox id="has_followup" checked={formData.has_followup} onCheckedChange={(c) => handleSelectChange('has_followup', c)} className="mt-1" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="has_followup" className="cursor-pointer font-medium">Suivi & Messages</Label>
                  <p className="text-xs text-muted-foreground">Active l'envoi de messages post-événement.</p>
                </div>
              </div>

            </div>
          </div>

          {showCapacity && (
            <div className="space-y-2 bg-primary/5 p-4 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
              <Label className="text-primary">Capacité maximale *</Label>
              <p className="text-xs text-muted-foreground mb-2">Requise car la billetterie ou les présences sont activées.</p>
              <Input type="number" name="capacite_max" min="1" value={formData.capacite_max} onChange={handleChange} required className="bg-background max-w-[200px]" />
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">Annuler</Button>
            <Button type="submit" disabled={loading} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}