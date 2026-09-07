import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import { TARGET_FIELDS } from '@/components/ColumnMapper.jsx';

const ColumnMappingPreview = ({ data, headers, initialMapping, onConfirm, onCancel }) => {
  const [mapping, setMapping] = useState({});

  useEffect(() => {
    if (initialMapping) {
      setMapping(initialMapping);
    }
  }, [initialMapping]);

  const handleMappingChange = (header, targetField) => {
    setMapping(prev => ({
      ...prev,
      [header]: targetField
    }));
  };

  const previewRows = data.slice(0, 3);
  
  // Calculate if we have the minimum required fields configured
  const mappedValues = Object.values(mapping);
  const hasName = mappedValues.includes('name') || (mappedValues.includes('firstName') && mappedValues.includes('lastName'));
  const hasEmail = mappedValues.includes('email');
  const isValid = hasName && hasEmail;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {!isValid && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            <strong>Attention :</strong> Vous devez mapper au moins 
            {!hasName && " le Nom/Prénom"} 
            {!hasName && !hasEmail && " et"} 
            {!hasEmail && " l'Email"} pour continuer.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Association des colonnes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
          {headers.map(header => {
            const isMapped = mapping[header] && mapping[header] !== 'ignore';
            return (
              <div 
                key={header} 
                className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-colors ${
                  isMapped 
                    ? 'border-green-500/30 bg-green-50/30' 
                    : 'border-red-500/30 bg-red-50/30'
                }`}
              >
                <span className="text-sm font-medium truncate flex-1" title={header}>
                  {header}
                </span>
                <div className="w-[180px] shrink-0">
                  <Select 
                    value={mapping[header] || 'ignore'} 
                    onValueChange={(val) => handleMappingChange(header, val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Ignorer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore" className="text-muted-foreground italic">Ignorer cette colonne</SelectItem>
                      {TARGET_FIELDS.map(field => (
                        <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Aperçu des données</h3>
        <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  {headers.map(h => mapping[h] && mapping[h] !== 'ignore' ? (
                    <TableHead key={h} className="text-xs font-semibold">
                      {TARGET_FIELDS.find(f => f.id === mapping[h])?.label}
                      <span className="block text-[10px] font-normal text-muted-foreground mt-0.5 truncate max-w-[120px]">
                        depuis: {h}
                      </span>
                    </TableHead>
                  ) : null)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {headers.map(h => mapping[h] && mapping[h] !== 'ignore' ? (
                      <TableCell key={h} className="text-sm max-w-[150px] truncate">
                        {String(row[h] || '') || '-'}
                      </TableCell>
                    ) : null)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button variant="outline" onClick={onCancel} className="rounded-xl">
          Annuler
        </Button>
        <Button 
          onClick={() => onConfirm(mapping)} 
          disabled={!isValid}
          className="rounded-xl shadow-sm"
        >
          Confirmer le mapping
        </Button>
      </div>
    </div>
  );
};

export default ColumnMappingPreview;