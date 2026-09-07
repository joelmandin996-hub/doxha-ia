import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import pb from '@/lib/pocketbaseClient';
import { Tag, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_SUBCATS = [
  { name: 'Urgent', color: 'bg-red-500 text-white' },
  { name: 'VIP', color: 'bg-amber-500 text-white' },
  { name: 'Nouveau', color: 'bg-blue-500 text-white' },
  { name: 'Relance', color: 'bg-purple-500 text-white' },
  { name: 'Information', color: 'bg-slate-500 text-white' }
];

export const SubCategoryBadge = ({ suivi, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentVal = suivi?.sous_rubrique || '';

  const getSubcatStyle = (val) => {
    if (!val) return 'bg-muted text-muted-foreground border-border/50';
    const preset = PRESET_SUBCATS.find(p => p.name.toLowerCase() === val.toLowerCase());
    if (preset) return preset.color + ' border-transparent';
    return 'bg-secondary text-secondary-foreground border-border';
  };

  const handleUpdate = async (newVal) => {
    if (newVal === currentVal) {
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const updated = await pb.collection('suivis').update(suivi.id, { sous_rubrique: newVal }, { $autoCancel: false });
      toast.success("Sous-catégorie mise à jour");
      if (onUpdate) onUpdate(updated);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customVal.trim()) {
      handleUpdate(customVal.trim());
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full transition-transform active:scale-95">
          <Badge variant="outline" className={cn("px-2.5 py-0.5 text-xs font-semibold shadow-sm hover:opacity-80 cursor-pointer flex items-center gap-1.5 transition-colors", getSubcatStyle(currentVal))}>
            {currentVal || 'Ajouter un tag'}
            <Tag className="w-3 h-3 opacity-50" />
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 rounded-xl shadow-lg border-border" align="start">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Étiquettes rapides
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_SUBCATS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleUpdate(preset.name)}
                disabled={isLoading}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-1",
                  preset.color,
                  currentVal === preset.name ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : "opacity-90 hover:opacity-100"
                )}
              >
                {preset.name}
                {currentVal === preset.name && <Check className="w-3 h-3" />}
              </button>
            ))}
            {currentVal && !PRESET_SUBCATS.some(p => p.name === currentVal) && (
               <button
                 onClick={() => handleUpdate(currentVal)}
                 className="px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground transition-all ring-2 ring-ring ring-offset-1 ring-offset-background flex items-center gap-1"
               >
                 {currentVal}
                 <Check className="w-3 h-3" />
               </button>
            )}
          </div>
          
          <div className="pt-2 mt-2 border-t border-border/50">
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <Input
                size="sm"
                placeholder="Tag personnalisé..."
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                className="h-8 text-xs bg-muted/50"
              />
              <Button size="sm" type="submit" className="h-8 w-8 p-0 shrink-0" disabled={isLoading || !customVal.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>
          </div>
          
          {currentVal && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleUpdate('')} 
              className="w-full h-8 text-xs text-muted-foreground hover:text-destructive"
              disabled={isLoading}
            >
              Retirer l'étiquette
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};