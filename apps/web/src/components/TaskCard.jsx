import React, { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Trash2, CalendarDays } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPriorityConfig } from './FollowUpTypeIcon.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

export const TaskCard = ({ task, onUpdate, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const isCompleted = task.statut === 'completee';

  const handleToggle = async () => {
    setIsToggling(true);
    const newStatus = isCompleted ? 'non_completee' : 'completee';
    try {
      const updated = await pb.collection('taches_suivi').update(task.id, { statut: newStatus }, { $autoCancel: false });
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour de la tâche');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await pb.collection('taches_suivi').delete(task.id, { $autoCancel: false });
      toast.success('Tâche supprimée');
      if (onDelete) onDelete(task.id);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression de la tâche');
      setIsDeleting(false);
    }
  };

  const priorityConfig = getPriorityConfig(task.priorite);
  const PriorityIcon = priorityConfig.icon;

  let dateColor = "text-muted-foreground";
  if (task.date_echeance && !isCompleted) {
    const d = new Date(task.date_echeance);
    if (isPast(d) && !isToday(d)) dateColor = "text-destructive font-medium";
    else if (isToday(d)) dateColor = "text-amber-500 font-medium";
  }

  return (
    <div className={cn(
      "group flex items-start gap-3 p-4 rounded-xl border bg-card shadow-sm task-complete-anim hover:shadow-md transition-all",
      isCompleted ? "opacity-60 bg-muted/30" : "hover:border-primary/20",
      isDeleting && "opacity-0 scale-95"
    )}>
      <div className="pt-0.5">
        <Checkbox 
          checked={isCompleted} 
          onCheckedChange={handleToggle} 
          disabled={isToggling}
          className={cn("w-5 h-5 rounded-md", isCompleted ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" : "")}
        />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h5 className={cn(
            "text-[15px] font-semibold tracking-tight leading-snug transition-all", 
            isCompleted ? "line-through text-muted-foreground" : "text-foreground"
          )}>
            {task.titre}
          </h5>
          <div className={cn("shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border", priorityConfig.bg, priorityConfig.color, priorityConfig.border)}>
            <PriorityIcon className="w-3 h-3" />
            {task.priorite}
          </div>
        </div>
        
        {task.description && (
          <p className={cn("text-sm line-clamp-2", isCompleted ? "text-muted-foreground/60 line-through" : "text-muted-foreground")}>
            {task.description}
          </p>
        )}
        
        {task.date_echeance && (
          <div className={cn("flex items-center gap-1.5 text-xs pt-1", dateColor)}>
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="tabular-nums-custom">
              {format(new Date(task.date_echeance), 'PPP', { locale: fr })}
            </span>
          </div>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};