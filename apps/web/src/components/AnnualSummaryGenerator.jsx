import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient';

const AnnualSummaryGenerator = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);

  const [formData, setFormData] = useState({
    membre_id: '',
    year: currentYear.toString()
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.membre_id) return toast.error('Veuillez sélectionner un membre.');

    setLoading(true);
    try {
      const response = await apiServerClient.fetch('/donations/annual-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memberId: formData.membre_id,
          year: parseInt(formData.year, 10)
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }
      
      toast.success('Récapitulatif généré avec succès !');
      
      // Auto-download PDF
      if (data.pdfUrl) {
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.target = '_blank';
        link.download = `Recapitulatif_Dons_${formData.year}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      onClose();
    } catch (error) {
      console.error('Annual summary error:', error);
      toast.error(error.message || 'Impossible de générer le récapitulatif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Récapitulatif Annuel des Dons</DialogTitle>
          <DialogDescription>
            Générez un état complet des dons annuels pour un membre (format Cerfa).
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Donateur *</Label>
            <Select value={formData.membre_id} onValueChange={(v) => setFormData(prev => ({...prev, membre_id: v}))}>
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

          <div className="space-y-2">
            <Label>Année Fiscale *</Label>
            <Select value={formData.year} onValueChange={(v) => setFormData(prev => ({...prev, year: v}))}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Sélectionner l'année" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl shadow-sm">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {loading ? 'Génération...' : 'Générer (PDF & Excel)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AnnualSummaryGenerator;