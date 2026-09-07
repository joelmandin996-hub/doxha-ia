import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar as CalendarIcon, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getGroupTypeColor, getGroupTypeLabel, getGroupTypeEmoji } from '@/lib/groupUtils.js';

const MemberGroupsTab = ({ memberId }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const records = await pb.collection('group_members').getFullList({
          filter: `member_id="${memberId}"`,
          expand: 'group_id,group_id.responsible',
          sort: '-created',
          $autoCancel: false
        });
        setGroups(records);
      } catch (error) {
        console.error('Error fetching member groups:', error);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchGroups();
    }
  }, [memberId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Groupes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Groupes</h3>
        <Card className="border-dashed bg-muted/30 shadow-none">
          <CardContent className="h-32 flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <Users className="w-8 h-8 opacity-20" />
            <p>Ce membre n'appartient à aucun groupe</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight">Groupes ({groups.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((gm) => {
          const group = gm.expand?.group_id;
          if (!group) return null;

          const responsibleName = group.expand?.responsible?.name || 'Non assigné';
          const typeColor = getGroupTypeColor(group.type);
          const typeLabel = getGroupTypeLabel(group.type);
          const typeEmoji = getGroupTypeEmoji(group.type);

          return (
            <Card 
              key={gm.id} 
              className="group-type-border-left rounded-xl shadow-sm hover:shadow-md transition-all"
              style={{ borderLeftColor: typeColor }}
            >
              <CardHeader className="p-4 pb-3 border-b bg-muted/10">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base line-clamp-1">{group.name}</CardTitle>
                  </div>
                  <span 
                    className="group-type-badge self-start"
                    style={{ backgroundColor: `${typeColor}15`, borderColor: `${typeColor}30`, color: typeColor }}
                  >
                    <span className="text-sm">{typeEmoji}</span>
                    <span>{typeLabel}</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCheck className="w-4 h-4 shrink-0 opacity-60" />
                  <span className="truncate">Responsable: <span className="font-medium text-foreground">{responsibleName}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4 shrink-0 opacity-60" />
                  <span>Rejoint le {format(new Date(gm.created), 'dd MMM yyyy', { locale: fr })}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MemberGroupsTab;