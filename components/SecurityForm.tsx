import React, { useState } from 'react';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';

interface SecurityFormProps {
    onChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const SecurityForm: React.FC<SecurityFormProps> = ({ onChangePassword }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 6) {
            setError('La nuova password deve essere di almeno 6 caratteri.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Le nuove password non coincidono.');
            return;
        }

        const wasSuccessful = await onChangePassword(currentPassword, newPassword);

        if (wasSuccessful) {
            setSuccess('Password aggiornata con successo!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setError('La password attuale non è corretta.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Password Attuale</label>
                <div className="relative mt-1">
                    <input type={showCurrent ? 'text' : 'password'} id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                        {showCurrent ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nuova Password</label>
                 <div className="relative mt-1">
                    <input type={showNew ? 'text' : 'password'} id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                        {showNew ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Conferma Nuova Password</label>
                 <div className="relative mt-1">
                    <input type={showConfirm ? 'text' : 'password'} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                     <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                        {showConfirm ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-green-600 text-sm text-center">{success}</p>}

            <div className="flex justify-end">
                <button type="submit" className="bg-primary text-on-primary font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200">
                    Cambia Password
                </button>
            </div>
        </form>
    );
};

export default SecurityForm;
