
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';

interface ProfileFormProps {
    user: User;
    onSave: (updatedData: Partial<User & { privacyPolicyUrl?: string }>) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [shortId, setShortId] = useState(user.short_id || '');
    const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setName(user.name);
        setEmail(user.email);
        setShortId(user.short_id || '');
        if ('privacyPolicyUrl' in user) {
            setPrivacyPolicyUrl((user as any).privacyPolicyUrl || '');
        }
    }, [user]);

    const handleCopyId = () => {
        const idToCopy = shortId || user.id;
        navigator.clipboard.writeText(idToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedData: any = {
            id: user.id,
            name,
            email,
            // short_id is not included in the update payload to prevent modifications
        };
        if (user.role === UserRole.AFFILIATE) {
            updatedData.privacyPolicyUrl = privacyPolicyUrl;
        }
        onSave(updatedData);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">Il Tuo ID Personale (Short ID)</label>
                        <p className="text-sm text-gray-500">Questo identificativo è permanente e non può essere modificato.</p>
                    </div>
                    <div className="flex rounded-lg shadow-sm bg-white overflow-hidden border border-gray-300">
                        <span className="px-4 py-3 bg-gray-50 font-mono font-black text-primary text-xl border-r">
                            {shortId || 'ASSENTE'}
                        </span>
                        <button 
                            type="button" 
                            onClick={handleCopyId}
                            className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        >
                            <ClipboardIcon className="h-5 w-5 text-primary" />
                            {copied ? 'Copiato!' : 'Copia ID'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="profileName" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" id="profileName" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="profileEmail" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="profileEmail" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
            </div>

            {user.role === UserRole.AFFILIATE && (
                 <div>
                    <label htmlFor="profilePrivacyUrl" className="block text-sm font-medium text-gray-700">URL Privacy Policy (Opzionale)</label>
                    <input type="url" id="profilePrivacyUrl" value={privacyPolicyUrl} onChange={(e) => setPrivacyPolicyUrl(e.target.value)} placeholder="https://tuosito.com/privacy" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
            )}
            
            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-primary text-on-primary font-bold py-3 px-8 rounded-lg hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/20">
                    Salva Modifiche Profilo
                </button>
            </div>
        </form>
    );
};

export default ProfileForm;
