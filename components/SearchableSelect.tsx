import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface Option {
  value: string;
  label: string;
  refNumber?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Seleziona...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find(opt => opt.value === value) || null, [options, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const allOption = options.find(o => o.value === 'all');
    const otherOptions = options.filter(o => o.value !== 'all');

    if (!searchTerm.trim()) {
        return options;
    }

    const searchFiltered = otherOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.refNumber && option.refNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return allOption ? [allOption, ...searchFiltered] : searchFiltered;
}, [options, searchTerm]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary flex justify-between items-center text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-md max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca per nome o REF..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <SearchIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          <ul className="overflow-y-auto flex-grow">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {option.label} {option.refNumber && option.value !== 'all' && <span className="text-xs text-gray-500">({option.refNumber})</span>}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-500">Nessun prodotto trovato</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;