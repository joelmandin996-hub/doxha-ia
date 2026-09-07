import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addHours, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const TimeSlotView = ({ currentDate, events, viewType, onEventClick, onTimeSlotClick }) => {
  const days = viewType === 'week' 
    ? eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) })
    : [currentDate];
  
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-[700px] bg-card rounded-2xl border shadow-sm overflow-auto hide-scrollbar font-premium tracking-premium">
      <div className="flex border-b sticky top-0 bg-muted/95 backdrop-blur z-20 shadow-sm">
        <div className="w-16 shrink-0 border-r" />
        {days.map(day => (
          <div key={day.toISOString()} className="flex-1 p-3 text-center border-r last:border-r-0 font-medium text-sm">
            {format(day, 'EEE d', { locale: fr })}
          </div>
        ))}
      </div>
      <div className="flex flex-1 relative">
        <div className="w-16 shrink-0 border-r bg-muted/30">
          {hours.map(hour => (
            <div key={hour} className="h-20 border-b text-xs text-center p-2 text-muted-foreground font-medium">
              {hour}:00
            </div>
          ))}
        </div>
        <div className="flex flex-1">
          {days.map(day => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.date_debut), day));
            return (
              <div key={day.toISOString()} className="flex-1 relative border-r last:border-r-0">
                {hours.map(hour => (
                  <div 
                    key={hour} 
                    className="h-20 border-b hover:bg-accent/40 cursor-pointer transition-colors"
                    onClick={() => onTimeSlotClick(addHours(startOfDay(day), hour))}
                  />
                ))}
                {dayEvents.map(evt => {
                  const d = new Date(evt.date_debut);
                  const top = (d.getHours() + d.getMinutes() / 60) * 5; // 5rem = 80px = h-20
                  return (
                    <div 
                      key={evt.id}
                      className={`absolute left-1.5 right-1.5 rounded-lg p-2 text-xs text-white overflow-hidden cursor-pointer shadow-md transition-transform hover:scale-[1.02] hover:z-10 ${evt.sourceColor || 'bg-primary'}`}
                      style={{ top: `${top}rem`, minHeight: '4rem', zIndex: 5 }}
                      onClick={() => onEventClick(evt)}
                    >
                      <div className="font-semibold leading-tight">
                        {evt.calendarSource && <span className="opacity-90">[{evt.calendarSource}] </span>}
                        {evt.titre}
                      </div>
                      <div className="text-[10px] opacity-80 mt-1">{format(d, 'HH:mm')}</div>
                    </div>
                  )
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeSlotView;