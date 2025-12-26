import React, { useState, useRef, useEffect } from 'react';
import { Ticket, User, TicketStatus, UserRole, TicketReply } from '../types';

interface TicketDetailViewProps {
    user: User;
    ticket: Ticket;
    onAddReply: (ticketId: string, message: string) => void;
    onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
    onBack: () => void;
}

const ALL_STATUSES: TicketStatus[] = ['Aperto', 'In Lavorazione', 'Chiuso'];

const TicketDetailView: React.FC<TicketDetailViewProps> = ({ user, ticket, onAddReply, onUpdateStatus, onBack }) => {
    const [replyMessage, setReplyMessage] = useState('');
    const isManagerial = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket.replies]);

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyMessage.trim()) {
            onAddReply(ticket.id, replyMessage.trim());
            setReplyMessage('');
        }
    };
    
    const getStatusBadge = (status: Ticket['status']) => {
        const styles = {
            'Aperto': 'bg-blue-100 text-blue-800',
            'In Lavorazione': 'bg-yellow-100 text-yellow-800',
            'Chiuso': 'bg-gray-100 text-gray-800',
        };
        return <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex items-center mb-6">
                 <button onClick={onBack} className="text-primary hover:text-primary-dark mr-4 p-2 rounded-full hover:bg-primary-dark/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
                <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-on-surface truncate">{ticket.subject}</h2>
                    <p className="text-sm text-gray-500">Ticket #{ticket.id} creato da {ticket.userName}</p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                    {isManagerial ? (
                         <select 
                            value={ticket.status}
                            onChange={(e) => onUpdateStatus(ticket.id, e.target.value as TicketStatus)}
                            className="block w-full max-w-xs px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            {ALL_STATUSES.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    ) : getStatusBadge(ticket.status)}
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-md flex-grow flex flex-col">
                <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                    {/* Original Message */}
                    <div className="flex items-start gap-3">
                        <div className="bg-gray-200 p-2 rounded-full"><span className="text-gray-600 font-bold">{ticket.userName.charAt(0)}</span></div>
                        <div className="bg-gray-100 p-3 rounded-lg max-w-lg">
                            <p className="text-sm font-bold text-gray-800">{ticket.userName}</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                            <p className="text-xs text-gray-400 mt-1 text-right">{new Date(ticket.createdAt).toLocaleString('it-IT')}</p>
                        </div>
                    </div>
                    {/* Replies */}
                    {ticket.replies.map(reply => {
                        const isOwnMessage = reply.userId === user.id;
                        return (
                            <div key={reply.id} className={`flex items-start gap-3 ${isOwnMessage ? 'justify-end' : ''}`}>
                                {!isOwnMessage && <div className="bg-blue-200 p-2 rounded-full"><span className="text-primary font-bold">{reply.userName.charAt(0)}</span></div>}
                                <div className={`${isOwnMessage ? 'bg-primary text-on-primary' : 'bg-blue-50 text-on-surface'} p-3 rounded-lg max-w-lg`}>
                                    <p className="text-sm font-bold">{isOwnMessage ? 'Tu' : reply.userName}</p>
                                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                                    <p className={`text-xs mt-1 text-right ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(reply.createdAt).toLocaleString('it-IT')}</p>
                                </div>
                                {isOwnMessage && <div className="bg-primary-dark p-2 rounded-full"><span className="text-on-primary font-bold">{reply.userName.charAt(0)}</span></div>}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                
                {ticket.status !== 'Chiuso' && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                        <form onSubmit={handleReplySubmit} className="flex items-center gap-3">
                            <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Scrivi la tua risposta..."
                                rows={2}
                                className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                            <button type="submit" className="bg-primary text-on-primary font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 self-end">
                                Invia
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDetailView;
