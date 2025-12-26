import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface NicheManagerProps {
  niches: string[];
  products: Product[];
  onAddNiche: (niche: string) => void;
  onDeleteNiche: (niche: string) => void;
}

const NicheManager: React.FC<NicheManagerProps> = ({ niches, products, onAddNiche, onDeleteNiche }) => {
  const [newNiche, setNewNiche] = useState('');
  const [error, setError] = useState('');

  const nicheUsage = useMemo(() => {
    const counts: { [key: string]: number } = {};
    for (const niche of niches) {
      counts[niche] = 0;
    }
    for (const product of products) {
      if (counts[product.niche] !== undefined) {
        counts[product.niche]++;
      }
    }
    return counts;
  }, [niches, products]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedNiche = newNiche.trim();
    if (!trimmedNiche) {
      setError('Il nome della nicchia non può essere vuoto.');
      return;
    }
    if (niches.some(n => n.toLowerCase() === trimmedNiche.toLowerCase())) {
      setError('Questa nicchia esiste già.');
      return;
    }
    onAddNiche(trimmedNiche);
    setNewNiche('');
  };

  const handleDelete = (niche: string) => {
    if (nicheUsage[niche] > 0) {
      alert("Non puoi eliminare una nicchia che è attualmente in uso da uno o più prodotti.");
      return;
    }
    if (window.confirm(`Sei sicuro di voler eliminare la nicchia "${niche}"?`)) {
      onDeleteNiche(niche);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aggiungi Nuova Nicchia</h3>
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={newNiche}
            onChange={(e) => setNewNiche(e.target.value)}
            placeholder="Es. Corsi Online"
            className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
          <button
            type="submit"
            className="bg-primary text-on-primary font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center gap-1"
          >
            <PlusIcon className="w-5 h-5" />
            Aggiungi
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nicchie Esistenti</h3>
        <div className="max-h-60 overflow-y-auto border rounded-lg bg-gray-50 p-2 space-y-2">
          {niches.length > 0 ? (
            niches.sort((a,b) => a.localeCompare(b)).map(niche => (
              <div key={niche} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                <div>
                  <span className="font-semibold text-gray-800">{niche}</span>
                  <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {nicheUsage[niche] || 0} Prodotti
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(niche)}
                  disabled={nicheUsage[niche] > 0}
                  className="p-1 text-red-600 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-red-100 disabled:hover:bg-transparent"
                  aria-label={`Elimina nicchia ${niche}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 p-4">Nessuna nicchia definita.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NicheManager;
