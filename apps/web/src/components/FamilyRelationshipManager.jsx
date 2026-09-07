import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Users } from 'lucide-react';
import MemberAvatar from '@/components/MemberAvatar.jsx';

const RELATION_TYPES = ['Conjoint(e)', 'Parent', 'Enfant', 'Fratrie'];

const REVERSE_RELATION_MAP = {
  'Conjoint(e)': 'Conjoint(e)',
  'Parent': 'Enfant',
  'Enfant': 'Parent',
  'Fratrie': 'Fratrie'
};

const FamilyRelationshipManager = ({ member, onUpdate }) => {
  const [linkedMembers, setLinkedMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRelation, setSelectedRelation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRelationships();
  }, [member]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      
      // Parse relation types stored as JSON string in text field
      let linkTypes = {};
      try {
        linkTypes = JSON.parse(member.family_link_type || '{}');
      } catch (e) {
        linkTypes = {};
      }

      // Fetch linked members details
      const linked = [];
      if (member.family_links && member.family_links.length > 0) {
        const records = await Promise.all(
          member.family_links.map(id => pb.collection('members').getOne(id, { $autoCancel: false }).catch(() => null))
        );
        
        records.forEach(rec => {
          if (rec) {
            linked.push({
              ...rec,
              relation: linkTypes[rec.id] || 'Lien familial'
            });
          }
        });
      }
      setLinkedMembers(linked);

      // Fetch available members for linking (exclude self and already linked)
      const allMembers = await pb.collection('members').getFullList({
        sort: 'name',
        $autoCancel: false
      });
      
      const linkedIds = new Set(member.family_links || []);
      const available = allMembers.filter(m => m.id !== member.id && !linkedIds.has(m.id));
      setAvailableMembers(available);
      
    } catch (error) {
      console.error('Failed to load relationships', error);
      toast.error('Failed to load family relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelation = async () => {
    if (!selectedMember || !selectedRelation) return;
    setIsSubmitting(true);

    try {
      // 1. Update Current Member
      const currentLinks = [...(member.family_links || []), selectedMember];
      let currentTypes = {};
      try { currentTypes = JSON.parse(member.family_link_type || '{}'); } catch(e) {}
      currentTypes[selectedMember] = selectedRelation;

      await pb.collection('members').update(member.id, {
        family_links: currentLinks,
        family_link_type: JSON.stringify(currentTypes)
      }, { $autoCancel: false });

      // 2. Update Target Member (Bidirectional)
      const targetMember = await pb.collection('members').getOne(selectedMember, { $autoCancel: false });
      const targetLinks = [...(targetMember.family_links || []), member.id];
      let targetTypes = {};
      try { targetTypes = JSON.parse(targetMember.family_link_type || '{}'); } catch(e) {}
      targetTypes[member.id] = REVERSE_RELATION_MAP[selectedRelation] || 'Lien familial';

      await pb.collection('members').update(selectedMember, {
        family_links: targetLinks,
        family_link_type: JSON.stringify(targetTypes)
      }, { $autoCancel: false });

      toast.success('Relationship added successfully');
      setIsDialogOpen(false);
      setSelectedMember('');
      setSelectedRelation('');
      if (onUpdate) onUpdate();
      fetchRelationships();
      
    } catch (error) {
      console.error('Error adding relationship', error);
      toast.error('Failed to add relationship');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRelation = async (targetId) => {
    if (!window.confirm("Remove this family link?")) return;
    
    try {
      // 1. Update Current Member
      const currentLinks = (member.family_links || []).filter(id => id !== targetId);
      let currentTypes = {};
      try { currentTypes = JSON.parse(member.family_link_type || '{}'); } catch(e) {}
      delete currentTypes[targetId];

      await pb.collection('members').update(member.id, {
        family_links: currentLinks,
        family_link_type: JSON.stringify(currentTypes)
      }, { $autoCancel: false });

      // 2. Update Target Member
      const targetMember = await pb.collection('members').getOne(targetId, { $autoCancel: false });
      const targetLinks = (targetMember.family_links || []).filter(id => id !== member.id);
      let targetTypes = {};
      try { targetTypes = JSON.parse(targetMember.family_link_type || '{}'); } catch(e) {}
      delete targetTypes[member.id];

      await pb.collection('members').update(targetId, {
        family_links: targetLinks,
        family_link_type: JSON.stringify(targetTypes)
      }, { $autoCancel: false });

      toast.success('Relationship removed');
      if (onUpdate) onUpdate();
      fetchRelationships();

    } catch (error) {
      console.error('Error removing relationship', error);
      toast.error('Failed to remove relationship');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          Family Members
        </h3>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add Relation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Family Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Member</label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search members..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Relationship Type</label>
                <Select value={selectedRelation} onValueChange={setSelectedRelation}>
                  <SelectTrigger>
                    <SelectValue placeholder="E.g., Conjoint(e)" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_TYPES.map(rt => (
                      <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleAddRelation} disabled={!selectedMember || !selectedRelation || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Add Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-muted rounded-lg"></div>
          <div className="h-12 bg-muted rounded-lg"></div>
        </div>
      ) : linkedMembers.length === 0 ? (
        <div className="text-center py-6 bg-muted/30 rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">No family links recorded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {linkedMembers.map(link => (
            <div key={link.id} className="flex items-center justify-between p-3 border rounded-xl bg-card hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <MemberAvatar member={link} size="sm" />
                <div>
                  <p className="font-medium text-sm">{link.name}</p>
                  <p className="text-xs text-muted-foreground">{link.relation}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveRelation(link.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyRelationshipManager;