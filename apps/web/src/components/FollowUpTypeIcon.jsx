import React from 'react';
import { 
  UserPlus, HeartHandshake, FolderHeart as HandHeart, UserMinus, 
  Users, BookOpen, Gift, Home, Flame, Baby, MapPin, Phone, Coffee, 
  MoreHorizontal, AlertCircle, ArrowRight, ArrowDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const FOLLOW_UP_TYPES = {
  'Nouveau membre': { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'Suivi pastoral': { icon: HeartHandshake, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Demande de prière': { icon: HandHeart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'Membre absent': { icon: UserMinus, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'Bénévole': { icon: Users, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  'Formation': { icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'Donateur': { icon: Gift, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  'Famille': { icon: Home, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  'Jeunesse': { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'Enfant': { icon: Baby, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  'Visite': { icon: MapPin, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  'Appel': { icon: Phone, color: 'text-lime-500', bg: 'bg-lime-500/10' },
  'Rencontre': { icon: Coffee, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
  'Autre': { icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-500/10' }
};

export const FollowUpTypeIcon = ({ type, className, showLabel = false }) => {
  const config = FOLLOW_UP_TYPES[type] || FOLLOW_UP_TYPES['Autre'];
  const Icon = config.icon;

  if (showLabel) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border", config.bg, config.color, "border-current/20", className)}>
        <Icon className="w-3.5 h-3.5" />
        {type}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center justify-center rounded-lg p-2", config.bg, config.color, className)}>
      <Icon className="w-4 h-4" />
    </div>
  );
};

export const getPriorityConfig = (priority) => {
  switch (priority) {
    case 'Haute':
      return { icon: AlertCircle, color: 'text-[hsl(var(--priority-high))]', bg: 'bg-[hsl(var(--priority-high))]/10', border: 'border-[hsl(var(--priority-high))]/20' };
    case 'Normale':
      return { icon: ArrowRight, color: 'text-[hsl(var(--priority-normal))]', bg: 'bg-[hsl(var(--priority-normal))]/10', border: 'border-[hsl(var(--priority-normal))]/20' };
    case 'Basse':
      return { icon: ArrowDown, color: 'text-[hsl(var(--priority-low))]', bg: 'bg-[hsl(var(--priority-low))]/10', border: 'border-[hsl(var(--priority-low))]/20' };
    default:
      return { icon: ArrowRight, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
  }
};