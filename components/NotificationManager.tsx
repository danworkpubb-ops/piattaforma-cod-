import React, { useState, useMemo } from 'react';
import { Notification, User, UserRole } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import Modal from './Modal';

interface NotificationManagerProps {
    notifications: Notification[];
    allUsers: Omit<User, 'notifications'>[];
    onCreateNotification: (notificationData: Omit<Notification, 'id' | 'createdAt' | 'readBy'>) => void;
    onDeleteNotification: (notificationId: string) => void;
}

const NotificationForm: React.FC<{
    onSave: (data: { title: string, message: string, targetRoles: UserRole[] }) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRoles, setTargetRoles] = useState<UserRole[]>([]);
    
    const availableRoles = [UserRole.AFFILIATE, UserRole.MANAGER, UserRole.LOGISTICS, UserRole.ADMIN];

    const handleRoleToggle = (role: UserRole) => {
        setTargetRoles(prev => 
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && message && targetRoles.length > 0) {
            onSave({ title, message, targetRoles });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Messaggio</label>
                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Destinatari</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {availableRoles.map(role => (
                        <button
                            type="button"
                            key={role}
                            onClick={() => handleRoleToggle(role)}
                            className={`px-3 py-1 text-sm rounded-full border ${
                                targetRoles.includes(role)
                                ? 'bg-primary text-on-primary border-primary'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>
             <div className="mt-8 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                    Annulla
                </button>
                <button type="submit" className="bg-primary text-on-primary font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200">
                    Invia Notifica
                </button>
            </div>
        </form>
    );
};


const NotificationManager: React.FC<NotificationManagerProps> = ({ notifications, allUsers, onCreateNotification, onDeleteNotification }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewingReaders, setViewingReaders] = useState<User[] | null>(null);
    const [viewingNotificationTitle, setViewingNotificationTitle] = useState('');
    
    const handleSaveNotification = (data: { title: string, message: string, targetRoles: UserRole[] }) => {
        onCreateNotification(data);
        setIsFormOpen(false);
    };

    const handleViewReaders = (notification: Notification) => {
        const readers = allUsers.filter(u => notification.readBy.includes(u.id));
        setViewingReaders(readers as User[]);
        setViewingNotificationTitle(notification.title);
    };
    
    const sortedNotifications = useMemo(() => {
        return [...notifications].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notifications]);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-on-surface">Gestione Notifiche</h2>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-primary text-on-primary font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center gap-2"
                >
                    <PlusIcon />
                    Crea Notifica
                </button>
            </div>
            
            <div className="bg-surface rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titolo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatari</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Letti</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Azioni</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedNotifications.map(n => (
                            <tr key={n.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(n.createdAt).toLocaleDateString('it-IT')}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{n.title}</div>
                                    <div className="text-xs text-gray-500 max-w-xs truncate">{n.message}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-wrap gap-1">
                                        {n.targetRoles.map(r => <span key={r} className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">{r}</span>)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <button onClick={() => handleViewReaders(n)} className="text-primary hover:underline disabled:text-gray-400 disabled:no-underline" disabled={n.readBy.length === 0}>
                                        {n.readBy.length}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onDeleteNotification(n.id)} className="text-red-600 hover:text-red-800">
                                        <TrashIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Crea Nuova Notifica">
                <NotificationForm onSave={handleSaveNotification} onClose={() => setIsFormOpen(false)} />
            </Modal>
            
            <Modal isOpen={!!viewingReaders} onClose={() => setViewingReaders(null)} title={`Utenti che hanno letto: "${viewingNotificationTitle}"`}>
                {viewingReaders && (
                    <div className="max-h-96 overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                            {viewingReaders.map(user => (
                                <li key={user.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{user.role}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default NotificationManager;