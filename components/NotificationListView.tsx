import React from 'react';
import { Notification, User } from '../types';

interface NotificationListViewProps {
    user: User;
    notifications: Notification[];
    onViewNotification: (notification: Notification) => void;
}

const NotificationListView: React.FC<NotificationListViewProps> = ({ user, notifications, onViewNotification }) => {
    
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " anni fa";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " mesi fa";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " giorni fa";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " ore fa";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minuti fa";
        return "Pochi secondi fa";
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-on-surface">Le Tue Notifiche</h2>
            </div>

            <div className="bg-surface rounded-xl shadow-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {notifications.length > 0 ? (
                        notifications.map(notification => {
                            const isRead = notification.readBy.includes(user.id);
                            return (
                                <li key={notification.id}>
                                    <button
                                        onClick={() => onViewNotification(notification)}
                                        className={`w-full text-left p-4 sm:p-6 hover:bg-gray-50 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out ${!isRead ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-3">
                                                    {!isRead && (
                                                        <div 
                                                            className="flex-shrink-0 w-2.5 h-2.5 bg-primary rounded-full"
                                                            title="Non letta"
                                                        ></div>
                                                    )}
                                                    <p className="font-bold text-base text-on-surface truncate">{notification.title}</p>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                            </div>
                                            <p className="text-sm text-gray-500 flex-shrink-0 whitespace-nowrap">{timeAgo(notification.createdAt)}</p>
                                        </div>
                                    </button>
                                </li>
                            );
                        })
                    ) : (
                         <li className="p-6 text-center text-sm text-gray-500">
                            Non hai nessuna notifica al momento.
                         </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default NotificationListView;