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
      <div className="w-40 h-8 border border-border rounded-md bg-card/50 p-1.5 overflow-hidden">
        <div className="h-full w-10 bg-accent/80 rounded-sm animate-[pulse_1.2s_linear_infinite]"></div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono font-bold tracking-wider text-accent uppercase">
          SYS
        </span>
        <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-secondaryText uppercase">
          {label}
        </span>
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
