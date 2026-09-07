import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { MessageSquare, Mail, Phone } from 'lucide-react';

const UseTemplateModal = ({ open, onOpenChange, template, onSuccess }) => {
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [variables, setVariables] = useState({});
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
      if (template) {
        // Initialize variables object with empty strings for each required variable
        const initialVars = {};
        (template.variables || []).forEach(v => {
          initialVars[v] = '';
        });
        setVariables(initialVars);
        
        // Set default channel if available
        if (template.message_types && template.message_types.length > 0) {
          setSelectedChannel(template.message_types[0].toLowerCase());
        }
      }
    } else {
      setSelectedMemberId('');
      setVariables({});
    }
  }, [open, template]);

  const fetchMembers = async () => {
    try {
      const records = await pb.collection('members').getFullList({ sort: 'name', $autoCancel: false });
      setMembers(records);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleVariableChange = (key, value) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const getPreviewContent = () => {
    if (!template) return '';
    let preview = template.content;
    
    // Replace with user input variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, value || `[${key}]`);
    });
    
    // Replace with selected member data if available
    if (selectedMemberId) {
      const member = members.find(m => m.id === selectedMemberId);
      if (member) {
        preview = preview.replace(/{{nom}}/g, member.name.split(' ')[1] || '');
        preview = preview.replace(/{{prenom}}/g, member.name.split(' ')[0] || member.name);
        preview = preview.replace(/{{email}}/g, member.email || '');
        preview = preview.replace(/{{telephone}}/g, member.phone || '');
      }
    }
    
    return preview;
  };

  const handleSend = async () => {
    if (!selectedMemberId) {
      toast.error('Veuillez sélectionner un destinataire');
      return;
    }
    if (!selectedChannel) {
      toast.error('Veuillez sélectionner un canal d\'envoi');
      return;
    }

    setIsSending(true);
    try {
      const response = await apiServerClient.fetch('/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          recipient_id: selectedMemberId,
          message_type: selectedChannel,
          variables: variables
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi');
      }

      toast.success('Message envoyé avec succès');
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Send error:', error);
      toast.error(error.message || 'Échec de l\'envoi du message');
    } finally {
      setIsSending(false);
    }
  };

  if (!template) return null;

  // Filter out variables that are automatically filled by member data
  const manualVariables = (template.variables || []).filter(v => 
    !['nom', 'prenom', 'email', 'telephone'].includes(v)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Utiliser le modèle: {template.name}</DialogTitle>
          <DialogDescription>
            Sélectionnez un destinataire et remplissez les variables manquantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Destinataire <span className="text-destructive">*</span></Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Rechercher un membre..." />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Canal d'envoi <span className="text-destructive">*</span></Label>
            <RadioGroup 
              value={selectedChannel} 
              onValueChange={setSelectedChannel}
              className="flex gap-4"
            >
              {template.message_types?.map(type => {
                const val = type.toLowerCase();
                return (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={val} id={`ch-${val}`} />
                    <Label htmlFor={`ch-${val}`} className="flex items-center gap-1.5 cursor-pointer">
                      {val === 'sms' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                      {val === 'whatsapp' && <Phone className="w-4 h-4 text-green-500" />}
                      {val === 'email' && <Mail className="w-4 h-4 text-purple-500" />}
                      {type}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {manualVariables.length > 0 && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border">
              <Label className="text-sm font-semibold">Variables à remplir</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {manualVariables.map(v => (
                  <div key={v} className="space-y-1.5">
                    <Label htmlFor={`var-${v}`} className="text-xs capitalize">{v.replace('_', ' ')}</Label>
                    <Input 
                      id={`var-${v}`}
                      value={variables[v] || ''}
                      onChange={(e) => handleVariableChange(v, e.target.value)}
                      placeholder={`Valeur pour ${v}`}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Aperçu du message final</Label>
            <div className="p-4 bg-card border rounded-xl text-sm whitespace-pre-wrap min-h-[100px] shadow-sm">
              {getPreviewContent()}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={isSending || !selectedMemberId || !selectedChannel}>
            {isSending ? 'Envoi en cours...' : 'Envoyer le message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UseTemplateModal;