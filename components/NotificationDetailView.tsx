import React from 'react';
import { Notification } from '../types';

interface NotificationDetailViewProps {
    notification: Notification;
    onBack: () => void;
    onNavigateToLink: (link: string) => void;
}

const NotificationDetailView: React.FC<NotificationDetailViewProps> = ({ notification, onBack, onNavigateToLink }) => {

    const getLinkText = () => {
        if (!notification.linkTo) return '';
        const [view] = notification.linkTo.split('/');
        switch(view) {
            case 'product-detail':
                return 'Vedi Dettagli Prodotto';
            default:
                return 'Vedi Dettagli';
        }
    }

    return (
        <div className="p-8">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="text-primary hover:text-primary-dark mr-4 p-2 rounded-full hover:bg-primary-dark/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
                <h2 className="text-3xl font-bold text-on-surface">Dettaglio Notifica</h2>
            </div>
            <div className="bg-surface rounded-xl shadow-md p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-xl font-bold text-on-surface">{notification.title}</h3>
                    <p className="text-sm text-gray-500 flex-shrink-0 sm:ml-4 mt-2 sm:mt-0">{new Date(notification.createdAt).toLocaleString('it-IT', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    <p>{notification.message}</p>
                </div>
                {notification.linkTo && (
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <button 
                            onClick={() => onNavigateToLink(notification.linkTo!)}
                            className="bg-primary text-on-primary font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200"
                        >
                            {getLinkText()}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDetailView;
