import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import MessageTemplateForm from './MessageTemplateForm.jsx';

const MessageTemplateModal = ({ open, onOpenChange, template, onSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        created_by: pb.authStore.model.id
      };

      if (template?.id) {
        await pb.collection('message_templates').update(template.id, dataToSave, { $autoCancel: false });
        toast.success('Modèle mis à jour avec succès');
      } else {
        await pb.collection('message_templates').create(dataToSave, { $autoCancel: false });
        toast.success('Modèle créé avec succès');
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de l\'enregistrement du modèle');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Modifier le modèle' : 'Créer un modèle'}</DialogTitle>
          <DialogDescription>
            Configurez votre modèle de message avec des variables dynamiques.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <MessageTemplateForm 
            initialData={template} 
            onSave={handleSave} 
            onCancel={() => onOpenChange(false)}
            isSaving={isSaving}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageTemplateModal;