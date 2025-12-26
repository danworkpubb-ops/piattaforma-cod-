import React, { useState } from 'react';

interface TicketFormProps {
    onCreate: (data: { subject: string, message: string }) => void;
    onClose: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ onCreate, onClose }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (subject.trim() && message.trim()) {
            onCreate({ subject, message });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Oggetto</label>
                <input 
                    type="text" 
                    id="subject" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    required 
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Messaggio</label>
                <textarea 
                    id="message" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    required 
                    rows={6} 
                    placeholder="Descrivi il tuo problema nel dettaglio..."
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
                />
            </div>
             <div className="mt-8 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                    Annulla
                </button>
                <button type="submit" className="bg-primary text-on-primary font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200">
                    Invia Ticket
                </button>
            </div>
        </form>
    );
};

export default TicketForm;
