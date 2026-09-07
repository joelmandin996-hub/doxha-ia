import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Link as LinkIcon, Hash, Edit, Trash2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

const SocialPostDetailModal = ({ post, isOpen, onClose, onEdit, onRefresh }) => {
  if (!post) return null;

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette publication ?")) return;
    
    try {
      await pb.collection('social_posts').delete(post.id, { $autoCancel: false });
      toast.success("Publication supprimée");
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails de la publication</span>
            <Badge variant={post.status === 'Publié' ? 'default' : post.status === 'Programmé' ? 'secondary' : 'outline'}>
              {post.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content */}
          <div className="bg-muted/30 p-4 rounded-xl border">
            <p className="whitespace-pre-wrap text-sm">{post.content}</p>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.scheduled_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{post.scheduled_time}</span>
            </div>
            {post.link && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <LinkIcon className="w-4 h-4" />
                <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                  {post.link}
                </a>
              </div>
            )}
            {post.hashtags && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <Hash className="w-4 h-4" />
                <span className="truncate">{post.hashtags}</span>
              </div>
            )}
          </div>

          {/* Accounts */}
          {post.expand?.accounts && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Comptes cibles</h4>
              <div className="flex flex-wrap gap-2">
                {post.expand.accounts.map(acc => (
                  <Badge key={acc.id} variant="outline" className={`badge-social-${acc.platform}`}>
                    {acc.platform === 'facebook' ? 'FB' : 'IG'} - {acc.account_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            <Button onClick={() => { onClose(); onEdit(post); }} className="gap-2">
              <Edit className="w-4 h-4" /> Modifier
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SocialPostDetailModal;