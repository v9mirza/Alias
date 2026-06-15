import React from 'react';

interface LoaderProps {
  label?: string;
  fullscreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  label = 'INITIALIZING...',
  fullscreen = false
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Nothing OS inspired loader: rotating minimal circle with monospaced text */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full border-t border-r border-[#262626] animate-spin"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-secondaryText uppercase">
          {label}
        </span>
        <span className="text-accent font-bold font-mono animate-pulse">|</span>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
