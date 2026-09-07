import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Clock } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import pb from '@/lib/pocketbaseClient.js';
import SocialPostDetailModal from './SocialPostDetailModal.jsx';

const SocialCalendarTab = ({ onNewPost, onEditPost }) => {
  const [date, setDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchPosts = async () => {
    try {
      const records = await pb.collection('social_posts').getFullList({
        sort: 'scheduled_date,scheduled_time',
        expand: 'accounts',
        $autoCancel: false
      });
      setPosts(records);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const selectedDatePosts = posts.filter(post => 
    post.scheduled_date && isSameDay(new Date(post.scheduled_date), date)
  );

  // Highlight days with posts
  const modifiers = {
    hasPost: posts.map(p => new Date(p.scheduled_date))
  };
  const modifiersStyles = {
    hasPost: { fontWeight: 'bold', textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))' }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              locale={fr}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="mx-auto"
            />
          </CardContent>
        </Card>
        <Button onClick={onNewPost} className="w-full gap-2">
          <Plus className="w-4 h-4" /> Nouvelle publication
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          Publications du {format(date, 'd MMMM yyyy', { locale: fr })}
          <Badge variant="secondary" className="ml-2">{selectedDatePosts.length}</Badge>
        </h3>

        {selectedDatePosts.length === 0 ? (
          <div className="bg-muted/20 border border-dashed rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Aucune publication prévue pour cette date.</p>
            <Button variant="outline" onClick={onNewPost}>Programmer une publication</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDatePosts.map(post => (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedPost(post)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-2 min-w-[60px]">
                    <Clock className="w-4 h-4 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{post.scheduled_time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={post.status === 'Publié' ? 'default' : post.status === 'Programmé' ? 'secondary' : 'outline'}>
                        {post.status}
                      </Badge>
                      <div className="flex gap-1">
                        {post.expand?.accounts?.map(acc => (
                          <span key={acc.id} className={`w-2 h-2 rounded-full ${acc.platform === 'facebook' ? 'bg-[hsl(var(--social-facebook))]' : 'bg-[hsl(var(--social-instagram))]'}`} title={acc.platform} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SocialPostDetailModal 
        post={selectedPost} 
        isOpen={!!selectedPost} 
        onClose={() => setSelectedPost(null)}
        onEdit={onEditPost}
        onRefresh={fetchPosts}
      />
    </div>
  );
};

export default SocialCalendarTab;