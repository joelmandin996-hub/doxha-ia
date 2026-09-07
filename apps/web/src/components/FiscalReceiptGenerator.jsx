import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';

const FiscalReceiptGenerator = ({ donation, onGenerated, variant = 'default', className }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!donation || !donation.id) return;
    
    setIsGenerating(true);
    try {
      const response = await apiServerClient.fetch('/donations/generate-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId: donation.id })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }
      
      toast.success(`Reçu ${data.receiptNumber} généré avec succès.`);
      if (onGenerated) {
        onGenerated(data);
      }
    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.error(error.message || 'Impossible de générer le reçu.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      className={className} 
      onClick={handleGenerate} 
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileText className="w-4 h-4 mr-2" />
      )}
      Générer Reçu
    </Button>
  );
};

export default FiscalReceiptGenerator;