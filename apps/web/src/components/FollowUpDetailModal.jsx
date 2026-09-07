import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FollowUpTypeIcon } from '@/components/FollowUpTypeIcon.jsx';
import FollowUpPriorityBadge from '@/components/FollowUpPriorityBadge.jsx';
import { CalendarPlus as CalendarIcon, User, ListTodo, FileText, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SubCategoryBadge } from './SubCategoryBadge.jsx';
import { TaskList } from './TaskList.jsx';
import { NotesSection } from './NotesSection.jsx';
import { PRIORITY_LEVELS, getPriorityLabel, getPriorityIcon } from '@/lib/followUpPriorityUtils.js';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

const STATUS_COLORS = {
  'Nouveau': 'bg-blue-500/10 text-blue-600',
  'À contacter': 'bg-amber-500/10 text-amber-600',
  'Planifié': 'bg-purple-500/10 text-purple-600',
  'En cours': 'bg-emerald-500/10 text-emerald-600',
  'Terminé': 'bg-slate-500/10 text-slate-600'
};

const FollowUpDetailModal = ({ isOpen, onClose, suivi, onEdit, onDeleteSuccess, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!suivi) return null;

  const handlePriorityChange = async (newPriority) => {
    // Validate that newPriority is a valid priority level
    if (!Object.values(PRIORITY_LEVELS).includes(newPriority)) {
      toast.error('Priorité invalide.');
      return;
    }

    // Don't update if priority hasn't changed
    if (newPriority === suivi.priorite) return;

    try {
      // Ensure priorite is always included in the update payload with a valid value
      const payload = {
        priorite: newPriority
      };

      const updated = await pb.collection('suivis').update(suivi.id, payload, { $autoCancel: false });
      toast.success("Priorité mise à jour");
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour de la priorité");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden gap-0 rounded-[1.5rem]">
        <div className="bg-muted/10 border-b p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-wrap gap-2">
                <FollowUpTypeIcon type={suivi.type} showLabel />
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-full transition-transform active:scale-95">
                    <FollowUpPriorityBadge priority={suivi.priorite} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl shadow-lg border-border min-w-[150px]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Modifier la priorité
                    </div>
                    {Object.values(PRIORITY_LEVELS).map(p => {
                      const Icon = getPriorityIcon(p);
                      return (
                        <DropdownMenuItem 
                          key={p} 
                          onClick={() => handlePriorityChange(p)}
                          className="flex items-center gap-2 cursor-pointer font-medium py-2 rounded-lg"
                        >
                          <Icon className="w-4 h-4" />
                          {getPriorityLabel(p)}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <SubCategoryBadge suivi={suivi} onUpdate={onUpdate} />
              </div>
              <Badge variant="outline" className={STATUS_COLORS[suivi.statut] || 'bg-muted text-muted-foreground'}>
                {suivi.statut}
              </Badge>
            </div>
            <DialogTitle className="text-2xl mt-4 mb-2 leading-tight tracking-tight text-foreground font-bold">
              {suivi.description || 'Suivi sans description'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="w-full bg-muted/50 p-1 rounded-xl grid grid-cols-3 h-auto">
              <TabsTrigger value="details" className="rounded-lg py-2 data-[state=active]:shadow-sm text-sm font-medium">
                <Info className="w-4 h-4 mr-2" /> Détails
              </TabsTrigger>
              <TabsTrigger value="taches" className="rounded-lg py-2 data-[state=active]:shadow-sm text-sm font-medium">
                <ListTodo className="w-4 h-4 mr-2" /> Tâches
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg py-2 data-[state=active]:shadow-sm text-sm font-medium">
                <FileText className="w-4 h-4 mr-2" /> Notes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto hide-scrollbar bg-background">
          <Tabs value={activeTab} className="w-full">
            
            <TabsContent value="details" className="m-0 space-y-6">
              {/* Member Info */}
              {suivi.expand?.membre_id ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{suivi.expand.membre_id.name}</p>
                    <p className="text-sm text-muted-foreground">{suivi.expand.membre_id.email || 'Aucun email'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-dashed">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Aucun membre lié à ce suivi.</p>
                </div>
              )}

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm space-y-1.5">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" /> Créé le
                  </span>
                  <p className="font-semibold text-[15px] tabular-nums-custom">{format(new Date(suivi.created), 'PPP', { locale: fr })}</p>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm space-y-1.5">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" /> Dernière modif.
                  </span>
                  <p className="font-semibold text-[15px] tabular-nums-custom">{format(new Date(suivi.updated), 'PPP', { locale: fr })}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="taches" className="m-0">
              <TaskList suiviId={suivi.id} />
            </TabsContent>

            <TabsContent value="notes" className="m-0">
              <NotesSection suivi={suivi} onNotesUpdate={onUpdate} />
            </TabsContent>

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpDetailModal;