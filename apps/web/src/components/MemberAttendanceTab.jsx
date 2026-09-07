import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarX2 } from 'lucide-react';

const MemberAttendanceTab = ({ memberId }) => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchAttendances = async () => {
      setLoading(true);
      try {
        let filterStr = `member_id="${memberId}"`;
        if (statusFilter !== 'all') {
          filterStr += ` && attendance_status="${statusFilter}"`;
        }
        
        const records = await pb.collection('attendances').getFullList({
          filter: filterStr,
          expand: 'event_id',
          sort: '-created',
          $autoCancel: false
        });
        setAttendances(records);
      } catch (error) {
        console.error('Error fetching attendances:', error);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchAttendances();
    }
  }, [memberId, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-transparent shadow-none">Présent</Badge>;
      case 'absent':
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none">Absent</Badge>;
      case 'excused':
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-transparent shadow-none">Excusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold tracking-tight">Historique des présences</h3>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="present">Présent</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="excused">Excusé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Événement</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : attendances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <CalendarX2 className="w-8 h-8 opacity-20" />
                    <p>Aucune présence enregistrée</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              attendances.map((attendance) => {
                const event = attendance.expand?.event_id;
                return (
                  <TableRow key={attendance.id}>
                    <TableCell className="font-medium">
                      {event?.date_debut ? format(new Date(event.date_debut), 'dd MMM yyyy', { locale: fr }) : '-'}
                    </TableCell>
                    <TableCell>{event?.titre || 'Événement inconnu'}</TableCell>
                    <TableCell>
                      {event?.categorie && (
                        <Badge variant="secondary" className="font-normal">{event.categorie}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{event?.lieu || '-'}</TableCell>
                    <TableCell>{getStatusBadge(attendance.attendance_status)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MemberAttendanceTab;