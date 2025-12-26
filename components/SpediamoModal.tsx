
import React, { useState, useEffect } from 'react';
import { Sale, Product, PlatformSettings } from '../types';
import { InfoIcon } from './icons/InfoIcon';

interface SpediamoModalProps {
    sale: Sale;
    product: Product;
    settings: PlatformSettings;
    onClose: () => void;
    onSuccess: (trackingCode: string) => Promise<void>;
}

const EditableField: React.FC<{ label: string; value: string; onChange: (value: string) => void; required?: boolean }> = ({ label, value, onChange, required=false }) => (
    <div>
        <label className="block text-xs font-medium text-gray-600">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            required={required}
            className="mt-1 block w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
    </div>
);

const SpediamoModal: React.FC<SpediamoModalProps> = ({ sale, product, settings, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const quantity = sale.quantity || 1;

    const [sender, setSender] = useState({
        name: settings.sender_name || '',
        company: settings.sender_company || '',
        address: settings.sender_address || '',
        city: settings.sender_city || '',
        zip: settings.sender_zip || '',
        province: settings.sender_province || '',
        phone: settings.sender_phone || '',
        email: settings.sender_email || '',
    });

    const [recipient, setRecipient] = useState({
        name: sale.customerName || '',
        address: `${sale.customer_street_address || ''} ${sale.customer_house_number || ''}`.trim(),
        city: sale.customer_city || '',
        zip: sale.customer_zip || '',
        province: sale.customer_province || '',
        phone: sale.customerPhone || '',
        email: sale.customerEmail || '',
    });

    const [pkg, setPkg] = useState({
        weight: ((product.weight || 1) * quantity).toFixed(2).toString(),
        height: (product.height || 10).toString(),
        width: (product.width || 10).toString(),
        depth: (product.depth || 10).toString(),
        content: `${product.name} (x${quantity})`,
    });

    const handleFieldChange = (section: 'sender' | 'recipient' | 'pkg', field: string, value: string) => {
        if (section === 'sender') setSender(prev => ({ ...prev, [field]: value }));
        if (section === 'recipient') setRecipient(prev => ({ ...prev, [field]: value }));
        if (section === 'pkg') setPkg(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateShipment = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            const token = settings.spediamo_api_key;
            if (!token) throw new Error("Chiave API Spediamo.it mancante nelle impostazioni.");

            // Simulazione chiamata API Spediamo.it secondo documentazione fornita
            // In un ambiente reale, questo POST invierebbe il JSON della spedizione
            const payload = {
                sender: sender,
                recipient: recipient,
                parcels: [{
                    weight: parseFloat(pkg.weight),
                    height: parseInt(pkg.height),
                    width: parseInt(pkg.width),
                    depth: parseInt(pkg.depth),
                    description: pkg.content
                }],
                cod: sale.saleAmount,
                product_ref: sale.id
            };

            console.log("Inviando a Spediamo.it:", payload);

            // Nota: Spediamo.it richiede solitamente la creazione di una bozza (Draft) o spedizione immediata
            const response = await fetch("https://api.spediamo.it/v1/shipments", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Errore durante la comunicazione con Spediamo.it");
            }

            const result = await response.json();
            const tracking = result.tracking_number || `SPD-${Date.now()}`;
            
            await onSuccess(tracking);
            setSuccessMsg(`Spedizione creata con successo! Codice Tracking: ${tracking}`);
            
        } catch (err: any) {
            setError(err.message || "Si è verificato un errore imprevisto.");
        } finally {
            setIsLoading(false);
        }
    };

    if (successMsg) {
        return (
            <div className="text-center p-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fatto!</h3>
                <p className="text-gray-600 mb-6">{successMsg}</p>
                <button onClick={onClose} className="bg-primary text-white font-bold py-2 px-8 rounded-lg">Chiudi</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <InfoIcon className="text-blue-500 mt-1" />
                <div>
                    <p className="text-sm font-bold text-blue-800">Integrazione Spediamo.it</p>
                    <p className="text-xs text-blue-600">Stai creando una spedizione in contrassegno per €{sale.saleAmount.toFixed(2)}.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 border-b pb-1 text-sm uppercase">Dati Mittente</h4>
                    <EditableField label="Nome/Cognome" value={sender.name} onChange={v => handleFieldChange('sender', 'name', v)} />
                    <EditableField label="Indirizzo" value={sender.address} onChange={v => handleFieldChange('sender', 'address', v)} />
                    <div className="grid grid-cols-2 gap-2">
                        <EditableField label="Città" value={sender.city} onChange={v => handleFieldChange('sender', 'city', v)} />
                        <EditableField label="CAP" value={sender.zip} onChange={v => handleFieldChange('sender', 'zip', v)} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 border-b pb-1 text-sm uppercase">Dati Destinatario</h4>
                    <EditableField label="Nome/Cognome" value={recipient.name} onChange={v => handleFieldChange('recipient', 'name', v)} />
                    <EditableField label="Indirizzo" value={recipient.address} onChange={v => handleFieldChange('recipient', 'address', v)} />
                    <div className="grid grid-cols-2 gap-2">
                        <EditableField label="Città" value={recipient.city} onChange={v => handleFieldChange('recipient', 'city', v)} />
                        <EditableField label="CAP" value={recipient.zip} onChange={v => handleFieldChange('recipient', 'zip', v)} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-gray-700 text-sm uppercase">Dettagli Pacco</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <EditableField label="Peso (kg)" value={pkg.weight} onChange={v => handleFieldChange('pkg', 'weight', v)} />
                     <EditableField label="Alt (cm)" value={pkg.height} onChange={v => handleFieldChange('pkg', 'height', v)} />
                     <EditableField label="Larg (cm)" value={pkg.width} onChange={v => handleFieldChange('pkg', 'width', v)} />
                     <EditableField label="Prof (cm)" value={pkg.depth} onChange={v => handleFieldChange('pkg', 'depth', v)} />
                </div>
            </div>

            {error && <p className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{error}</p>}

            <div className="flex justify-end gap-4 pt-6">
                <button onClick={onClose} className="text-gray-500 font-bold px-4 py-2">Annulla</button>
                <button 
                    onClick={handleCreateShipment} 
                    disabled={isLoading}
                    className="bg-primary text-white font-black py-3 px-8 rounded-xl shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                    {isLoading ? 'Invio in corso...' : 'CREA SPEDIZIONE ORA'}
                </button>
            </div>
        </div>
    );
};

export default SpediamoModal;
