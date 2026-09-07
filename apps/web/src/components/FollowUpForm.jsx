import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { FOLLOW_UP_TYPES } from '@/components/FollowUpTypeIcon.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { PRIORITY_LEVELS, getPriorityLabel, getPriorityIcon } from '@/lib/followUpPriorityUtils.js';

const STATUTS = ['Nouveau', 'À contacter', 'Planifié', 'En cours', 'Terminé'];

const FollowUpForm = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    type: 'Nouveau membre',
    statut: 'Nouveau',
    priorite: PRIORITY_LEVELS.NORMAL,
    description: '',
    notes: '',
    membre_id: 'none'
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const records = await pb.collection('members').getFullList({ sort: 'name', $autoCancel: false });
        setMembers(records);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };
    if (isOpen) fetchMembers();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          type: initialData.type || 'Nouveau membre',
          statut: initialData.statut || 'Nouveau',
          priorite: initialData.priorite || PRIORITY_LEVELS.NORMAL,
          description: initialData.description || '',
          notes: initialData.notes || '',
          membre_id: initialData.membre_id || 'none'
        });
      } else {
        setFormData({
          type: 'Nouveau membre',
          statut: 'Nouveau',
          priorite: PRIORITY_LEVELS.NORMAL,
          description: '',
          notes: '',
          membre_id: 'none'
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
    if (!formData.description.trim()) {
      return toast.error('La description est requise.');
    }

    setLoading(true);
    try {
      // Ensure priorite always has a valid value
      let prioriteValue = formData.priorite;
      if (!prioriteValue || !Object.values(PRIORITY_LEVELS).includes(prioriteValue)) {
        prioriteValue = PRIORITY_LEVELS.NORMAL;
      }

      const payload = {
        type: formData.type,
        statut: formData.statut,
        priorite: prioriteValue,
        description: formData.description,
        notes: formData.notes,
        membre_id: formData.membre_id === 'none' ? null : formData.membre_id,
        created_by: currentUser.id
      };

      if (isEdit) {
        await pb.collection('suivis').update(initialData.id, payload, { $autoCancel: false });
        toast.success('Suivi mis à jour avec succès.');
      } else {
        await pb.collection('suivis').create(payload, { $autoCancel: false });
        toast.success('Nouveau suivi créé.');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{isEdit ? 'Modifier le suivi' : 'Créer un suivi'}</DialogTitle>
          <DialogDescription>
            Remplissez les détails du suivi. Les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de suivi *</Label>
              <Select value={formData.type} onValueChange={(v) => handleSelectChange('type', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(FOLLOW_UP_TYPES).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select value={formData.statut} onValueChange={(v) => handleSelectChange('statut', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priorité *</Label>
              <Select value={formData.priorite} onValueChange={(v) => handleSelectChange('priorite', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Sélectionner la priorité" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PRIORITY_LEVELS).map(p => {
                    const Icon = getPriorityIcon(p);
                    return (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          {getPriorityLabel(p)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Membre lié</Label>
              <Select value={formData.membre_id} onValueChange={(v) => handleSelectChange('membre_id', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Aucun membre lié" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun membre lié</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Input 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Ex: Appel suite à la première visite" 
              autoFocus
              className="bg-muted/30"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes supplémentaires</Label>
            <Textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              placeholder="Détails de l'échange, points de prière..." 
              className="resize-none h-24 bg-muted/30"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl shadow-sm">
              {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpForm;