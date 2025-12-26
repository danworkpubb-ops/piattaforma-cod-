
import React, { useState, useEffect } from 'react';
import { Affiliate, UserRole, User, UserStatus } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { generateShortId } from '../database';

interface AffiliateFormProps {
  affiliate?: Affiliate | User | null;
  onSave: (affiliateData: Partial<Affiliate>) => void;
  onClose: () => void;
  currentUserRole?: UserRole;
}

const AffiliateForm: React.FC<AffiliateFormProps> = ({ affiliate, onSave, onClose, currentUserRole }) => {
  const [id, setId] = useState('');
  const [shortId, setShortId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.AFFILIATE);
  const [status, setStatus] = useState<UserStatus>('pending');
  const [showPassword, setShowPassword] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');

  const isAdmin = currentUserRole === UserRole.ADMIN;

  useEffect(() => {
    if (affiliate) {
      setId(affiliate.id);
      setShortId(affiliate.short_id || '');
      setName(affiliate.name);
      setEmail(affiliate.email);
      setRole(affiliate.role || UserRole.AFFILIATE);
      setStatus(affiliate.status || 'pending');
      setPassword(''); 
      setIsBlocked(!!affiliate.isBlocked);
      setPrivacyPolicyUrl((affiliate as any).privacyPolicyUrl || '');
    } else {
      setId(''); 
      setShortId(generateShortId());
      setName('');
      setEmail('');
      setRole(UserRole.AFFILIATE);
      setStatus('pending');
      setPassword('');
      setIsBlocked(false);
      setPrivacyPolicyUrl('');
    }
  }, [affiliate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const affiliateData: any = { 
        id, 
        short_id: shortId,
        name, 
        email, 
        role,
        status,
        isBlocked, 
        privacyPolicyUrl 
    };
    if (password) {
        affiliateData.password = password;
    }
    onSave(affiliateData);
  };

  return (
    <form onSubmit={handleSubmit}>
        <div className="space-y-6">
            <div className="p-4 bg-gray-100 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">ID Pubblico</label>
                    <div className="mt-1 p-2 bg-white border border-gray-200 rounded-md font-mono font-bold text-primary select-all">
                        {shortId}
                    </div>
                </div>
                {id && (
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">ID Sistema (UUID)</label>
                        <p className="mt-2 text-[10px] font-mono text-gray-400 truncate">{id}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isAdmin && (
                    <>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Ruolo Piattaforma</label>
                        <select 
                            id="role" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value={UserRole.AFFILIATE}>Affiliato</option>
                            <option value={UserRole.MANAGER}>Manager</option>
                            <option value={UserRole.CUSTOMER_CARE}>Customer Care</option>
                            <option value={UserRole.LOGISTICS}>Logistica</option>
                            <option value={UserRole.ADMIN}>Amministratore</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Stato Account</label>
                        <select 
                            id="status" 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value as UserStatus)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value="pending">In Attesa (Pending)</option>
                            <option value="active">Attivo (Active)</option>
                            <option value="blocked">Disabilitato/Rifiutato (Blocked)</option>
                        </select>
                    </div>
                    </>
                )}
                {!isAdmin && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative mt-1">
                            <input 
                                type={showPassword ? 'text' : 'password'}
                                id="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required={!affiliate} 
                                placeholder={affiliate ? "Lascia vuoto per non modificare" : "Imposta una password"}
                                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                            >
                            {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {role === UserRole.AFFILIATE && (
                <div>
                    <label htmlFor="privacyPolicyUrl" className="block text-sm font-medium text-gray-700">URL Privacy Policy (Opzionale)</label>
                    <input type="url" id="privacyPolicyUrl" value={privacyPolicyUrl} onChange={(e) => setPrivacyPolicyUrl(e.target.value)} placeholder="https://tuosito.com/privacy" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
            )}

            {isAdmin && (
                <div className="flex items-center">
                    <label htmlFor="isBlocked" className="block text-sm font-medium text-gray-700 mr-4">Blocco Accesso (Ban)</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="isBlocked" id="isBlocked" checked={isBlocked} onChange={() => setIsBlocked(!isBlocked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                        <label htmlFor="isBlocked" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                    <label htmlFor="isBlocked" className={`text-sm ${isBlocked ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{isBlocked ? 'Accesso BLOCCATO' : 'Accesso Consentito'}</label>
                </div>
            )}
        </div>
        <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                Annulla
            </button>
            <button type="submit" className="bg-primary text-on-primary font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200">
                {affiliate ? 'Salva Modifiche' : 'Crea Utente'}
            </button>
        </div>
    </form>
  );
};

export default AffiliateForm;
