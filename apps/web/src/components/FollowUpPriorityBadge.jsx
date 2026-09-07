import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getPriorityMutedColor, getPriorityIcon, getPriorityLabel, PRIORITY_LEVELS } from '@/lib/followUpPriorityUtils';

const FollowUpPriorityBadge = ({ priority, size = 'default', className }) => {
  const safePriority = Object.values(PRIORITY_LEVELS).includes(priority) ? priority : PRIORITY_LEVELS.NORMAL;
  
  const Icon = getPriorityIcon(safePriority);
  const colorClass = getPriorityMutedColor(safePriority);
  const label = getPriorityLabel(safePriority);

  const sizeClasses = {
    sm: 'px-1.5 py-0 text-[10px] gap-1',
    default: 'px-2 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-sm gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    default: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-semibold uppercase tracking-wider border shadow-sm",
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} strokeWidth={2.5} />
      {label}
    </Badge>
  );
};

export default FollowUpPriorityBadge;