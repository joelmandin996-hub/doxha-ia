import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import FollowUpForm from '@/components/FollowUpForm.jsx';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const FollowUpEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suivi, setSuivi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuivi = async () => {
      try {
        const record = await pb.collection('suivis').getOne(id, { $autoCancel: false });
        setSuivi(record);
      } catch (err) {
        console.error(err);
        toast.error('Suivi introuvable.');
        navigate('/suivis');
      } finally {
        setLoading(false);
      }
    };
    fetchSuivi();
  }, [id, navigate]);

  return (
    <>
      <Helmet><title>Modifier Suivi - ChurchFlow</title></Helmet>
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground" onClick={() => navigate('/suivis')}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Retour aux suivis
        </Button>
        
        <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-6">Modifier le suivi</h1>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <FollowUpForm 
              initialData={suivi}
              onSuccess={() => navigate('/suivis')} 
              onCancel={() => navigate('/suivis')} 
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FollowUpEditPage;