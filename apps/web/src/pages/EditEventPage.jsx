import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import EventForm from '@/components/calendar/EventForm.jsx';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const record = await pb.collection('evenements').getOne(id, { $autoCancel: false });
        setEvent(record);
      } catch (err) {
        console.error(err);
        toast.error('Événement introuvable.');
        navigate('/calendar');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  return (
    <>
      <Helmet>
        <title>Modifier Événement - ChurchFlow</title>
      </Helmet>

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')} className="mb-2 -ml-2 text-muted-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> Retour au calendrier
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Modifier l'événement</h1>
          <p className="text-muted-foreground mt-1">Mettez à jour les informations de l'activité.</p>
        </div>

        <Card className="shadow-lg border-0 ring-1 ring-border/50">
          <CardHeader className="bg-muted/30 border-b pb-6">
            <CardTitle>Détails de l'événement</CardTitle>
            <CardDescription>Mofidiez les champs souhaités.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <EventForm 
                initialData={event}
                onSuccess={() => navigate('/calendar')} 
                onCancel={() => navigate('/calendar')} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EditEventPage;