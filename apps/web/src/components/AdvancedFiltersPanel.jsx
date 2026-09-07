import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from 'date-fns';

const STATUS_OPTIONS = ['Actif', 'Inactif', 'Visiteur', 'Nouveau', 'Baptisé'];

const AdvancedFiltersPanel = ({ groups, filterState, onChange, onApply, onReset }) => {
  const [localState, setLocalState] = useState(filterState);

  // Sync with external state if it completely resets
  useEffect(() => {
    setLocalState(filterState);
  }, [filterState]);

  const handleGroupToggle = (groupId) => {
    const newGroups = localState.groups.includes(groupId)
      ? localState.groups.filter(id => id !== groupId)
      : [...localState.groups, groupId];
    setLocalState({ ...localState, groups: newGroups });
  };

  const handleStatusToggle = (status) => {
    const newStatuses = localState.statuses.includes(status)
      ? localState.statuses.filter(s => s !== status)
      : [...localState.statuses, status];
    setLocalState({ ...localState, statuses: newStatuses });
  };

  const handleDateChange = (field, value) => {
    setLocalState({
      ...localState,
      dateRange: { ...localState.dateRange, [field]: value }
    });
  };

  const applyPreset = (preset) => {
    const now = new Date();
    let start = '';
    let end = '';

    switch (preset) {
      case 'week':
        start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'month':
        start = format(startOfMonth(now), 'yyyy-MM-dd');
        end = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'year':
        start = format(startOfYear(now), 'yyyy-MM-dd');
        end = format(endOfYear(now), 'yyyy-MM-dd');
        break;
      case 'all':
        start = '';
        end = '';
        break;
    }

    setLocalState({
      ...localState,
      dateRange: { start, end }
    });
  };

  const handleApply = () => {
    onChange(localState);
    if (onApply) onApply();
  };

  const handleReset = () => {
    const resetState = { groups: [], statuses: [], dateRange: { start: '', end: '' } };
    setLocalState(resetState);
    onChange(resetState);
    if (onReset) onReset();
  };

  return (
    <Card className="rounded-2xl shadow-lg border-border/60 bg-card overflow-hidden">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Groupes Filter */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm tracking-tight">Groupes</h4>
            <ScrollArea className="h-[200px] rounded-lg border bg-muted/20 p-4">
              <div className="space-y-4">
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun groupe trouvé</p>
                ) : (
                  groups.map(group => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`group-${group.id}`} 
                        checked={localState.groups.includes(group.id)}
                        onCheckedChange={() => handleGroupToggle(group.id)}
                      />
                      <Label htmlFor={`group-${group.id}`} className="text-sm font-normal cursor-pointer flex-1 flex justify-between">
                        <span className="truncate pr-2">{group.name}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded tabular-nums-custom">
                          {group.memberCount || 0}
                        </span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Statut Filter */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm tracking-tight">Statut</h4>
            <ScrollArea className="h-[200px] rounded-lg border bg-muted/20 p-4">
              <div className="space-y-4">
                {STATUS_OPTIONS.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`status-${status}`} 
                      checked={localState.statuses.includes(status)}
                      onCheckedChange={() => handleStatusToggle(status)}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm font-normal cursor-pointer">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Date d'inscription Filter */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm tracking-tight">Date d'inscription</h4>
            <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input 
                    type="date" 
                    value={localState.dateRange.start} 
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">À</Label>
                  <Input 
                    type="date" 
                    value={localState.dateRange.end} 
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Label className="text-xs text-muted-foreground mb-2 block">Raccourcis</Label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs rounded-md" onClick={() => applyPreset('week')}>Cette semaine</Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs rounded-md" onClick={() => applyPreset('month')}>Ce mois</Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs rounded-md" onClick={() => applyPreset('year')}>Cette année</Button>
                  <Button type="button" variant="secondary" size="sm" className="h-7 text-xs rounded-md" onClick={() => applyPreset('all')}>Tout</Button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-border/60">
          <Button variant="ghost" onClick={handleReset} className="rounded-xl">
            Réinitialiser
          </Button>
          <Button onClick={handleApply} className="rounded-xl shadow-sm">
            Appliquer les filtres
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedFiltersPanel;