import React from 'react';
import { X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ActiveFiltersDisplay = ({ activeFilters, groups, onRemoveFilter, totalCount }) => {
  const hasActiveFilters = 
    activeFilters.groups.length > 0 || 
    activeFilters.statuses.length > 0 || 
    activeFilters.dateRange.start || 
    activeFilters.dateRange.end;

  if (!hasActiveFilters) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <span>{totalCount} résultat{totalCount !== 1 ? 's' : ''}</span>
      </div>
    );
  }

  // Get human-readable group names
  const getGroupName = (id) => {
    const group = groups.find(g => g.id === id);
    return group ? group.name : 'Groupe inconnu';
  };

  // Format date range nicely
  const formatDateRange = () => {
    const { start, end } = activeFilters.dateRange;
    if (start && end) return `${start} - ${end}`;
    if (start) return `Depuis ${start}`;
    if (end) return `Jusqu'au ${end}`;
    return null;
  };

  const dateStr = formatDateRange();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground mr-2">
          <Filter className="w-3.5 h-3.5" /> Filtres actifs:
        </span>
        
        {activeFilters.groups.map(groupId => (
          <Badge key={`group-${groupId}`} variant="secondary" className="flex items-center gap-1 bg-secondary/60 hover:bg-secondary border-none rounded-md px-2 py-0.5">
            <span className="text-secondary-foreground/70">Groupe:</span> {getGroupName(groupId)}
            <button 
              onClick={() => onRemoveFilter('groups', groupId)} 
              className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Supprimer le filtre de groupe"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {activeFilters.statuses.map(status => (
          <Badge key={`status-${status}`} variant="secondary" className="flex items-center gap-1 bg-secondary/60 hover:bg-secondary border-none rounded-md px-2 py-0.5">
            <span className="text-secondary-foreground/70">Statut:</span> {status}
            <button 
              onClick={() => onRemoveFilter('statuses', status)} 
              className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Supprimer le filtre de statut"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {dateStr && (
          <Badge variant="secondary" className="flex items-center gap-1 bg-secondary/60 hover:bg-secondary border-none rounded-md px-2 py-0.5">
            <span className="text-secondary-foreground/70">Date:</span> {dateStr}
            <button 
              onClick={() => onRemoveFilter('dateRange', null)} 
              className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Supprimer le filtre de date"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}
      </div>

      <div className="text-sm text-muted-foreground font-medium whitespace-nowrap shrink-0">
        {totalCount} résultat{totalCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ActiveFiltersDisplay;