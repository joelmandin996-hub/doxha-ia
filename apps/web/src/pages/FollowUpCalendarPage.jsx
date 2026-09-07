import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { LayoutDashboard } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import FollowUpDetailModal from '@/components/FollowUpDetailModal.jsx';
import { getPriorityColor, getTypeEmoji, getStatusLabel, getStatusEmoji } from '@/lib/followUpUtils.js';

const FollowUpCalendarPage = () => {
  const navigate = useNavigate();
  const [suivis, setSuivis] = useState([]);
  const [selectedSuiviId, setSelectedSuiviId] = useState(null);

  const fetchSuivis = async () => {
    try {
      const records = await pb.collection('suivis').getFullList({
        filter: 'date_prochain_rappel != ""',
        expand: 'responsable_assigne',
        sort: 'date_prochain_rappel',
        $autoCancel: false
      });
      setSuivis(records);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuivis();
  }, []);

  // Group by date
  const grouped = suivis.reduce((acc, suivi) => {
    const dateStr = suivi.date_prochain_rappel.split(' ')[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(suivi);
    return acc;
  }, {});

  const today = startOfDay(new Date());

  return (
    <>
      <Helmet><title>Calendrier des Suivis - ChurchFlow</title></Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Rappels de Suivis</h1>
          <Button variant="outline" onClick={() => navigate('/suivis')}><LayoutDashboard className="w-4 h-4 mr-2" /> Pipeline</Button>
        </div>

        <div className="space-y-8">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-muted-foreground">Aucun rappel programmé.</p>
          ) : (
            Object.keys(grouped).sort().map(dateStr => {
              const dateObj = new Date(dateStr);
              const isOverdue = isBefore(dateObj, today);
              
              return (
                <div key={dateStr} className="space-y-3">
                  <h2 className={`text-lg font-semibold border-b pb-2 ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                    {format(dateObj, 'EEEE d MMMM yyyy', { locale: fr })}
                    {isOverdue && <span className="ml-2 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">En retard</span>}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grouped[dateStr].map(suivi => (
                      <div 
                        key={suivi.id} 
                        onClick={() => setSelectedSuiviId(suivi.id)}
                        className="bg-card p-4 rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col h-full"
                        style={{ borderLeftWidth: '4px', borderLeftColor: getPriorityColor(suivi.priorite) }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{suivi.nom_personne}</h4>
                          <span className="text-xl">{getTypeEmoji(suivi.type_suivi)}</span>
                        </div>
                        <div className="mt-auto space-y-1">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            {getStatusEmoji(suivi.statut)} {getStatusLabel(suivi.statut)}
                          </p>
                          <p className="text-xs font-medium opacity-70">
                            Resp: {suivi.expand?.responsable_assigne?.name || 'Aucun'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <FollowUpDetailModal 
        suiviId={selectedSuiviId} 
        isOpen={!!selectedSuiviId} 
        onClose={() => setSelectedSuiviId(null)}
        onRefresh={fetchSuivis}
      />
    </>
  );
};

export default FollowUpCalendarPage;