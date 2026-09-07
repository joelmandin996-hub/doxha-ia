import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { getPriorityConfig } from './FollowUpTypeIcon.jsx';

export const TaskForm = ({ isOpen, onClose, suiviId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    priorite: 'Normale',
    date_echeance: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) return toast.error('Le titre est requis');

    setLoading(true);
    try {
      await pb.collection('taches_suivi').create({
        suivi_id: suiviId,
        titre: formData.titre,
        description: formData.description,
        priorite: formData.priorite,
        date_echeance: formData.date_echeance ? new Date(formData.date_echeance).toISOString() : null,
        statut: 'non_completee'
      }, { $autoCancel: false });
      
      toast.success('Tâche ajoutée');
      onSuccess();
      setFormData({ titre: '', description: '', priorite: 'Normale', date_echeance: '' });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la création de la tâche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !loading && !val && onClose()}>
      <DialogContent className="sm:max-w-[450px] rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Nouvelle tâche</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Titre <span className="text-destructive">*</span></Label>
            <Input 
              name="titre" 
              value={formData.titre} 
              onChange={handleChange} 
              placeholder="Ex: Rappeler pour confirmer le rendez-vous" 
              autoFocus
              className="bg-muted/30"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Détails de la tâche..." 
              className="resize-none h-20 bg-muted/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <Select value={formData.priorite} onValueChange={(val) => setFormData(p => ({ ...p, priorite: val }))}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  {['Haute', 'Normale', 'Basse'].map(p => {
                    const cfg = getPriorityConfig(p);
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} /> {p}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label>Date d'échéance</Label>
              <Input 
                type="date" 
                name="date_echeance" 
                value={formData.date_echeance} 
                onChange={handleChange} 
                className="bg-muted/30"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl shadow-sm">
              {loading ? 'Création...' : 'Créer la tâche'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};