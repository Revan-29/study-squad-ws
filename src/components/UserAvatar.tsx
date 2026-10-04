import React from 'react';
import { SQUAD_MEMBERS } from '../types';

interface UserAvatarProps {
  userIdOrName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userIdOrName,
  size = 'md',
  showBadge = false,
  className = '',
}) => {
  const member = SQUAD_MEMBERS.find(
    (m) =>
      m.id === userIdOrName ||
      m.username.toLowerCase() === userIdOrName.toLowerCase() ||
      m.displayName.toLowerCase() === userIdOrName.toLowerCase()
  ) || SQUAD_MEMBERS[0];

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${member.avatarColor} text-white flex items-center justify-center font-bold tracking-tight shadow-md border border-white/10 select-none transition-transform hover:scale-105`}
        title={member.displayName}
      >
        {member.initials}
      </div>
      {showBadge && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950"
          title="Online"
        />
      )}
    </div>
  );
};
