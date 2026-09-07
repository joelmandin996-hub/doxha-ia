import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { CalendarPlus as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DonationForm = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    membre_id: '',
    montant: '',
    date_don: format(new Date(), 'yyyy-MM-dd'),
    type_don: 'unique',
    statut: 'completed',
    description: ''
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
          membre_id: initialData.membre_id || '',
          montant: initialData.montant || '',
          date_don: initialData.date_don ? initialData.date_don.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
          type_don: initialData.type_don || 'unique',
          statut: initialData.statut || 'completed',
          description: initialData.description || ''
        });
      } else {
        setFormData({
          membre_id: '',
          montant: '',
          date_don: format(new Date(), 'yyyy-MM-dd'),
          type_don: 'unique',
          statut: 'completed',
          description: ''
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
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      return toast.error('Le montant doit être supérieur à 0.');
    }
    if (!formData.membre_id) {
      return toast.error('Veuillez sélectionner un membre.');
    }

    setLoading(true);
    try {
      const payload = {
        membre_id: formData.membre_id,
        montant: parseFloat(formData.montant),
        date_don: new Date(formData.date_don).toISOString(),
        type_don: formData.type_don,
        statut: formData.statut,
        description: formData.description,
        created_by: currentUser.id
      };

      if (isEdit) {
        await pb.collection('donations').update(initialData.id, payload, { $autoCancel: false });
        toast.success('Don mis à jour avec succès.');
      } else {
        await pb.collection('donations').create(payload, { $autoCancel: false });
        toast.success('Nouveau don enregistré.');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{isEdit ? 'Modifier le don' : 'Enregistrer un don'}</DialogTitle>
          <DialogDescription>
            Saisissez les détails du don. Tous les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Donateur *</Label>
            <Select value={formData.membre_id} onValueChange={(v) => handleSelectChange('membre_id', v)}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (€) *</Label>
              <Input 
                type="number"
                step="0.01"
                name="montant" 
                value={formData.montant} 
                onChange={handleChange} 
                placeholder="Ex: 50.00" 
                className="bg-muted/30"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Date du don *</Label>
              <div className="relative">
                <Input 
                  type="date"
                  name="date_don" 
                  value={formData.date_don} 
                  onChange={handleChange} 
                  className="bg-muted/30 pl-10"
                  required
                />
                <CalendarIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de don *</Label>
              <Select value={formData.type_don} onValueChange={(v) => handleSelectChange('type_don', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unique">Don Unique</SelectItem>
                  <SelectItem value="recurrent">Don Récurrent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select value={formData.statut} onValueChange={(v) => handleSelectChange('statut', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description / Motif</Label>
            <Textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Ex: Soutien pour le projet de construction..." 
              className="resize-none h-20 bg-muted/30"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl shadow-sm">
              {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Enregistrer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DonationForm;