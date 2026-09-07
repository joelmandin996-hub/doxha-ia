import React, { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Phone, Mail, RefreshCw, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MessageHistory = ({ members = [], groups = [] }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;

  // Filters
  const [channelFilter, setChannelFilter] = useState('all');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMessages = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      let filterParts = [];
      
      if (channelFilter !== 'all') {
        filterParts.push(`channel="${channelFilter}"`);
      }
      
      if (recipientFilter !== 'all') {
        filterParts.push(`recipient_id="${recipientFilter}"`);
      }

      if (startDate) {
        filterParts.push(`created >= "${startDate} 00:00:00"`);
      }

      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        filterParts.push(`created < "${nextDayStr} 00:00:00"`);
      }

      const filterQuery = filterParts.join(' && ');

      const result = await pb.collection('messages').getList(page, perPage, {
        sort: '-created',
        filter: filterQuery,
        $autoCancel: false,
      });

      setMessages(result.items);
      setTotalPages(result.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load message history');
    } finally {
      setLoading(false);
    }
  }, [channelFilter, recipientFilter, startDate, endDate]);

  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  const getRecipientName = (id, type) => {
    if (type === 'member') {
      return members.find(m => m.id === id)?.name || 'Unknown Member';
    }
    if (type === 'group') {
      return groups.find(g => g.id === id)?.name || 'Unknown Group';
    }
    return 'Unknown';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const allRecipients = [
    ...members.map(m => ({ id: m.id, name: `${m.name} (Member)` })),
    ...groups.map(g => ({ id: g.id, name: `${g.name} (Group)` }))
  ];

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl">Message History</CardTitle>
          <Button variant="outline" size="sm" onClick={() => fetchMessages(1)} className="gap-2 shrink-0 self-start md:self-auto">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Channel</label>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient</label>
            <Select value={recipientFilter} onValueChange={setRecipientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recipients</SelectItem>
                {allRecipients.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From Date</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To Date</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="text-foreground"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-auto">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No messages found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              We couldn't find any messages matching your current filters. Try adjusting them or send a new message.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Recipient</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="w-1/3">Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{getRecipientName(msg.recipient_id, msg.recipient_type)}</span>
                      <span className="text-xs text-muted-foreground capitalize">{msg.recipient_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {msg.channel === 'sms' ? (
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                      ) : msg.channel === 'whatsapp' ? (
                        <Phone className="w-4 h-4 text-green-500" />
                      ) : (
                        <Mail className="w-4 h-4 text-purple-500" />
                      )}
                      <span className="text-sm capitalize">{msg.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {(msg.channel === 'email' || msg.channel === 'whatsapp') && msg.subject && (
                        <span className="text-xs font-semibold text-foreground mb-1 truncate max-w-xs lg:max-w-md" title={msg.subject}>
                          Objet: {msg.subject}
                        </span>
                      )}
                      <p className="text-sm truncate max-w-xs lg:max-w-md text-muted-foreground" title={msg.message_text}>
                        {msg.message_text}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(msg.status)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                    {msg.sent_at ? format(new Date(msg.sent_at), 'MMM d, h:mm a') : format(new Date(msg.created), 'MMM d, h:mm a')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {!loading && totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between mt-auto bg-muted/20">
          <p className="text-sm text-muted-foreground font-medium">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMessages(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMessages(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MessageHistory;