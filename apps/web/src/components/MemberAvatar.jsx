import React from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const MemberAvatar = ({ member, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-24 h-24 text-3xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-12 h-12',
  };

  const avatarUrl = member?.profile_photo 
    ? pb.files.getUrl(member, member.profile_photo, { thumb: '100x100' })
    : null;

  return (
    <div 
      className={cn(
        'relative flex items-center justify-center bg-secondary text-secondary-foreground rounded-2xl overflow-hidden shrink-0 shadow-sm border border-border/50',
        sizeClasses[size],
        className
      )}
    >
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={member?.name || 'Member'} 
          className="w-full h-full object-cover"
        />
      ) : member?.name ? (
        <span className="font-bold tracking-wide">
          {member.name.charAt(0).toUpperCase()}
        </span>
      ) : (
        <User className={iconSizes[size]} />
      )}
    </div>
  );
};

export default MemberAvatar;