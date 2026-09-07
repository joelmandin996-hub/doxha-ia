import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';

const AVAILABLE_VARIABLES = [
  { key: 'nom', label: 'Nom' },
  { key: 'prenom', label: 'Prénom' },
  { key: 'email', label: 'Email' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'groupe', label: 'Groupe' },
  { key: 'date_adhesion', label: 'Date d\'adhésion' },
  { key: 'date_anniversaire', label: 'Date d\'anniversaire' },
  { key: 'age', label: 'Âge' },
  { key: 'date', label: 'Date' },
  { key: 'heure', label: 'Heure' },
  { key: 'lieu', label: 'Lieu' },
  { key: 'type_service', label: 'Type de service' }
];

const SAMPLE_DATA = {
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  telephone: '+33612345678',
  groupe: 'Cellule Nord',
  date_adhesion: '12 Janvier 2024',
  date_anniversaire: '15 Mars',
  age: '34',
  date: 'Dimanche 24 Mars',
  heure: '10:00',
  lieu: 'Salle Principale',
  type_service: 'Culte de célébration'
};

const MessageTemplateForm = ({ initialData, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'Autre',
    content: initialData?.content || '',
    message_types: initialData?.message_types || ['SMS']
  });

  const textareaRef = useRef(null);

  const handleInsertVariable = (variableKey) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const newContent = `${before}{{${variableKey}}}${after}`;
    setFormData({ ...formData, content: newContent });
    
    // Reset focus after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableKey.length + 4, start + variableKey.length + 4);
    }, 0);
  };

  const toggleMessageType = (type) => {
    setFormData(prev => {
      const types = [...prev.message_types];
      if (types.includes(type)) {
        return { ...prev, message_types: types.filter(t => t !== type) };
      } else {
        return { ...prev, message_types: [...types, type] };
      }
    });
  };

  const getPreviewContent = () => {
    let preview = formData.content;
    if (!preview) return 'Aperçu du message...';
    
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, value);
    });
    return preview;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Extract variables used in content
    const usedVariables = [];
    AVAILABLE_VARIABLES.forEach(v => {
      if (formData.content.includes(`{{${v.key}}}`)) {
        usedVariables.push(v.key);
      }
    });

    onSave({
      ...formData,
      variables: usedVariables
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du modèle <span className="text-destructive">*</span></Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Ex: Bienvenue nouveau membre"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie <span className="text-destructive">*</span></Label>
            <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bienvenue">Bienvenue</SelectItem>
                <SelectItem value="Anniversaire">Anniversaire</SelectItem>
                <SelectItem value="Rappel culte">Rappel culte</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Canaux supportés <span className="text-destructive">*</span></Label>
            <div className="flex flex-wrap gap-4">
              {['SMS', 'Email', 'WhatsApp'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type}`} 
                    checked={formData.message_types.includes(type)}
                    onCheckedChange={() => toggleMessageType(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="font-normal cursor-pointer">{type}</Label>
                </div>
              ))}
            </div>
            {formData.message_types.length === 0 && (
              <p className="text-xs text-destructive">Sélectionnez au moins un canal.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Contenu du message <span className="text-destructive">*</span></Label>
              <span className="text-xs text-muted-foreground">{formData.content.length} caractères</span>
            </div>
            <Textarea 
              id="content" 
              ref={textareaRef}
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
              placeholder="Bonjour {{prenom}}, bienvenue dans notre église..."
              className="min-h-[200px] resize-y"
              required
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-muted/30 border-dashed shadow-none">
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm font-semibold">Variables disponibles</Label>
              <p className="text-xs text-muted-foreground mb-2">Cliquez sur une variable pour l'insérer à la position du curseur.</p>
              <ScrollArea className="h-[120px]">
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VARIABLES.map(v => (
                    <Badge 
                      key={v.key} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleInsertVariable(v.key)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> {v.label}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <Label className="text-sm font-semibold text-primary">Aperçu en direct</Label>
              <div className="p-3 bg-background rounded-lg border text-sm whitespace-pre-wrap min-h-[100px]">
                {getPreviewContent()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSaving || formData.message_types.length === 0 || !formData.content.trim()}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer le modèle'}
        </Button>
      </div>
    </form>
  );
};

export default MessageTemplateForm;