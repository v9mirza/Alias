import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (val: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchChange,
  className = '',
  placeholder = 'Search users...',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-zinc-500" />
      </div>
      <input
        type="text"
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full min-h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-primaryText text-sm placeholder:text-[#66788f] transition-all focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
        {...props}
      />
    </div>
  );
};

export default SearchBar;
