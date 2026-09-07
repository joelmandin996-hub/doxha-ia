import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { CalendarPlus as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const RecurringDonationForm = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    membre_id: '',
    montant_mensuel: '',
    jour_du_mois: '1',
    statut: 'actif',
    date_debut: format(new Date(), 'yyyy-MM-dd'),
    date_fin: ''
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
          montant_mensuel: initialData.montant_mensuel || '',
          jour_du_mois: initialData.jour_du_mois?.toString() || '1',
          statut: initialData.statut || 'actif',
          date_debut: initialData.date_debut ? initialData.date_debut.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
          date_fin: initialData.date_fin ? initialData.date_fin.split('T')[0] : ''
        });
      } else {
        setFormData({
          membre_id: '',
          montant_mensuel: '',
          jour_du_mois: '1',
          statut: 'actif',
          date_debut: format(new Date(), 'yyyy-MM-dd'),
          date_fin: ''
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
    if (!formData.montant_mensuel || parseFloat(formData.montant_mensuel) <= 0) {
      return toast.error('Le montant doit être supérieur à 0.');
    }
    if (!formData.membre_id) {
      return toast.error('Veuillez sélectionner un membre.');
    }

    setLoading(true);
    try {
      const payload = {
        membre_id: formData.membre_id,
        montant_mensuel: parseFloat(formData.montant_mensuel),
        jour_du_mois: parseInt(formData.jour_du_mois, 10),
        statut: formData.statut,
        date_debut: new Date(formData.date_debut).toISOString(),
        date_fin: formData.date_fin ? new Date(formData.date_fin).toISOString() : null,
        created_by: currentUser.id
      };

      if (isEdit) {
        await pb.collection('dons_recurrents').update(initialData.id, payload, { $autoCancel: false });
        toast.success('Don récurrent mis à jour avec succès.');
      } else {
        await pb.collection('dons_recurrents').create(payload, { $autoCancel: false });
        toast.success('Nouveau don récurrent enregistré.');
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
          <DialogTitle className="text-xl font-bold">{isEdit ? 'Modifier le don récurrent' : 'Configurer un don récurrent'}</DialogTitle>
          <DialogDescription>
            Gérez les dons réguliers prélevés ou promis mensuellement.
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
              <Label>Montant Mensuel (€) *</Label>
              <Input 
                type="number"
                step="0.01"
                name="montant_mensuel" 
                value={formData.montant_mensuel} 
                onChange={handleChange} 
                placeholder="Ex: 50.00" 
                className="bg-muted/30"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Jour du mois (1-31) *</Label>
              <Input 
                type="number"
                min="1"
                max="31"
                name="jour_du_mois" 
                value={formData.jour_du_mois} 
                onChange={handleChange} 
                className="bg-muted/30"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <div className="relative">
                <Input 
                  type="date"
                  name="date_debut" 
                  value={formData.date_debut} 
                  onChange={handleChange} 
                  className="bg-muted/30 pl-10"
                  required
                />
                <CalendarIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Date de fin (Optionnel)</Label>
              <div className="relative">
                <Input 
                  type="date"
                  name="date_fin" 
                  value={formData.date_fin} 
                  onChange={handleChange} 
                  className="bg-muted/30 pl-10"
                />
                <CalendarIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Statut *</Label>
            <Select value={formData.statut} onValueChange={(v) => handleSelectChange('statut', v)}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
              </SelectContent>
            </Select>
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

export default RecurringDonationForm;