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
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-zinc-500" />
      </div>
      <input
        type="text"
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-primaryText text-sm placeholder:text-[#52525b] transition-all focus:outline-none focus:border-accent/60"
        {...props}
      />
    </div>
  );
};

export default SearchBar;
