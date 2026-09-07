import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Check, Facebook, Instagram, Inbox } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const SocialMessagesTab = () => {
  const [messages, setMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const records = await pb.collection('social_messages').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setMessages(records);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Group by conversation_id
  const conversationsMap = messages.reduce((acc, msg) => {
    if (!acc[msg.conversation_id]) {
      acc[msg.conversation_id] = {
        id: msg.conversation_id,
        contact_name: msg.contact_name,
        contact_photo: msg.contact_photo_url,
        platform: msg.platform,
        messages: [],
        latest: msg,
        unread: !msg.is_read
      };
    }
    acc[msg.conversation_id].messages.push(msg);
    if (new Date(msg.created) > new Date(acc[msg.conversation_id].latest.created)) {
      acc[msg.conversation_id].latest = msg;
    }
    return acc;
  }, {});

  const conversations = Object.values(conversationsMap).sort((a, b) => 
    new Date(b.latest.created) - new Date(a.latest.created)
  );

  const handleSendMessage = async () => {
    if (!replyText.trim() || !activeConversation) return;
    setIsSending(true);

    try {
      const response = await apiServerClient.fetch('/social/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: activeConversation.latest.external_message_id,
          reply_text: replyText,
          platform: activeConversation.platform,
          conversation_id: activeConversation.id
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Erreur d'envoi");

      toast.success("Message envoyé");
      setReplyText('');
      fetchMessages(); // Refresh chat
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (msgId) => {
    try {
      await pb.collection('social_messages').update(msgId, { is_read: true }, { $autoCancel: false });
      fetchMessages();
    } catch(e) {}
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        <div className="col-span-1 border rounded-2xl p-4 space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
        <div className="col-span-2 border rounded-2xl p-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const activeThread = activeConversation ? conversationsMap[activeConversation.id]?.messages.sort((a,b) => new Date(a.created) - new Date(b.created)) : [];

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card rounded-2xl h-[700px] flex flex-col md:flex-row">
      {/* Sidebar - Conversation List */}
      <div className="w-full md:w-80 border-r flex flex-col h-full bg-muted/10">
        <div className="p-4 border-b bg-card">
          <h2 className="font-semibold flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            Boîte de réception
            <Badge variant="secondary" className="ml-auto">{conversations.filter(c => c.unread).length}</Badge>
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground p-4">Aucun message</p>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv);
                    if(conv.unread) markAsRead(conv.latest.id);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${activeConversation?.id === conv.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 border">
                      <AvatarImage src={conv.contact_photo} />
                      <AvatarFallback>{conv.contact_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${conv.platform === 'facebook' ? 'bg-[hsl(var(--social-facebook))]' : 'bg-gradient-to-tr from-yellow-400 to-purple-500'}`}>
                      {conv.platform === 'facebook' ? <Facebook className="w-2.5 h-2.5 text-white" /> : <Instagram className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className={`text-sm truncate ${conv.unread ? 'font-bold' : 'font-medium'}`}>{conv.contact_name}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(conv.latest.created), { locale: fr, addSuffix: false })}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {conv.latest.message_text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Area - Thread View */}
      <div className="flex-1 flex flex-col h-full bg-card">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3 shadow-sm z-10">
              <Avatar className="w-10 h-10 border">
                <AvatarImage src={activeConversation.contact_photo} />
                <AvatarFallback>{activeConversation.contact_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{activeConversation.contact_name}</h3>
                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  Via {activeConversation.platform}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {activeThread.map(msg => {
                  // Simplification: In a real app we'd distinguish "sent by us" vs "received" based on author_id
                  // Here we'll assume messages where contact_name matches the conversation contact are received.
                  const isReceived = true; // Placeholder logic
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[75%] ${isReceived ? 'items-start self-start' : 'items-end self-end ml-auto'}`}>
                      <div className={`p-3 rounded-2xl text-sm ${isReceived ? 'bg-muted text-foreground rounded-tl-sm' : 'bg-primary text-primary-foreground rounded-tr-sm'}`}>
                        {msg.message_text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {format(new Date(msg.created), 'HH:mm')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-muted/10">
              <div className="flex gap-2">
                <Textarea 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Écrivez votre message..." 
                  className="min-h-[60px] max-h-[120px] resize-none bg-background"
                  onKeyDown={e => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button className="h-auto shrink-0 px-4" onClick={handleSendMessage} disabled={isSending || !replyText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Appuyez sur Entrée pour envoyer. Shift + Entrée pour un saut de ligne.
              </p>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">Vos Messages</h3>
            <p className="text-center text-sm">Sélectionnez une conversation dans le menu de gauche pour commencer à discuter.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SocialMessagesTab;