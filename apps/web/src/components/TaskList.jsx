import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { TaskCard } from './TaskCard.jsx';
import { TaskForm } from './TaskForm.jsx';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, ListTodo } from 'lucide-react';
import { toast } from 'sonner';

export const TaskList = ({ suiviId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('taches_suivi').getFullList({
        filter: `suivi_id="${suiviId}"`,
        sort: 'statut,-date_echeance,-created', // incomplete first, then ordered by due date/creation
        $autoCancel: false
      });
      setTasks(records);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (suiviId) fetchTasks();
  }, [suiviId]);

  const completedCount = tasks.filter(t => t.statut === 'completee').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const handleUpdate = (updatedTask) => {
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      // Resort logic can be applied here or just re-fetch for simplicity
      return newTasks.sort((a, b) => {
        if (a.statut !== b.statut) return a.statut === 'completee' ? 1 : -1;
        return new Date(b.created) - new Date(a.created);
      });
    });
  };

  const handleDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 w-full max-w-md">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-foreground flex items-center gap-1.5">
              <ListTodo className="w-4 h-4 text-primary" />
              Progression
            </span>
            <span className="text-muted-foreground tabular-nums-custom">
              {completedCount} / {tasks.length} ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-2.5 bg-muted" indicatorClassName={progress === 100 ? "bg-emerald-500" : "bg-primary"} />
        </div>
        
        <Button onClick={() => setIsFormOpen(true)} size="sm" className="rounded-xl shadow-sm shrink-0">
          <Plus className="w-4 h-4 mr-1.5" /> Nouvelle tâche
        </Button>
      </div>

      <div className="space-y-3 mt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-muted/40 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 px-4 bg-muted/20 border border-dashed rounded-2xl">
            <ListTodo className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h4 className="text-foreground font-semibold text-base mb-1">Aucune tâche</h4>
            <p className="text-sm text-muted-foreground mb-4">Ajoutez des tâches pour suivre vos actions.</p>
            <Button variant="outline" onClick={() => setIsFormOpen(true)} className="rounded-xl shadow-sm">
              Ajouter une tâche
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={handleUpdate} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
        )}
      </div>

      <TaskForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        suiviId={suiviId} 
        onSuccess={fetchTasks} 
      />
    </div>
  );
};