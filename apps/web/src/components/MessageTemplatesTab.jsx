import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Copy, Send, Trash2, MessageSquare, Mail, Phone, FileText, Gift, CalendarClock } from 'lucide-react';
import MessageTemplateModal from './MessageTemplateModal.jsx';
import UseTemplateModal from './UseTemplateModal.jsx';

const getCategoryStyles = (category) => {
  switch (category) {
    case 'Bienvenue':
      return { bg: 'bg-[hsl(var(--template-welcome)/0.1)]', text: 'text-[hsl(var(--template-welcome))]', icon: <FileText className="w-6 h-6" /> };
    case 'Anniversaire':
      return { bg: 'bg-[hsl(var(--template-birthday)/0.1)]', text: 'text-[hsl(var(--template-birthday))]', icon: <Gift className="w-6 h-6" /> };
    case 'Rappel culte':
      return { bg: 'bg-[hsl(var(--template-service)/0.1)]', text: 'text-[hsl(var(--template-service))]', icon: <CalendarClock className="w-6 h-6" /> };
    default:
      return { bg: 'bg-[hsl(var(--template-other)/0.1)]', text: 'text-[hsl(var(--template-other))]', icon: <MessageSquare className="w-6 h-6" /> };
  }
};

const MessageTemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUseOpen, setIsUseOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('message_templates').getList(1, 50, {
        sort: '-created',
        $autoCancel: false
      });
      setTemplates(records.items);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erreur lors du chargement des modèles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleDuplicate = (template) => {
    const duplicated = { ...template };
    delete duplicated.id;
    delete duplicated.created;
    delete duplicated.updated;
    duplicated.name = `${template.name} (Copie)`;
    setSelectedTemplate(duplicated);
    setIsFormOpen(true);
  };

  const handleUse = (template) => {
    setSelectedTemplate(template);
    setIsUseOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce modèle ?')) return;
    try {
      await pb.collection('message_templates').delete(id, { $autoCancel: false });
      toast.success('Modèle supprimé');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un modèle..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Nouveau modèle
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-2xl shadow-sm">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun modèle trouvé</h3>
          <p className="text-muted-foreground mb-6">Créez des modèles pour envoyer rapidement des messages récurrents.</p>
          <Button onClick={handleCreate} variant="outline">Créer le premier modèle</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const styles = getCategoryStyles(template.category);
            return (
              <div key={template.id} className="template-card flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`template-icon ${styles.bg} ${styles.text}`}>
                    {styles.icon}
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {template.category}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 line-clamp-1" title={template.name}>
                  {template.name}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                  {template.content}
                </p>
                
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {template.message_types?.map(type => (
                    <Badge key={type} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {type}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t mt-auto">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)} className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Modifier">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)} className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Dupliquer">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => handleUse(template)} className="gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Utiliser
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MessageTemplateModal 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        template={selectedTemplate} 
        onSuccess={fetchTemplates} 
      />

      <UseTemplateModal 
        open={isUseOpen} 
        onOpenChange={setIsUseOpen} 
        template={selectedTemplate} 
      />
    </div>
  );
};

export default MessageTemplatesTab;