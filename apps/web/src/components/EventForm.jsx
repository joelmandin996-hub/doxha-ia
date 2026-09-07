import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { format } from 'date-fns';

const EventForm = ({ event = null, initialDate = new Date(), onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const defaultStart = format(initialDate, "yyyy-MM-dd'T'10:00");
  const defaultEnd = format(initialDate, "yyyy-MM-dd'T'11:00");

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_date: event?.start_date ? format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm") : defaultStart,
    end_date: event?.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : defaultEnd,
    members: event?.members || [],
    groups: event?.groups || []
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [mRes, gRes] = await Promise.all([
          pb.collection('members').getFullList({ sort: 'name', $autoCancel: false }),
          pb.collection('groups').getFullList({ sort: 'name', $autoCancel: false })
        ]);
        setMembers(mRes);
        setGroups(gRes);
      } catch (err) {
        console.error("Failed to fetch form options", err);
        toast.error("Could not load members and groups.");
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (type, id, checked) => {
    setFormData(prev => {
      const list = prev[type];
      if (checked) {
        return { ...prev, [type]: [...list, id] };
      }
      return { ...prev, [type]: list.filter(item => item !== id) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      return toast.error("Title is required.");
    }
    
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    
    if (end <= start) {
      return toast.error("End date must be after the start date.");
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        created_by: pb.authStore.model.id
      };

      if (event?.id) {
        await pb.collection('events').update(event.id, payload, { $autoCancel: false });
        toast.success("Event updated successfully!");
      } else {
        await pb.collection('events').create(payload, { $autoCancel: false });
        toast.success("Event created successfully!");
      }
      
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An error occurred while saving the event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title <span className="text-destructive">*</span></Label>
          <Input 
            id="title" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            placeholder="e.g. Sunday Service" 
            className="text-foreground"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Time <span className="text-destructive">*</span></Label>
            <Input 
              id="start_date" 
              name="start_date" 
              type="datetime-local" 
              value={formData.start_date} 
              onChange={handleChange}
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Time <span className="text-destructive">*</span></Label>
            <Input 
              id="end_date" 
              name="end_date" 
              type="datetime-local" 
              value={formData.end_date} 
              onChange={handleChange}
              className="text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Event details..." 
            className="resize-none h-20 text-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <Label>Assign Members</Label>
            <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No members found</p>
              ) : (
                <div className="space-y-3">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`member-${m.id}`} 
                        checked={formData.members.includes(m.id)}
                        onCheckedChange={(c) => handleCheckboxChange('members', m.id, c)}
                      />
                      <Label htmlFor={`member-${m.id}`} className="font-normal cursor-pointer">{m.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="space-y-3">
            <Label>Assign Groups</Label>
            <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No groups found</p>
              ) : (
                <div className="space-y-3">
                  {groups.map(g => (
                    <div key={g.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`group-${g.id}`} 
                        checked={formData.groups.includes(g.id)}
                        onCheckedChange={(c) => handleCheckboxChange('groups', g.id, c)}
                      />
                      <Label htmlFor={`group-${g.id}`} className="font-normal cursor-pointer">{g.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;