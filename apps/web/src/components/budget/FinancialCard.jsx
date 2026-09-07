import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters.js';

export const FinancialCard = ({ title, amount, icon: Icon, trend, trendLabel, colorClass }) => {
  const isPositive = trend >= 0;
  
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10", colorClass)} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg bg-background/50", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight tabular-currency text-foreground">
          {formatCurrency(amount)}
        </div>
        {trend !== undefined && (
          <div className="flex items-center mt-2 text-xs">
            <span className={cn(
              "flex items-center font-medium",
              isPositive ? "text-[hsl(var(--status-healthy))]" : "text-[hsl(var(--status-alert))]"
            )}>
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-2">{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};