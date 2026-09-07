import { AlertCircle, Minus, ArrowDown } from 'lucide-react';

export const PRIORITY_LEVELS = {
  URGENT: 'urgent',
  NORMAL: 'normal',
  BASSE: 'basse'
};

export const PRIORITY_ORDER = {
  urgent: 3,
  normal: 2,
  basse: 1
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case PRIORITY_LEVELS.URGENT:
      return 'bg-[hsl(var(--priority-urgent))] text-[hsl(var(--priority-urgent-foreground))] border-[hsl(var(--priority-urgent))]';
    case PRIORITY_LEVELS.NORMAL:
      return 'bg-[hsl(var(--priority-normal))] text-[hsl(var(--priority-normal-foreground))] border-[hsl(var(--priority-normal))]';
    case PRIORITY_LEVELS.BASSE:
      return 'bg-[hsl(var(--priority-basse))] text-[hsl(var(--priority-basse-foreground))] border-[hsl(var(--priority-basse))]';
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
};

export const getPriorityMutedColor = (priority) => {
  switch (priority) {
    case PRIORITY_LEVELS.URGENT:
      return 'bg-[hsl(var(--priority-urgent))]/10 text-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent))]/20';
    case PRIORITY_LEVELS.NORMAL:
      return 'bg-[hsl(var(--priority-normal))]/10 text-[hsl(var(--priority-normal))] border-[hsl(var(--priority-normal))]/20';
    case PRIORITY_LEVELS.BASSE:
      return 'bg-[hsl(var(--priority-basse))]/10 text-[hsl(var(--priority-basse))] border-[hsl(var(--priority-basse))]/20';
    default:
      return 'bg-muted/50 text-muted-foreground border-muted';
  }
};

export const getPriorityIcon = (priority) => {
  switch (priority) {
    case PRIORITY_LEVELS.URGENT:
      return AlertCircle;
    case PRIORITY_LEVELS.NORMAL:
      return Minus;
    case PRIORITY_LEVELS.BASSE:
      return ArrowDown;
    default:
      return Minus;
  }
};

export const getPriorityLabel = (priority) => {
  switch (priority) {
    case PRIORITY_LEVELS.URGENT:
      return 'Urgent';
    case PRIORITY_LEVELS.NORMAL:
      return 'Normal';
    case PRIORITY_LEVELS.BASSE:
      return 'Basse';
    default:
      return 'Non défini';
  }
};