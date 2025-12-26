import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Notification } from '../types';
import { BellIcon } from './icons/BellIcon';

interface NotificationBellProps {
    user: User;
    notifications: Notification[];
    onMarkAsRead: (notificationId: string) => void;
    onMarkAllAsRead: () => void;
    onViewNotification: (notification: Notification) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ user, notifications, onMarkAsRead, onMarkAllAsRead, onViewNotification }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.readBy.includes(user.id)).length;
    }, [notifications, user.id]);

    const handleToggle = () => setIsOpen(prev => !prev);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleToggle} className="relative text-gray-500 hover:text-primary transition-colors">
                <BellIcon className="w-7 h-7" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl shadow-2xl border border-gray-200 z-30">
                    <div className="p-3 flex justify-between items-center border-b">
                        <h4 className="font-bold text-on-surface">Notifiche</h4>
                        {unreadCount > 0 && (
                            <button onClick={onMarkAllAsRead} className="text-xs font-semibold text-primary hover:underline">
                                Segna tutte come lette
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => {
                                const isRead = notification.readBy.includes(user.id);
                                return (
                                    <button
                                        key={notification.id}
                                        onClick={() => onViewNotification(notification)}
                                        className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-gray-50 ${!isRead ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <p className="font-bold text-sm text-on-surface">{notification.title}</p>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                            </div>
                                            {!isRead && (
                                                <div 
                                                    className="flex-shrink-0 w-2 h-2 mt-1 bg-primary rounded-full"
                                                    title="Non letta"
                                                ></div>
                                            )}
                                        </div>
                                        <p className="text-right text-xs text-gray-400 mt-2">{timeAgo(notification.createdAt)}</p>
                                    </button>
                                );
                            })
                        ) : (
                            <p className="p-4 text-center text-sm text-gray-500">Nessuna notifica.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;