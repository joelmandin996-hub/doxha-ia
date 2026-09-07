import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { LayoutDashboard } from 'lucide-react';
import FollowUpDetailModal from '@/components/FollowUpDetailModal.jsx';
import { getPriorityColor, getTypeEmoji, getStatusLabel, getStatusEmoji } from '@/lib/followUpUtils.js';

const FollowUpByResponsiblePage = () => {
  const navigate = useNavigate();
  const [suivis, setSuivis] = useState([]);
  const [selectedSuiviId, setSelectedSuiviId] = useState(null);

  const fetchSuivis = async () => {
    try {
      const records = await pb.collection('suivis').getFullList({
        expand: 'responsable_assigne',
        sort: '-created',
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

  // Group by responsible
  const grouped = suivis.reduce((acc, suivi) => {
    const respName = suivi.expand?.responsable_assigne?.name || 'Non assigné';
    if (!acc[respName]) acc[respName] = [];
    acc[respName].push(suivi);
    return acc;
  }, {});

  return (
    <>
      <Helmet><title>Suivis par Responsable - ChurchFlow</title></Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Suivis par Responsable</h1>
          <Button variant="outline" onClick={() => navigate('/suivis')}><LayoutDashboard className="w-4 h-4 mr-2" /> Pipeline</Button>
        </div>

        <div className="space-y-8">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-muted-foreground">Aucun suivi trouvé.</p>
          ) : (
            Object.keys(grouped).sort().map(respName => (
              <div key={respName} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-muted/50 p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{respName}</h2>
                  <span className="bg-background text-sm font-medium px-3 py-1 rounded-full border">
                    {grouped[respName].length} suivis
                  </span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[respName].map(suivi => (
                    <div 
                      key={suivi.id} 
                      onClick={() => setSelectedSuiviId(suivi.id)}
                      className="bg-background p-4 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors"
                      style={{ borderLeftWidth: '4px', borderLeftColor: getPriorityColor(suivi.priorite) }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium">{suivi.nom_personne}</h4>
                        <span>{getTypeEmoji(suivi.type_suivi)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                        {getStatusEmoji(suivi.statut)} {getStatusLabel(suivi.statut)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
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

export default FollowUpByResponsiblePage;