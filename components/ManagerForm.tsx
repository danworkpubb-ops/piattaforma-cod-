import React, { useState, useEffect } from 'react';
import { Manager } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';

interface ManagerFormProps {
  manager?: Manager | null;
  onSave: (managerData: Partial<Manager>) => void;
  onClose: () => void;
}

const ManagerForm: React.FC<ManagerFormProps> = ({ manager, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (manager) {
      setName(manager.name);
      setEmail(manager.email);
      setPassword(''); // Non pre-compilare per sicurezza
      setIsBlocked(manager.isBlocked);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setIsBlocked(false);
    }
  }, [manager]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const managerData: Partial<Manager> = { name, email, isBlocked };
    if (password) {
        managerData.password = password;
    }
    onSave(managerData);
  };

  return (
    <form onSubmit={handleSubmit}>
        <div className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Manager</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                 <div className="relative mt-1">
                    <input 
                        type={showPassword ? 'text' : 'password'}
                        id="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required={!manager} // Obbligatoria solo per i nuovi manager
                        placeholder={manager ? "Lascia vuoto per non modificare" : "Imposta una password"}
                        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                    >
                      {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>
            <div className="flex items-center">
                <label htmlFor="isBlocked" className="block text-sm font-medium text-gray-700 mr-4">Stato Account</label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="isBlocked" id="isBlocked" checked={isBlocked} onChange={() => setIsBlocked(!isBlocked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                    <label htmlFor="isBlocked" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                </div>
                 <label htmlFor="isBlocked" className={`text-sm ${isBlocked ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{isBlocked ? 'Bloccato' : 'Attivo'}</label>
            </div>
            <style>{`
                .toggle-checkbox:checked { right: 0; border-color: #4caf50; }
                .toggle-checkbox:checked + .toggle-label { background-color: #4caf50; }
            `}</style>
        </div>
        <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                Annulla
            </button>
            <button type="submit" className="bg-primary text-on-primary font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200">
                {manager ? 'Salva Modifiche' : 'Crea Manager'}
            </button>
        </div>
    </form>
  );
};

export default ManagerForm;
