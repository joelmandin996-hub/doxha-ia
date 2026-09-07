import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import FollowUpForm from '@/components/FollowUpForm.jsx';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FollowUpNewPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet><title>Nouveau Suivi - ChurchFlow</title></Helmet>
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground" onClick={() => navigate('/suivis')}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Retour aux suivis
        </Button>
        
        <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-6">Créer un nouveau suivi</h1>
          <FollowUpForm 
            onSuccess={() => navigate('/suivis')} 
            onCancel={() => navigate('/suivis')} 
          />
        </div>
      </div>
    </>
  );
};

export default FollowUpNewPage;