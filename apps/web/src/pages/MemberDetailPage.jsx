import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Pencil, FileText, History } from 'lucide-react';
import { format } from 'date-fns';
import MemberAvatar from '@/components/MemberAvatar.jsx';
import FamilyRelationshipManager from '@/components/FamilyRelationshipManager.jsx';
import MemberForm from '@/components/MemberForm.jsx';
import MemberHistoryStats from '@/components/MemberHistoryStats.jsx';
import MemberAttendanceTab from '@/components/MemberAttendanceTab.jsx';
import MemberDonationsTab from '@/components/MemberDonationsTab.jsx';
import MemberGroupsTab from '@/components/MemberGroupsTab.jsx';

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchMember = async () => {
    try {
      const memberData = await pb.collection('members').getOne(id, { $autoCancel: false });
      setMember(memberData);
    } catch (error) {
      console.error('Error fetching member details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Member not found</p>
        <Button variant="outline" onClick={() => navigate('/members')}>Back to members</Button>
      </div>
    );
  }

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'actif') return 'bg-[hsl(var(--success))]/12 text-[hsl(var(--success))] border-[hsl(var(--success))]/25 shadow-[0_2px_8px_-4px_hsl(var(--success)/0.4)]';
    if (s === 'inactif') return 'bg-destructive/12 text-destructive border-destructive/25 shadow-[0_2px_8px_-4px_hsl(var(--destructive)/0.4)]';
    if (s === 'visiteur') return 'bg-[hsl(var(--sky))]/12 text-[hsl(var(--sky))] border-[hsl(var(--sky))]/25 shadow-[0_2px_8px_-4px_hsl(var(--sky)/0.4)]';
    if (s === 'nouveau') return 'bg-[hsl(var(--amber))]/14 text-[hsl(var(--amber))] border-[hsl(var(--amber))]/25 shadow-[0_2px_8px_-4px_hsl(var(--amber)/0.4)]';
    if (s === 'baptisé') return 'bg-primary/12 text-primary border-primary/25 shadow-[0_2px_8px_-4px_hsl(var(--primary)/0.4)]';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <>
      <Helmet>
        <title>{`${member.name} - ChurchFlow`}</title>
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/members')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-6">
            <MemberAvatar member={member} size="lg" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-premium-tight text-gradient">{member.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(member.status)}`}>
                  {member.status || 'Actif'}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-lg">Profil Membre</p>
            </div>
          </div>
          <Button onClick={() => setEditDialogOpen(true)} className="gap-2 shrink-0 rounded-xl">
            <Pencil className="w-4 h-4" /> Éditer le profil
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 w-full justify-start h-auto rounded-xl flex-wrap">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2">
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2 gap-2">
              <History className="w-4 h-4" /> Historique & Activité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info Column */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="rounded-2xl shadow-sm overflow-hidden border-border/50">
                  <CardHeader className="bg-muted/30 border-b pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Informations Personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-6 p-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Mail className="w-4 h-4" /> Email</p>
                      <p className="font-medium">{member.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="w-4 h-4" /> Téléphone</p>
                      <p className="font-medium">{member.phone || '-'}</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Adresse</p>
                      <p className="font-medium">{member.address || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-border/50">
                  <CardContent className="p-6">
                    <FamilyRelationshipManager member={member} onUpdate={fetchMember} />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info Column */}
              <div className="space-y-8">
                <Card className="rounded-2xl shadow-sm border-border/50">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Dates Clés
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Rejoint l'Église</span>
                      <span className="font-medium">
                        {member.church_join_date ? format(new Date(member.church_join_date), 'dd MMM yyyy') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Date de Baptême</span>
                      <span className="font-medium">
                        {member.baptism_date ? format(new Date(member.baptism_date), 'dd MMM yyyy') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Entrée système</span>
                      <span className="font-medium">
                        {member.join_date ? format(new Date(member.join_date), 'dd MMM yyyy') : '-'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {member.notes && (
                  <Card className="rounded-2xl shadow-sm bg-accent/50 border-none">
                    <CardContent className="p-5 space-y-2">
                      <h3 className="font-semibold text-accent-foreground text-sm">Notes</h3>
                      <p className="text-sm text-accent-foreground/80 leading-relaxed whitespace-pre-wrap">{member.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 outline-none space-y-8">
            <MemberHistoryStats memberId={member.id} />
            
            <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <Tabs defaultValue="attendances" className="w-full">
                  <div className="border-b bg-muted/20 px-6 pt-4">
                    <TabsList className="bg-transparent h-12 w-full justify-start gap-6 p-0">
                      <TabsTrigger 
                        value="attendances" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3"
                      >
                        Présences
                      </TabsTrigger>
                      <TabsTrigger 
                        value="donations" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3"
                      >
                        Dons
                      </TabsTrigger>
                      <TabsTrigger 
                        value="groups" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3"
                      >
                        Groupes
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="p-6">
                    <TabsContent value="attendances" className="m-0 outline-none">
                      <MemberAttendanceTab memberId={member.id} />
                    </TabsContent>
                    <TabsContent value="donations" className="m-0 outline-none">
                      <MemberDonationsTab memberId={member.id} />
                    </TabsContent>
                    <TabsContent value="groups" className="m-0 outline-none">
                      <MemberGroupsTab memberId={member.id} />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Éditer le profil</DialogTitle>
            </DialogHeader>
            <MemberForm 
              member={member} 
              onSuccess={() => { setEditDialogOpen(false); fetchMember(); }} 
              onCancel={() => setEditDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default MemberDetailPage;