import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { format } from 'date-fns';
import { CalendarDays, Clock, Users, Tags, Trash2, Edit2 } from 'lucide-react';
import EventForm from './EventForm.jsx';

const EventDetailModal = ({ event, isOpen, onClose, onRefresh }) => {
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && event && !isEditing) {
      fetchEventDetails();
    } else if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen, event, isEditing]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const data = await pb.collection('events').getOne(event.id, {
        expand: 'members,groups,created_by',
        $autoCancel: false
      });
      setExpandedEvent(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load event details.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await pb.collection('events').delete(event.id, { $autoCancel: false });
      toast.success('Event deleted successfully.');
      setIsDeleteConfirmOpen(false);
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    onRefresh();
    fetchEventDetails();
  };

  return (
    <>
      <Sheet open={isOpen && !isDeleteConfirmOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
          {isEditing ? (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>Edit Event</SheetTitle>
                <SheetDescription>Update the details for this event.</SheetDescription>
              </SheetHeader>
              <EventForm 
                event={expandedEvent || event} 
                onSuccess={handleEditSuccess} 
                onCancel={() => setIsEditing(false)} 
              />
            </>
          ) : (
            <>
              {loading || !expandedEvent ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground animate-pulse">Loading details...</p>
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold">{expandedEvent.title}</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-4 text-sm">
                    {/* Time Info */}
                    <div className="bg-muted/40 rounded-lg p-4 space-y-3 border">
                      <div className="flex items-center gap-3 text-foreground">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        <span className="font-medium">
                          {format(new Date(expandedEvent.start_date), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-foreground">
                        <Clock className="w-5 h-5 text-primary" />
                        <span>
                          {format(new Date(expandedEvent.start_date), 'HH:mm')} - {format(new Date(expandedEvent.end_date), 'HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-foreground">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        <span className="font-medium">
                          {format(new Date(expandedEvent.end_date), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {expandedEvent.description && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          Description
                        </h4>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {expandedEvent.description}
                        </p>
                      </div>
                    )}

                    {/* Groups */}
                    {expandedEvent.expand?.groups && expandedEvent.expand.groups.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Tags className="w-4 h-4" /> Assigned Groups
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {expandedEvent.expand.groups.map(g => (
                            <Badge key={g.id} variant="secondary">{g.name}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Members */}
                    {expandedEvent.expand?.members && expandedEvent.expand.members.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4" /> Assigned Members
                        </h4>
                        <ScrollArea className="h-32 rounded-md border p-2 bg-muted/20">
                          <div className="space-y-1">
                            {expandedEvent.expand.members.map(m => (
                              <div key={m.id} className="text-sm py-1 px-2 hover:bg-muted rounded-md transition-colors">
                                {m.name}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                    
                    {/* Meta Info */}
                    <div className="pt-4 border-t border-border mt-6 flex flex-col gap-1 text-xs text-muted-foreground">
                      <p>Created by: {expandedEvent.expand?.created_by?.name || expandedEvent.expand?.created_by?.email || 'Unknown'}</p>
                      <p>Created at: {format(new Date(expandedEvent.created), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                  </div>

                  <SheetFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setIsDeleteConfirmOpen(true)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </SheetFooter>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{expandedEvent?.title}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDetailModal;