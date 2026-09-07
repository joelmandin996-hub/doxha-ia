import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const CalendarGrid = ({ currentDate, events, onEventClick, onDayClick }) => {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const end = endOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border shadow-sm">
      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
        <div key={day} className="bg-muted/80 p-2 text-center text-sm font-semibold tracking-premium text-foreground">
          {day}
        </div>
      ))}
      {days.map(day => {
        const dayEvents = events.filter(e => isSameDay(new Date(e.date_debut), day));
        return (
          <div 
            key={day.toISOString()} 
            className={`min-h-[120px] bg-background p-2 transition-colors hover:bg-accent/50 cursor-pointer flex flex-col ${!isSameMonth(day, currentDate) ? 'opacity-40 bg-muted/20' : ''}`}
            onClick={() => onDayClick(day)}
          >
            <div className={`text-right text-sm font-medium mb-2 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-muted-foreground'}`}>
              {isSameDay(day, new Date()) ? (
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 inline-flex items-center justify-center">
                  {format(day, 'd')}
                </span>
              ) : (
                format(day, 'd')
              )}
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto hide-scrollbar">
              {dayEvents.map(evt => (
                <div 
                  key={evt.id} 
                  onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                  className={`text-xs px-2 py-1.5 rounded-md truncate text-white transition-transform hover:scale-[1.02] shadow-sm font-premium tracking-premium ${evt.sourceColor || 'bg-primary'}`}
                >
                  {evt.calendarSource && <span className="font-bold mr-1 opacity-90">[{evt.calendarSource}]</span>}
                  {evt.titre}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;