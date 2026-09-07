import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, ThumbsUp, Send, Facebook, Instagram } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';

const SocialCommentsTab = () => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const records = await pb.collection('social_comments').getFullList({
        sort: '-created',
        expand: 'post_id,account_id',
        $autoCancel: false
      });
      setComments(records);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Impossible de charger les commentaires");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleReplySubmit = async (comment) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    
    try {
      const response = await apiServerClient.fetch('/social/comments/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: comment.post_id,
          comment_id: comment.external_comment_id,
          reply_text: replyText,
          platform: comment.platform
        })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Erreur d'envoi");
      
      toast.success("Réponse envoyée");
      setReplyText('');
      setReplyingTo(null);
      fetchComments(); // Refresh to see the new reply
    } catch (error) {
      console.error("Reply error:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" /> 
          Commentaires Récents
          <Badge variant="secondary" className="ml-2">{comments.length}</Badge>
        </h2>
        <Button variant="outline" size="sm" onClick={fetchComments}>Actualiser</Button>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center p-12 bg-muted/20 border border-dashed rounded-2xl">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucun commentaire trouvé.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {comment.platform === 'facebook' ? (
                        <div className="bg-[hsl(var(--social-facebook))] p-1.5 rounded-md text-white">
                          <Facebook className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="bg-gradient-to-tr from-yellow-400 to-purple-500 p-1.5 rounded-md text-white">
                          <Instagram className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground line-clamp-1">
                          Sur: {comment.expand?.post_id?.title || comment.expand?.post_id?.content?.substring(0, 50) || 'Publication'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm">{comment.author_name}</span>
                          {comment.likes_count > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {comment.likes_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.comment_text}</p>
                        
                        <div className="pt-2">
                          {replyingTo === comment.id ? (
                            <div className="space-y-2 mt-2">
                              <Textarea 
                                placeholder="Votre réponse..." 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[80px] text-sm"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Annuler</Button>
                                <Button size="sm" onClick={() => handleReplySubmit(comment)} disabled={isSubmitting}>
                                  <Send className="w-4 h-4 mr-2" /> Envoyer
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={() => setReplyingTo(comment.id)}>
                              Répondre
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SocialCommentsTab;