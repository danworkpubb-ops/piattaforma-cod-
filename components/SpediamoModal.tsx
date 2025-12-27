import React, { useState, useEffect } from 'react';
import { Sale, Product, PlatformSettings } from '../types';
import { supabase } from '../database';

interface SpediamoModalProps {
    sale: Sale;
    product: Product;
    settings: PlatformSettings;
    onClose: () => void;
    onSuccess: (trackingCode: string) => Promise<void>;
}

const EditableField: React.FC<{ label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; maxLength?: number; type?: string }> = ({ label, value, onChange, required=false, placeholder, maxLength, type="text" }) => (
    <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-wider">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            required={required}
            placeholder={placeholder}
            maxLength={maxLength}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all font-medium"
        />
    </div>
);

const SpediamoModal: React.FC<SpediamoModalProps> = ({ sale, product, settings, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const quantity = sale.quantity || 1;

    // Sanificazione rigorosa specifica per Spediamo.it
    const cleanPhone = (p: string) => (p || '').replace(/\D/g, '').trim().substring(0, 15);
    const cleanProvince = (p: string) => (p || '').replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase().trim();
    const cleanZip = (z: string) => (z || '').replace(/\D/g, '').substring(0, 5).padStart(5, '0');
    const cleanStr = (s: string) => (s || '').trim();

    const [sender, setSender] = useState({
        name: cleanStr(settings.sender_name || 'MWS Platform'),
        company: cleanStr(settings.sender_company || ''),
        address: cleanStr(settings.sender_address || ''),
        city: cleanStr(settings.sender_city || ''),
        zip: cleanZip(settings.sender_zip || ''),
        province: cleanProvince(settings.sender_province || ''),
        phone: cleanPhone(settings.sender_phone || '3330000000'),
        email: cleanStr(settings.sender_email || 'logistica@mwsplatform.it'),
    });

    const [recipient, setRecipient] = useState({
        name: cleanStr(sale.customerName || ''),
        address: `${cleanStr(sale.customer_street_address || '')} ${cleanStr(sale.customer_house_number || '')}`.trim(),
        city: cleanStr(sale.customer_city || ''),
        zip: cleanZip(sale.customer_zip || ''),
        province: cleanProvince(sale.customer_province || ''),
        phone: cleanPhone(sale.customerPhone || ''),
        email: cleanStr(sale.customerEmail || ''),
    });

    const [pkg, setPkg] = useState({
        weight: (Number(product.weight || 0.5) * quantity).toFixed(2),
        height: (product.height || 10).toString(),
        width: (product.width || 10).toString(),
        depth: (product.depth || 10).toString(),
        content: cleanStr(product.name).substring(0, 40),
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
            const token = settings.spediamo_api_key?.trim();
            if (!token) throw new Error("Chiave API Spediamo.it non configurata nelle impostazioni.");

            // Validazione preventiva obbligatoria per Spediamo.it
            if (recipient.zip.length !== 5) throw new Error("Il CAP deve essere di 5 cifre.");
            if (recipient.province.length !== 2) throw new Error("La Provincia deve essere di 2 lettere.");
            if (!recipient.email) throw new Error("L'email del destinatario è obbligatoria per Spediamo.it.");
            if (!recipient.phone) throw new Error("Il numero di telefono del destinatario è obbligatorio.");

            const payload = {
                action: 'create-shipment',
                apiKey: token,
                payload: {
                    type: "DOMESTIC",
                    courier: "SDA",
                    cashOnDelivery: true,
                    cashOnDeliveryAmount: parseFloat(sale.saleAmount.toFixed(2)),
                    
                    // DATI MITTENTE (SENDER)
                    senderName: sender.name,
                    senderAddress: sender.address,
                    senderTown: sender.city,
                    senderPostalCode: sender.zip,
                    senderProvince: sender.province,
                    senderCountry: "IT",
                    senderPhone: sender.phone,
                    senderEmail: sender.email,
                    
                    // DATI DESTINATARIO (RECIPIENT)
                    recipientName: recipient.name,
                    recipientAddress: recipient.address,
                    recipientTown: recipient.city,
                    recipientPostalCode: recipient.zip,
                    recipientProvince: recipient.province,
                    recipientCountry: "IT",
                    recipientPhone: recipient.phone,
                    recipientMobile: recipient.phone,
                    recipientEmail: recipient.email,
                    
                    // PACCHI (PACKAGES)
                    packages: [
                        {
                            weight: parseFloat(pkg.weight) || 0.5,
                            width: parseInt(pkg.width, 10) || 10,
                            height: parseInt(pkg.height, 10) || 10,
                            length: parseInt(pkg.depth, 10) || 10,
                            description: pkg.content || "Merci varie"
                        }
                    ],
                    referenceNumber: sale.id.substring(0, 20)
                }
            };

            const { data, error: invokeError } = await supabase.functions.invoke('spediamo-proxy', {
                body: payload
            });

            if (invokeError) {
                console.error("INVOKE_ERROR:", invokeError);
                throw new Error(invokeError.message || "Errore durante l'invocazione della Edge Function.");
            }

            if (data?.status === 'error' || data?.errors || data?.error) {
                const detailedMsg = data.message || JSON.stringify(data.errors || data.error);
                throw new Error(`Spediamo.it Error: ${detailedMsg}`);
            }

            const tracking = data?.trackingNumber || data?.waybill || data?.id;
            
            if (!tracking) {
                console.warn("DEBUG_RESPONSE_MISSING_TRACKING:", data);
                throw new Error("Spedizione creata ma non è stato possibile estrarre il tracking.");
            }

            await onSuccess(tracking.toString());
            setSuccessMsg(`Spedizione creata! Tracking: ${tracking}`);
            
        } catch (err: any) {
            console.error("SHIPMENT_FLOW_ERROR:", err);
            setError(err.message || "Si è verificato un errore di comunicazione.");
        } finally {
            setIsLoading(false);
        }
    };

    if (successMsg) {
        return (
            <div className="text-center p-10 bg-white rounded-xl">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">ORDINE SPEDITO</h3>
                <p className="text-gray-600 mb-8 font-medium">{successMsg}</p>
                <button onClick={onClose} className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95">CHIUDI</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-3 custom-scrollbar p-1">
            <div className="bg-gradient-to-br from-indigo-700 to-blue-800 p-6 rounded-2xl text-white shadow-xl flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Pagamento alla Consegna (COD)</p>
                    <p className="text-4xl font-black italic">€{sale.saleAmount.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Servizio Spedizioni</p>
                    <p className="text-xl font-bold">Spediamo.it</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SEZIONE MITTENTE */}
                <div className="space-y-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner">
                    <h4 className="font-black text-gray-400 uppercase text-[10px] tracking-widest mb-4">DATI MITTENTE (RITIRO)</h4>
                    <EditableField label="Nome / Azienda" value={sender.name} onChange={v => handleFieldChange('sender', 'name', v)} />
                    <EditableField label="Indirizzo e Civico" value={sender.address} onChange={v => handleFieldChange('sender', 'address', v)} />
                    <div className="grid grid-cols-2 gap-3">
                        <EditableField label="Città" value={sender.city} onChange={v => handleFieldChange('sender', 'city', v)} />
                        <EditableField label="CAP (5 cifre)" value={sender.zip} onChange={v => handleFieldChange('sender', 'zip', v)} maxLength={5} />
                    </div>
                     <div className="grid grid-cols-2 gap-3">
                        <EditableField label="Prov. (es: RM)" value={sender.province} onChange={v => handleFieldChange('sender', 'province', v)} maxLength={2} />
                        <EditableField label="Cellulare" value={sender.phone} onChange={v => handleFieldChange('sender', 'phone', v)} />
                    </div>
                    <EditableField label="Email Mittente" value={sender.email} onChange={v => handleFieldChange('sender', 'email', v)} type="email" />
                </div>

                {/* SEZIONE DESTINATARIO */}
                <div className="space-y-4 p-5 bg-blue-50/40 rounded-2xl border border-blue-100 shadow-inner">
                    <h4 className="font-black text-blue-400 uppercase text-[10px] tracking-widest mb-4">DATI DESTINATARIO (CONSEGNA)</h4>
                    <EditableField label="Nome e Cognome Cliente" value={recipient.name} onChange={v => handleFieldChange('recipient', 'name', v)} />
                    <EditableField label="Indirizzo Completo" value={recipient.address} onChange={v => handleFieldChange('recipient', 'address', v)} />
                    <div className="grid grid-cols-2 gap-3">
                        <EditableField label="Città" value={recipient.city} onChange={v => handleFieldChange('recipient', 'city', v)} />
                        <EditableField label="CAP Destinatario" value={recipient.zip} onChange={v => handleFieldChange('recipient', 'zip', v)} maxLength={5} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <EditableField label="Provincia" value={recipient.province} onChange={v => handleFieldChange('recipient', 'province', v)} maxLength={2} />
                        <EditableField label="Cellulare Cliente" value={recipient.phone} onChange={v => handleFieldChange('recipient', 'phone', v)} />
                    </div>
                    <EditableField label="Email Destinatario" value={recipient.email} onChange={v => handleFieldChange('recipient', 'email', v)} type="email" required />
                </div>
            </div>

            <div className="p-5 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
                <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-4 text-center">DIMENSIONI E PESO PACCO</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <EditableField label="Peso (Kg)" value={pkg.weight} onChange={v => handleFieldChange('pkg', 'weight', v)} />
                     <EditableField label="Altezza (cm)" value={pkg.height} onChange={v => handleFieldChange('pkg', 'height', v)} />
                     <EditableField label="Larghezza (cm)" value={pkg.width} onChange={v => handleFieldChange('pkg', 'width', v)} />
                     <EditableField label="Profondità (cm)" value={pkg.depth} onChange={v => handleFieldChange('pkg', 'depth', v)} />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-center shadow-sm">
                    <div className="flex-shrink-0 text-red-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] text-red-800 font-black uppercase tracking-tighter">Errore di Validazione</p>
                        <p className="text-xs text-red-700 font-bold leading-tight">{error}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100">
                <button onClick={onClose} className="text-gray-400 font-black text-xs uppercase tracking-widest px-6 py-2 hover:text-gray-600 transition-colors order-2 sm:order-1">Annulla</button>
                <button 
                    onClick={handleCreateShipment} 
                    disabled={isLoading}
                    className="bg-primary text-white font-black py-4 px-12 rounded-xl shadow-xl hover:shadow-primary/40 transition-all disabled:bg-gray-300 transform active:scale-95 flex items-center justify-center gap-3 order-1 sm:order-2 min-w-[240px]"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>GENERAZIONE IN CORSO...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span>CONFERMA E SPEDISCI ORA</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SpediamoModal;