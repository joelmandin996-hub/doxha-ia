import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FolderKanban, Users, UserCheck } from 'lucide-react';
import { PRIMARY_GROUP_TYPES, getGroupTypeColor, getGroupTypeLabel, getGroupTypeEmoji } from '@/lib/groupUtils.js';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [groupMemberCounts, setGroupMemberCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  // Filter state
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    responsible: '',
    auto_sync: false
  });
  
  const navigate = useNavigate();

  const fetchMembers = async () => {
    try {
      const result = await pb.collection('members').getFullList({
        sort: 'name',
        $autoCancel: false
      });
      setMembers(result);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchGroups = async () => {
    setLoading(true);
    console.log('[GroupsPage] Fetching groups...');
    try {
      const result = await pb.collection('groups').getFullList({
        sort: '-created',
        expand: 'responsible',
        $autoCancel: false
      });
      setGroups(result);
      console.log(`[GroupsPage] Loaded ${result.length} groups.`);

      const counts = {};
      for (const group of result) {
        const memberCount = await pb.collection('group_members').getList(1, 1, {
          filter: `group_id="${group.id}"`,
          $autoCancel: false
        });
        counts[group.id] = memberCount.totalItems;
      }
      setGroupMemberCounts(counts);
    } catch (error) {
      console.error('[GroupsPage] Error fetching groups:', error);
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchGroups();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('--- GROUPS FORM DIAGNOSTIC ---');
    console.log('[GroupsPage] Form submitted with data:', formData);
    
    if (!formData.name) {
      toast.error('Le nom du groupe est requis');
      return;
    }

    try {
      const dataToSave = { ...formData };
      if (!dataToSave.responsible) dataToSave.responsible = null;
      if (!dataToSave.type) dataToSave.type = '';

      const isUpdate = !!editingGroup;
      let savedGroup;
      
      if (isUpdate) {
        console.log(`[GroupsPage] Updating group ${editingGroup.id}`);
        savedGroup = await pb.collection('groups').update(editingGroup.id, dataToSave, { $autoCancel: false });
        toast.success('Groupe mis à jour avec succès');
      } else {
        console.log('[GroupsPage] Creating new group');
        savedGroup = await pb.collection('groups').create(dataToSave, { $autoCancel: false });
        toast.success('Groupe créé avec succès');
      }

      console.log(`[GroupsPage] Group save successful. ID: ${savedGroup.id}, auto_sync: ${formData.auto_sync}`);

      if (formData.auto_sync) {
        toast.loading('Synchronisation en cours...', { id: 'sync-toast' });
        console.log(`[GroupsPage] Triggering sync API for group ${savedGroup.id}`);
        
        try {
          const syncPayload = {
            groupId: savedGroup.id,
            action: isUpdate ? 'update' : 'create',
            userId: pb.authStore.model?.id || ''
          };
          console.log('[GroupsPage] Sync payload:', syncPayload);
          
          const response = await apiServerClient.fetch('/groups/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload)
          });
          
          const syncResult = await response.json();
          console.log('[GroupsPage] Sync API response:', syncResult);
          
          if (!response.ok) {
            throw new Error(syncResult.error || 'API response not ok');
          }
          
          toast.success('Synchronisation Agenda et Événements réussie', { id: 'sync-toast' });
        } catch (syncErr) {
          console.error('[GroupsPage] Sync API error:', syncErr);
          toast.error('Erreur lors de la synchronisation automatique', { id: 'sync-toast' });
        }
      }
      
      setDialogOpen(false);
      resetForm();
      fetchGroups();
    } catch (error) {
      console.error('[GroupsPage] Error saving group:', error);
      toast.error('Erreur lors de l\'enregistrement du groupe');
    }
  };

  const handleEdit = (group) => {
    console.log(`[GroupsPage] Editing group:`, group);
    setEditingGroup(group);
    setFormData({
      name: group.name || '',
      description: group.description || '',
      type: group.type || '',
      responsible: group.responsible || '',
      auto_sync: group.auto_sync || false
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce groupe ?')) return;
    console.log(`[GroupsPage] Deleting group ${id}`);

    try {
      try {
        console.log(`[GroupsPage] Triggering sync API delete for group ${id}`);
        await apiServerClient.fetch('/groups/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: id, action: 'delete' })
        });
      } catch(e) {
        console.warn('[GroupsPage] Sync delete failed', e);
      }
      
      await pb.collection('groups').delete(id, { $autoCancel: false });
      toast.success('Groupe supprimé avec succès');
      fetchGroups();
    } catch (error) {
      console.error('[GroupsPage] Error deleting group:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      responsible: '',
      auto_sync: false
    });
    setEditingGroup(null);
  };

  const handleDialogChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const filteredGroups = useMemo(() => {
    if (filterType === 'all') return groups;
    return groups.filter(g => getGroupTypeLabel(g.type) === getGroupTypeLabel(filterType));
  }, [groups, filterType]);

  return (
    <>
      <Helmet>
        <title>Groupes & Ministères - Church CRM</title>
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl font-premium tracking-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 tracking-premium-tight text-balance text-gradient">Groupes & Ministères</h1>
            <p className="text-muted-foreground">Organisez vos membres en cellules et départements</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-sm font-medium">
                <Plus className="w-5 h-5" />
                Créer un groupe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-2xl font-premium tracking-premium">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{editingGroup ? 'Modifier le groupe' : 'Nouveau groupe'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">Nom du groupe <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ex: Chorale, Cellule Nord..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="font-medium">Type de groupe</Label>
                    <Select 
                      value={formData.type || undefined} 
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIMARY_GROUP_TYPES.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.emoji} {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Objectif et activités du groupe..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="responsible" className="font-medium">Responsable</Label>
                  <Select 
                    value={formData.responsible || undefined} 
                    onValueChange={(value) => setFormData({ ...formData, responsible: value })}
                  >
                    <SelectTrigger id="responsible">
                      <SelectValue placeholder="Désigner un leader..." />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t mt-4">
                  <Checkbox
                    id="auto_sync"
                    checked={formData.auto_sync}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_sync: checked })}
                  />
                  <Label htmlFor="auto_sync" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Synchroniser automatiquement avec Agenda et Événements
                  </Label>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} className="rounded-xl font-medium">
                    Annuler
                  </Button>
                  <Button type="submit" className="rounded-xl font-medium">
                    {editingGroup ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Group Type Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            className={`rounded-full shrink-0 transition-transform hover:-translate-y-0.5 font-medium ${filterType === 'all' ? 'shadow-md' : ''}`}
          >
            Tous les groupes
          </Button>
          {PRIMARY_GROUP_TYPES.map(type => (
            <Button
              key={type.id}
              variant="outline"
              onClick={() => setFilterType(type.id)}
              className="rounded-full shrink-0 gap-2 transition-transform hover:-translate-y-0.5 border-transparent shadow-sm font-medium"
              style={filterType === type.id 
                ? { backgroundColor: type.color, color: '#fff', borderColor: type.color }
                : { backgroundColor: `${type.color}15`, color: type.color, borderColor: `${type.color}30` }
              }
            >
              <span className="text-base">{type.emoji}</span>
              {type.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-2xl shadow-sm">
            <FolderKanban className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Aucun groupe trouvé</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {filterType === 'all' 
                ? "Créez des groupes pour organiser vos membres, gérer des événements spécifiques et déléguer des responsabilités."
                : "Aucun groupe de ce type n'a été créé pour le moment."}
            </p>
            {filterType === 'all' ? (
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2 rounded-xl font-medium">
                <Plus className="w-4 h-4" />
                Créer le premier groupe
              </Button>
            ) : (
              <Button onClick={() => setFilterType('all')} variant="outline" className="gap-2 rounded-xl font-medium">
                Voir tous les groupes
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => {
              const typeColor = getGroupTypeColor(group.type);
              const typeLabel = getGroupTypeLabel(group.type);
              const typeEmoji = getGroupTypeEmoji(group.type);

              return (
                <Card 
                  key={group.id} 
                  className="group-type-border-left cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-2xl overflow-hidden flex flex-col h-full bg-card border-border/50"
                  style={{ borderLeftColor: typeColor, borderLeftWidth: '4px' }}
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-2">
                        <CardTitle className="text-xl font-bold tracking-premium-tight line-clamp-1" title={group.name}>{group.name}</CardTitle>
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold self-start flex items-center gap-1.5"
                          style={{ backgroundColor: `${typeColor}15`, borderColor: `${typeColor}30`, color: typeColor, borderWidth: '1px' }}
                        >
                          <span className="text-sm">{typeEmoji}</span>
                          <span>{typeLabel}</span>
                        </span>
                      </div>
                      <div className="flex gap-0.5 -mt-1 -mr-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(group)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-5 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    
                    <div className="mt-auto space-y-3 pt-4">
                      {group.expand?.responsible ? (
                        <div className="flex items-center gap-2 text-sm bg-muted/30 p-2.5 rounded-lg border border-border/50">
                          <UserCheck className="w-4 h-4 text-primary shrink-0 opacity-80" />
                          <span className="text-muted-foreground truncate">Resp: <span className="font-semibold text-foreground">{group.expand.responsible.name}</span></span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2.5 rounded-lg border border-dashed text-muted-foreground italic">
                          <UserCheck className="w-4 h-4 opacity-50 shrink-0" />
                          <span>Aucun responsable</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm px-2">
                        <span className="text-muted-foreground font-medium flex items-center gap-2">
                          <Users className="w-4 h-4 opacity-70" /> Membres inscrits
                        </span>
                        <span className="font-bold px-2.5 py-0.5 rounded-md tabular-nums-custom" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                          {groupMemberCounts[group.id] || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default GroupsPage;