import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Minimal required styles
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';

const GroupEventCalendar = ({ events, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Aggregate events by date string (YYYY-MM-DD)
  const eventsByDate = events.reduce((acc, event) => {
    if (!event.date) return acc;
    const dateStr = event.date.split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {});

  const eventDays = Object.keys(eventsByDate).map(d => {
    // Pocketbase dates are stored at 12:00:00Z to avoid timezone shift, parse carefully
    return new Date(d + 'T12:00:00'); 
  });

  const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const dayEvents = selectedDateStr ? eventsByDate[selectedDateStr] || [] : [];

  const modifiers = {
    hasEvent: eventDays
  };

  const modifiersStyles = {
    hasEvent: { 
      fontWeight: 'bold', 
      backgroundColor: 'hsl(var(--primary) / 0.15)',
      color: 'hsl(var(--primary))',
      borderRadius: '100%'
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 flex justify-center">
        <Card className="w-full max-w-[350px] inline-block shadow-sm">
          <CardContent className="p-4">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if(d) setSelectedDate(d);
                if(onDateSelect) onDateSelect(d);
              }}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="mx-auto"
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">
          {selectedDate ? selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sélectionnez une date'}
        </h3>
        
        {dayEvents.length === 0 ? (
          <div className="text-center py-10 bg-muted/20 rounded-xl">
            <p className="text-muted-foreground">Aucun événement prévu pour cette date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(event => (
              <div key={event.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-card">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-lg">{event.title}</h4>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {event.start_time} - {event.end_time}</span>
                  {event.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location}</span>}
                </div>
                {event.description && <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupEventCalendar;