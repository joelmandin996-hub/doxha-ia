import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Laptop as NotebookPen, Save, X, History, User2 } from 'lucide-react';
import { toast } from 'sonner';

export const NotesSection = ({ suivi, onNotesUpdate }) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(suivi?.notes || '');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setNotes(suivi?.notes || '');
    fetchHistory();
  }, [suivi?.notes, suivi?.id]);

  const fetchHistory = async () => {
    if (!suivi?.id) return;
    try {
      setLoadingHistory(true);
      const records = await pb.collection('notes_historique').getFullList({
        filter: `suivi_id="${suivi.id}"`,
        sort: '-created',
        expand: 'auteur',
        $autoCancel: false
      });
      setHistory(records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (notes === suivi?.notes) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const updatedSuivi = await pb.collection('suivis').update(suivi.id, { notes }, { $autoCancel: false });
      
      // Add to history log
      await pb.collection('notes_historique').create({
        suivi_id: suivi.id,
        contenu: notes,
        auteur: currentUser.id
      }, { $autoCancel: false });

      toast.success("Notes mises à jour");
      setIsEditing(false);
      if (onNotesUpdate) onNotesUpdate(updatedSuivi);
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <NotebookPen className="w-4 h-4 text-primary" />
            Notes Actuelles
          </h3>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 rounded-lg text-xs">
              Modifier
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Saisissez vos notes d'entretien, de suivi..."
              className="min-h-[160px] bg-background border-primary/20 focus-visible:ring-primary/20 text-sm leading-relaxed"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setNotes(suivi?.notes || ''); }} disabled={loading}>
                <X className="w-4 h-4 mr-1.5" /> Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading} className="shadow-sm">
                <Save className="w-4 h-4 mr-1.5" /> Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl p-4 min-h-[100px] border border-border/50 text-sm whitespace-pre-wrap leading-relaxed">
            {suivi?.notes ? notes : <span className="text-muted-foreground italic">Aucune note enregistrée. Cliquez sur Modifier pour commencer.</span>}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
          <History className="w-4 h-4" />
          Historique des modifications
        </h4>

        {loadingHistory ? (
          <div className="h-12 bg-muted/40 animate-pulse rounded-xl" />
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground italic pl-6">Aucun historique disponible.</p>
        ) : (
          <div className="space-y-4 pl-2 relative before:absolute before:inset-y-0 before:left-[17px] before:w-px before:bg-border">
            {history.map((h, i) => (
              <div key={h.id} className="relative pl-8">
                <div className="absolute left-[13px] top-1.5 w-2 h-2 rounded-full bg-primary/30 ring-4 ring-background" />
                <div className="bg-muted/20 border rounded-xl p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User2 className="w-3 h-3" />
                      {h.expand?.auteur?.name || 'Utilisateur inconnu'}
                    </span>
                    <span className="tabular-nums-custom">
                      {format(new Date(h.created), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-muted-foreground line-clamp-3">
                    {h.contenu}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};