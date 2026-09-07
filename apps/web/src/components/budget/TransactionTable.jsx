import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters.js';
import { CategoryIcon } from './CategoryIcon.jsx';

export const TransactionTable = ({ transactions, type = 'income' }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center p-8 bg-card rounded-xl border border-dashed">
        <p className="text-muted-foreground">Aucune transaction trouvée.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Date</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Description</TableHead>
            {type === 'expense' && <TableHead>Statut</TableHead>}
            <TableHead className="text-right">Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="group hover:bg-muted/30">
              <TableCell className="font-medium">
                {new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-muted">
                    <CategoryIcon category={tx.categorie} className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span>{tx.categorie}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate">
                {tx.description || tx.note || '-'}
              </TableCell>
              {type === 'expense' && (
                <TableCell>
                  <Badge variant={tx.statut === 'Payé' ? 'outline' : 'destructive'} 
                    className={tx.statut === 'Payé' ? 'border-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy))]' : ''}>
                    {tx.statut}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="text-right tabular-currency font-semibold">
                <span className={type === 'income' ? 'text-[hsl(var(--status-healthy))]' : 'text-foreground'}>
                  {type === 'income' ? '+' : '-'}{formatCurrency(tx.montant)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};