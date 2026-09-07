import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Users, Plus, Trash2, Mail, Phone, UserCheck, CalendarDays, List, PlusCircle } from 'lucide-react';
import GroupEventForm from '@/components/GroupEventForm.jsx';
import GroupEventList from '@/components/GroupEventList.jsx';
import GroupEventCalendar from '@/components/GroupEventCalendar.jsx';
import { getGroupTypeColor, getGroupTypeLabel, getGroupTypeEmoji } from '@/lib/groupUtils.js';

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [groupEvents, setGroupEvents] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  const [editLeaderOpen, setEditLeaderOpen] = useState(false);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');

  const [eventView, setEventView] = useState('list');
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const fetchData = async () => {
    try {
      const groupData = await pb.collection('groups').getOne(id, { 
        expand: 'responsible',
        $autoCancel: false 
      });
      setGroup(groupData);

      const memberships = await pb.collection('group_members').getFullList({
        filter: `group_id="${id}"`,
        expand: 'member_id',
        $autoCancel: false
      });
      setGroupMembers(memberships.map(gm => gm.expand?.member_id).filter(Boolean));

      const allMembersData = await pb.collection('members').getFullList({
        sort: 'name',
        $autoCancel: false
      });
      setAllMembers(allMembersData);
      
      fetchEvents();
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventsData = await pb.collection('group_events').getFullList({
        filter: `group_id="${id}"`,
        sort: 'date,start_time',
        $autoCancel: false
      });
      setGroupEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error('Veuillez sélectionner un membre');
      return;
    }
    try {
      await pb.collection('group_members').create({
        group_id: id,
        member_id: selectedMemberId
      }, { $autoCancel: false });
      
      toast.success('Membre ajouté au groupe');
      setDialogOpen(false);
      setSelectedMemberId('');
      fetchData();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Erreur lors de l\'ajout du membre');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Retirer ce membre du groupe ?')) return;
    try {
      const membership = await pb.collection('group_members').getFirstListItem(
        `group_id="${id}" && member_id="${memberId}"`,
        { $autoCancel: false }
      );
      await pb.collection('group_members').delete(membership.id, { $autoCancel: false });
      toast.success('Membre retiré du groupe');
      fetchData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erreur lors du retrait du membre');
    }
  };

  const handleUpdateLeader = async () => {
    try {
      await pb.collection('groups').update(id, {
        responsible: selectedLeaderId || null
      }, { $autoCancel: false });
      toast.success('Responsable mis à jour');
      setEditLeaderOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating leader:', error);
      toast.error('Erreur de mise à jour');
    }
  };

  const openEditLeader = () => {
    setSelectedLeaderId(group?.responsible || '');
    setEditLeaderOpen(true);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventDialogOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventDialogOpen(true);
  };

  const availableMembers = allMembers.filter(
    member => !groupMembers.some(gm => gm.id === member.id)
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Groupe introuvable</p>
        <Link to="/groups"><Button variant="outline">Retour aux groupes</Button></Link>
      </div>
    );
  }

  const typeColor = getGroupTypeColor(group.type);
  const typeLabel = getGroupTypeLabel(group.type);
  const typeEmoji = getGroupTypeEmoji(group.type);

  return (
    <>
      <Helmet>
        <title>{`${group.name} - Church CRM`}</title>
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/groups')} className="rounded-full bg-muted/50 hover:bg-muted shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight text-balance">{group.name}</h1>
              </div>
              <p className="text-muted-foreground">Gestion du groupe et activités</p>
            </div>
            <span 
              className="group-type-badge shrink-0 px-3 py-1.5 text-sm"
              style={{ backgroundColor: `${typeColor}15`, borderColor: `${typeColor}30`, color: typeColor }}
            >
              <span className="text-lg mr-1">{typeEmoji}</span>
              {typeLabel}
            </span>
          </div>
        </div>

        <Tabs defaultValue="infos" className="w-full">
          <TabsList className="grid w-full sm:w-[450px] grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="infos" className="rounded-lg">Infos</TabsTrigger>
            <TabsTrigger value="membres" className="rounded-lg">Membres ({groupMembers.length})</TabsTrigger>
            <TabsTrigger value="agenda" className="rounded-lg">Agenda</TabsTrigger>
          </TabsList>
          
          <TabsContent value="infos" className="mt-0">
            <Card 
              className="rounded-2xl shadow-sm border-t-[6px]"
              style={{ borderTopColor: typeColor }}
            >
              <CardHeader>
                <CardTitle>Informations du groupe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {group.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 tracking-wider">Description</p>
                    <p className="text-base leading-relaxed">{group.description}</p>
                  </div>
                )}
                
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground tracking-wider flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Responsable
                    </p>
                    <Button variant="outline" size="sm" onClick={openEditLeader} className="h-8 rounded-lg">
                      <Pencil className="w-3 h-3 mr-2" /> Changer
                    </Button>
                  </div>
                  
                  {group.expand?.responsible ? (
                    <div className="p-5 bg-muted/30 rounded-xl border border-border/50 max-w-md">
                      <Link to={`/members/${group.expand.responsible.id}`} className="font-semibold text-lg hover:text-primary transition-colors">
                        {group.expand.responsible.name}
                      </Link>
                      <div className="flex flex-col gap-2 mt-3 text-sm text-muted-foreground">
                        {group.expand.responsible.email && (
                          <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {group.expand.responsible.email}</span>
                        )}
                        {group.expand.responsible.phone && (
                          <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {group.expand.responsible.phone}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-muted/20 rounded-xl border border-dashed text-center">
                      <p className="text-sm text-muted-foreground italic">Aucun responsable assigné</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="membres" className="mt-0">
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Membres du groupe</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 rounded-xl" style={{ backgroundColor: typeColor, color: '#fff' }}>
                      <Plus className="w-4 h-4" />
                      Ajouter un membre
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Ajouter un membre au groupe</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddMember} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="member">Sélectionner un membre</Label>
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                          <SelectTrigger id="member">
                            <SelectValue placeholder="Choisir un membre" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMembers.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">Tous les membres sont déjà dans ce groupe</div>
                            ) : (
                              availableMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Annuler</Button>
                        <Button type="submit" disabled={availableMembers.length === 0} className="rounded-xl" style={{ backgroundColor: typeColor, color: '#fff' }}>Ajouter</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {groupMembers.length === 0 ? (
                  <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Aucun membre dans ce groupe</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-primary/30 hover:shadow-sm transition-all bg-card">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                            style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                          >
                            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <Link to={`/members/${member.id}`} className="font-semibold hover:text-primary transition-colors">
                              {member.name}
                            </Link>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {member.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agenda" className="mt-0 space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl border shadow-sm">
              <div className="flex bg-muted/50 p-1 rounded-xl">
                <Button 
                  variant={eventView === 'list' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setEventView('list')}
                  className="rounded-lg gap-2"
                >
                  <List className="w-4 h-4" /> Liste
                </Button>
                <Button 
                  variant={eventView === 'calendar' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setEventView('calendar')}
                  className="rounded-lg gap-2"
                >
                  <CalendarDays className="w-4 h-4" /> Calendrier
                </Button>
              </div>
              
              <Button onClick={handleAddEvent} className="gap-2 rounded-xl" style={{ backgroundColor: typeColor, color: '#fff' }}>
                <PlusCircle className="w-4 h-4" /> Nouvel événement
              </Button>
            </div>

            {eventView === 'list' ? (
              <GroupEventList 
                events={groupEvents} 
                onEdit={handleEditEvent} 
                onRefresh={fetchEvents} 
              />
            ) : (
              <GroupEventCalendar 
                events={groupEvents} 
              />
            )}
            
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogContent className="rounded-2xl sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingEvent ? 'Modifier l\'événement' : 'Planifier un événement'}</DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                  <GroupEventForm 
                    groupId={id} 
                    event={editingEvent} 
                    onSuccess={() => { setEventDialogOpen(false); fetchEvents(); }} 
                    onCancel={() => setEventDialogOpen(false)} 
                  />
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editLeaderOpen} onOpenChange={setEditLeaderOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Changer le responsable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sélectionner un leader</Label>
              <Select value={selectedLeaderId || undefined} onValueChange={setSelectedLeaderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un membre" />
                </SelectTrigger>
                <SelectContent>
                  {allMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditLeaderOpen(false)} className="rounded-xl">Annuler</Button>
              <Button onClick={handleUpdateLeader} className="rounded-xl" style={{ backgroundColor: typeColor, color: '#fff' }}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GroupDetailPage;