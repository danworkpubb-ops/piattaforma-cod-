import React, { useState, useEffect } from 'react';
import { Notification, User } from '../types';
import { InfoIcon } from './icons/InfoIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface NotificationPopupHostProps {
    user: User;
    notifications: Notification[];
    onViewNotification: (notification: Notification) => void;
}

const NotificationPopup: React.FC<{ popup: Notification; onDismiss: (id: string) => void; onView: (popup: Notification) => void; }> = ({ popup, onDismiss, onView }) => {
    const isNewProduct = popup.eventType === 'new-product';
    const bgColor = isNewProduct ? 'bg-green-50' : 'bg-yellow-50';
    const iconColor = isNewProduct ? 'text-green-500' : 'text-yellow-500';
    const borderColor = isNewProduct ? 'border-green-200' : 'border-yellow-200';

    return (
        <button
            onClick={() => onView(popup)}
            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-xl"
        >
            <div 
                className={`w-full max-w-sm rounded-xl shadow-lg p-4 border ${bgColor} ${borderColor} animate-slide-in-right flex items-start gap-3`}
                role="alert"
            >
                <div className={`flex-shrink-0 ${iconColor}`}>
                    <InfoIcon className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                    <p className="font-bold text-sm text-on-surface">{popup.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{popup.message}</p>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // Prevents triggering the parent button's onClick
                        onDismiss(popup.id);
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                    aria-label="Chiudi notifica"
                >
                    <XCircleIcon className="w-5 h-5" />
                </button>
            </div>
        </button>
    );
};

const NotificationPopupHost: React.FC<NotificationPopupHostProps> = ({ user, notifications, onViewNotification }) => {
    const [visiblePopups, setVisiblePopups] = useState<Notification[]>([]);
    const [shownPopupIds, setShownPopupIds] = useState(new Set<string>());

    useEffect(() => {
        // Find notifications that are meant to be popups, haven't been shown yet, and are unread.
        const newPopups = notifications
            .filter(n => (n.eventType === 'new-product' || n.eventType === 'product-deactivated'))
            .filter(n => !shownPopupIds.has(n.id))
            .filter(n => !n.readBy.includes(user.id));

        if (newPopups.length > 0) {
            // Add new popups to the visible list
            setVisiblePopups(prev => [...newPopups, ...prev]);
            
            // Mark them as shown to prevent re-triggering
            setShownPopupIds(prev => {
                const newSet = new Set(prev);
                newPopups.forEach(n => newSet.add(n.id));
                return newSet;
            });
        }
    }, [notifications, shownPopupIds, user.id]);
    
    // Auto-dismiss functionality
    useEffect(() => {
        if (visiblePopups.length > 0) {
            const lastPopup = visiblePopups[visiblePopups.length - 1];
            const timer = setTimeout(() => {
                handleDismiss(lastPopup.id);
            }, 7000); // Popup dismisses after 7 seconds
            return () => clearTimeout(timer);
        }
    }, [visiblePopups]);


    const handleDismiss = (id: string) => {
        setVisiblePopups(prev => prev.filter(p => p.id !== id));
    };
    
    const handleView = (notification: Notification) => {
        handleDismiss(notification.id); // Dismiss the popup when it's clicked
        onViewNotification(notification);
    }

    if (visiblePopups.length === 0) {
        return null;
    }

    return (
        <>
            <style>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
                }
            `}</style>
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3" aria-live="polite">
                {visiblePopups.map(popup => (
                    <NotificationPopup key={popup.id} popup={popup} onDismiss={handleDismiss} onView={handleView} />
                ))}
            </div>
        </>
    );
};

export default NotificationPopupHost;