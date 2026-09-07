import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import EventForm from '@/components/calendar/EventForm.jsx';

const NewEventPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Nouvel Événement - ChurchFlow</title>
      </Helmet>

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')} className="mb-2 -ml-2 text-muted-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> Retour au calendrier
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Nouvel Événement</h1>
          <p className="text-muted-foreground mt-1">Planifiez une activité pour l'église.</p>
        </div>

        <Card className="shadow-lg border-0 ring-1 ring-border/50">
          <CardHeader className="bg-muted/30 border-b pb-6">
            <CardTitle>Détails de l'événement</CardTitle>
            <CardDescription>Remplissez les informations ci-dessous.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <EventForm 
              onSuccess={() => navigate('/calendar')} 
              onCancel={() => navigate('/calendar')} 
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default NewEventPage;