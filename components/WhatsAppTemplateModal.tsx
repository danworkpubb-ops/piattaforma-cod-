import React, { useState } from 'react';

interface WhatsAppTemplateModalProps {
    template: string;
    onSave: (template: string) => void;
    onClose: () => void;
}

const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({ template, onSave, onClose }) => {
    const [editedTemplate, setEditedTemplate] = useState(template);

    const handleSave = () => {
        onSave(editedTemplate);
    };

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="whatsapp-template" className="block text-sm font-medium text-gray-700">
                    Template Messaggio
                </label>
                <textarea
                    id="whatsapp-template"
                    value={editedTemplate}
                    onChange={(e) => setEditedTemplate(e.target.value)}
                    rows={5}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-semibold text-blue-800">Placeholder Disponibili:</h4>
                <p className="text-xs text-blue-700 mt-1">
                    Usa queste variabili nel testo, verranno sostituite automaticamente.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-blue-700">
                    <li><code className="bg-blue-200 px-1 rounded">{'{customerName}'}</code> - Nome e Cognome del cliente</li>
                    <li><code className="bg-blue-200 px-1 rounded">{'{productName}'}</code> - Nome del prodotto acquistato</li>
                    <li><code className="bg-blue-200 px-1 rounded">{'{saleAmount}'}</code> - Importo totale dell'ordine</li>
                </ul>
            </div>
            <div className="mt-8 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                    Annulla
                </button>
                <button type="button" onClick={handleSave} className="bg-primary text-on-primary font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200">
                    Salva Messaggio
                </button>
            </div>
        </div>
    );
};

export default WhatsAppTemplateModal;
