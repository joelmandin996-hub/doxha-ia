import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';

const ReceiptEmailSender = ({ isOpen, onClose, receipt, donorEmail, onSent }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: donorEmail || '',
    message: `Bonjour,\n\nNous vous remercions pour votre don généreux.\nVeuillez trouver ci-joint votre reçu fiscal pour l'année en cours.\n\nCordialement,\nL'équipe`
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receipt || !receipt.id) return toast.error('Reçu invalide.');
    if (!formData.email) return toast.error('L\'email du donateur est requis.');

    setLoading(true);
    try {
      const response = await apiServerClient.fetch('/donations/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiptId: receipt.id,
          donorEmail: formData.email,
          message: formData.message
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }
      
      toast.success('Le reçu a été envoyé par email.');
      if (onSent) onSent();
      onClose();
    } catch (error) {
      console.error('Receipt send error:', error);
      toast.error(error.message || 'Impossible d\'envoyer l\'email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Envoyer le reçu par email</DialogTitle>
          <DialogDescription>
            {receipt?.numero_recu ? `Reçu ${receipt.numero_recu}` : 'Préparation de l\'envoi...'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email du destinataire *</Label>
            <Input 
              type="email"
              value={formData.email} 
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
              placeholder="donateur@example.com" 
              className="bg-muted/30 text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Message d'accompagnement *</Label>
            <Textarea 
              value={formData.message} 
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} 
              className="resize-none h-32 bg-muted/30 text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Le reçu PDF sera attaché automatiquement à cet email.</p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl shadow-sm">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {loading ? 'Envoi en cours...' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptEmailSender;