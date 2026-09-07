import React, { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, FileText, UserCircle2, ListTodo } from 'lucide-react';
import { FollowUpTypeIcon } from '@/components/FollowUpTypeIcon.jsx';
import FollowUpPriorityBadge from '@/components/FollowUpPriorityBadge.jsx';
import { cn } from '@/lib/utils';
import pb from '@/lib/pocketbaseClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const STATUS_GRADIENTS = {
  'Nouveau': 'from-blue-500/80 to-blue-600/80',
  'À contacter': 'from-amber-400/80 to-amber-500/80',
  'Planifié': 'from-purple-500/80 to-purple-600/80',
  'En cours': 'from-emerald-400/80 to-emerald-500/80',
  'Terminé': 'from-slate-400/80 to-slate-500/80'
};

const FollowUpCard = ({ suivi, index, onClick }) => {
  const [tasksCount, setTasksCount] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    let isMounted = true;
    const fetchTasksCount = async () => {
      try {
        const records = await pb.collection('taches_suivi').getList(1, 50, {
          filter: `suivi_id="${suivi.id}"`,
          fields: 'statut',
          $autoCancel: false
        });
        if (isMounted) {
          const completed = records.items.filter(r => r.statut === 'completee').length;
          setTasksCount({ total: records.items.length, completed });
        }
      } catch (e) {
        // ignore silently for cards
      }
    };
    if (suivi.id) fetchTasksCount();
    return () => { isMounted = false };
  }, [suivi.id]);

  return (
    <Draggable draggableId={suivi.id} index={index}>
      {(provided, snapshot) => (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                onClick={() => onClick(suivi)}
                className={cn(
                  "group relative flex flex-col rounded-2xl border bg-card text-card-foreground overflow-hidden",
                  "kanban-drag-transition cursor-grab active:cursor-grabbing",
                  snapshot.isDragging 
                    ? "z-50 opacity-[0.95] shadow-[var(--kanban-card-shadow-drag)] rotate-2 scale-[1.02] border-primary/30" 
                    : "shadow-[var(--kanban-card-shadow)] hover:shadow-[var(--kanban-card-shadow-hover)] hover:-translate-y-0.5 hover:border-primary/20"
                )}
                style={provided.draggableProps.style}
              >
                {/* Top Status Gradient Bar */}
                <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", STATUS_GRADIENTS[suivi.statut] || 'from-border to-border')} />

                <div className="p-4 pt-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      <FollowUpPriorityBadge priority={suivi.priorite} size="sm" />
                      <FollowUpTypeIcon type={suivi.type} showLabel className="text-[10px] py-0.5 px-2 rounded-md font-semibold tracking-wide bg-secondary border-none truncate" />
                      {suivi.sous_rubrique && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border font-medium truncate">
                          {suivi.sous_rubrique}
                        </span>
                      )}
                    </div>
                    {suivi.expand?.membre_id && (
                      <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary" title={suivi.expand.membre_id.name}>
                        <UserCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-[14px] leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {suivi.description || 'Sans description'}
                    </h4>
                    {suivi.expand?.membre_id && (
                      <p className="text-[13px] text-muted-foreground font-medium flex items-center gap-1.5 line-clamp-1">
                        {suivi.expand.membre_id.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-muted/20 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground/80">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span className="tabular-nums-custom">{format(new Date(suivi.created), 'dd MMM', { locale: fr })}</span>
                    </div>
                    
                    {tasksCount.total > 0 && (
                      <div className={cn("flex items-center gap-1 font-medium", tasksCount.completed === tasksCount.total ? "text-emerald-600" : "")}>
                        <ListTodo className="w-3.5 h-3.5" />
                        <span className="tabular-nums-custom">{tasksCount.completed}/{tasksCount.total}</span>
                      </div>
                    )}
                  </div>
                  
                  {suivi.notes && (
                    <div className="flex items-center gap-1 text-primary/70 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="max-w-[250px] p-3 space-y-2 rounded-xl border shadow-lg bg-card text-card-foreground">
              <p className="font-semibold text-sm leading-tight">{suivi.description}</p>
              {suivi.notes && (
                <div className="text-xs text-muted-foreground line-clamp-3 bg-muted/30 p-2 rounded-md border border-border/50">
                  {suivi.notes}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Draggable>
  );
};

export default FollowUpCard;