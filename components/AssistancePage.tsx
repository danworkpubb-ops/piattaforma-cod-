import React, { useState, useMemo } from 'react';
import { Ticket, User, UserRole } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface AssistancePageProps {
    user: User;
    tickets: Ticket[];
    onOpenNewTicket: () => void;
    onViewTicket: (ticket: Ticket) => void;
}

const AssistancePage: React.FC<AssistancePageProps> = ({ user, tickets, onOpenNewTicket, onViewTicket }) => {
    const isManagerial = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

    const [activeTab, setActiveTab] = useState<'Aperto' | 'In Lavorazione' | 'Chiuso'>('Aperto');

    const filteredTickets = useMemo(() => {
        let relevantTickets = tickets;
        
        if (user.role === UserRole.ADMIN) {
            // Admin sees all tickets
            relevantTickets = tickets;
        } else if (user.role === UserRole.MANAGER) {
            // Manager sees tickets from affiliates and themselves
            relevantTickets = tickets.filter(t => t.userRole === UserRole.AFFILIATE || t.userId === user.id);
        } else {
            // Other users see only their own tickets
            relevantTickets = tickets.filter(t => t.userId === user.id);
        }

        if(isManagerial) {
            return relevantTickets.filter(t => t.status === activeTab);
        }

        return relevantTickets.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    }, [tickets, user, isManagerial, activeTab]);

    const getStatusBadge = (status: Ticket['status']) => {
        const styles = {
            'Aperto': 'bg-blue-100 text-blue-800',
            'In Lavorazione': 'bg-yellow-100 text-yellow-800',
            'Chiuso': 'bg-gray-100 text-gray-800',
        };
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    const tabs: Ticket['status'][] = ['Aperto', 'In Lavorazione', 'Chiuso'];

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-on-surface">Assistenza Ticket</h2>
                {!isManagerial && (
                    <button
                        onClick={onOpenNewTicket}
                        className="bg-primary text-on-primary font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center gap-2"
                    >
                        <PlusIcon />
                        Apri Ticket
                    </button>
                )}
            </div>
            
            <div className="bg-surface rounded-xl shadow-md overflow-hidden">
                {isManagerial && (
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex gap-6 px-6" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                )}
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ultimo Aggiornamento</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oggetto</th>
                                {isManagerial && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utente</th>}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Ticket</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewTicket(ticket)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(ticket.updatedAt).toLocaleString('it-IT')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.subject}</td>
                                    {isManagerial && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.userName}</td>}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(ticket.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{ticket.id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTickets.length === 0 && (
                        <p className="text-center text-gray-500 py-12">Nessun ticket in questa sezione.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssistancePage;
