import React from 'react';
import { Manager } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';

interface ManagerListProps {
  managers: Manager[];
  onAddManager: () => void;
  onEditManager: (manager: Manager) => void;
  onDeleteManager: (managerId: string) => void;
}

const ManagerList: React.FC<ManagerListProps> = ({ managers, onAddManager, onEditManager, onDeleteManager }) => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-on-surface">Gestione Manager</h2>
        <button
          onClick={onAddManager}
          className="bg-primary text-on-primary font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center gap-2"
        >
          <PlusIcon />
          Aggiungi Manager
        </button>
      </div>
      <div className="bg-surface rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Azioni</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {managers.map((manager) => (
              <tr key={manager.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{manager.email}</div>
                </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${!manager.isBlocked ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {!manager.isBlocked ? 'Attivo' : 'Bloccato'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-4">
                    <button onClick={() => onEditManager(manager)} className="text-primary hover:text-primary-dark">
                      <PencilIcon />
                    </button>
                    <button onClick={() => onDeleteManager(manager.id)} className="text-red-600 hover:text-red-800">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerList;