import React from 'react';
import { formatPercentage } from '@/lib/formatters.js';
import { cn } from '@/lib/utils';

export const BudgetProgressBar = ({ spent, total, className }) => {
  const percentage = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  
  let colorClass = "bg-[hsl(var(--status-healthy))]";
  if (percentage >= 90) colorClass = "bg-[hsl(var(--status-alert))]";
  else if (percentage >= 75) colorClass = "bg-[hsl(var(--status-warning))]";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-sm mb-1.5 font-medium">
        <span className="text-muted-foreground">Consommé</span>
        <span className={cn(percentage >= 90 && "text-[hsl(var(--status-alert))]")}>
          {formatPercentage(percentage)}
        </span>
      </div>
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};