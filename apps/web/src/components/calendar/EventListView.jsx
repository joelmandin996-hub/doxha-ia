import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

const EventListView = ({ events, onEventClick }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-card border border-dashed rounded-2xl">
        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">Aucun événement à afficher</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-8">
      {events.map(evt => (
        <Card 
          key={evt.id} 
          className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border-border/60" 
          onClick={() => onEventClick(evt)}
        >
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-lg tracking-premium-tight">{evt.titre}</h4>
                {evt.calendarSource && (
                  <Badge className={`${evt.sourceColor} text-white border-transparent shadow-sm`}>
                    {evt.calendarSource}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(evt.date_debut), "EEEE d MMMM yyyy", { locale: fr })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {format(new Date(evt.date_debut), "HH:mm")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EventListView;