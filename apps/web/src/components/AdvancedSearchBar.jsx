import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AdvancedSearchBar = ({ searchTerm, onSearchChange }) => {
  const [localValue, setLocalValue] = useState(searchTerm || '');

  // Sync prop changes (if search term is cleared externally)
  useEffect(() => {
    setLocalValue(searchTerm || '');
  }, [searchTerm]);

  // Debounce the search term to avoid excessive filtering/renders
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onSearchChange]);

  const handleClear = () => {
    setLocalValue('');
    onSearchChange('');
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Rechercher un membre..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-10 pr-10 rounded-xl bg-background border-border/60 focus-visible:ring-primary/20 shadow-sm"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default AdvancedSearchBar;