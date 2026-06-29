import React from 'react';

interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  username = '?',
  size = 'md',
  className = '',
  isOnline
}) => {
  const getInitials = (name: string) => {
    const safeName = typeof name === 'string' ? name.trim() : '';
    if (!safeName) return '?';
    return safeName.slice(0, 2).toUpperCase();
  };

  // Generate a seed-based dark pastel background color
  const getAvatarColor = (name: string) => {
    const safeName = typeof name === 'string' ? name : '?';
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    // Dark pastel: saturation 40-65%, lightness 20-35%
    return `hsl(${h}, 50%, 25%)`;
  };

  const sizes = {
    sm: 'w-9 h-9 text-[10px]',
    md: 'w-11 h-11 text-xs',
    lg: 'w-16 h-16 text-lg'
  };

  const initials = getInitials(username);
  const bgColor = getAvatarColor(username);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <div
        style={{ backgroundColor: bgColor }}
        className={`rounded-full flex items-center justify-center font-mono font-bold text-primaryText border border-border shadow-inner shadow-black/40 ${sizes[size]}`}
      >
        {initials}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-background ${
            isOnline ? 'bg-green-500' : 'bg-zinc-600'
          } ${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'}`}
        />
      )}
    </div>
  );
};

export default Avatar;
