import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AlertWidget = ({ type = 'info', title, description }) => {
  const styles = {
    info: {
      bg: 'bg-accent/50',
      border: 'border-accent',
      icon: <Info className="w-5 h-5 text-accent-foreground" />,
      text: 'text-accent-foreground'
    },
    warning: {
      bg: 'bg-[hsl(var(--status-warning)_/_0.1)]',
      border: 'border-[hsl(var(--status-warning)_/_0.2)]',
      icon: <AlertCircle className="w-5 h-5 text-[hsl(var(--status-warning))]" />,
      text: 'text-foreground'
    },
    alert: {
      bg: 'bg-[hsl(var(--status-alert)_/_0.1)]',
      border: 'border-[hsl(var(--status-alert)_/_0.2)]',
      icon: <AlertCircle className="w-5 h-5 text-[hsl(var(--status-alert))]" />,
      text: 'text-foreground'
    },
    success: {
      bg: 'bg-[hsl(var(--status-healthy)_/_0.1)]',
      border: 'border-[hsl(var(--status-healthy)_/_0.2)]',
      icon: <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-healthy))]" />,
      text: 'text-foreground'
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-xl border", currentStyle.bg, currentStyle.border)}>
      <div className="flex-shrink-0 mt-0.5">{currentStyle.icon}</div>
      <div>
        <h4 className={cn("text-sm font-semibold mb-1", currentStyle.text)}>{title}</h4>
        {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
    </div>
  );
};