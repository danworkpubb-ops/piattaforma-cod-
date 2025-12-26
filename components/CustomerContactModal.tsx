import React, { useState, useEffect, useMemo } from 'react';
import { Sale, User, UserRole, SaleStatus, Product, ContactHistoryItem, ContactAction } from '../types';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface CustomerContactModalProps {
  sale: Sale;
  template: string;
  user: User;
  products: Product[];
  onUpdate: (saleId: string, newStatus: SaleStatus, notes: string) => void;
  onUpdateAddress: (saleId: string, addressParts: { street: string; houseNumber: string; city: string; province: string; zip: string; }) => Promise<void>;
  onUpdateNotes: (saleId: string, notes: string) => Promise<void>;
  onLogContact: (saleId: string, historyItem: ContactHistoryItem) => Promise<void>;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || '-'}</dd>
    </div>
);

const CustomerContactModal: React.FC<CustomerContactModalProps> = ({ sale, template, user, products, onUpdate, onUpdateAddress, onUpdateNotes, onLogContact, onClose }) => {
  const [notes, setNotes] = useState(sale.notes || '');
  const [address, setAddress] = useState({
    street: sale.customer_street_address || '',
    houseNumber: sale.customer_house_number || '',
    city: sale.customer_city || '',
    province: sale.customer_province || '',
    zip: sale.customer_zip || '',
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const isCustomerCare = user.role === UserRole.CUSTOMER_CARE;

  // State for Giacenza feature
  const [selectedGiacenzaOption, setSelectedGiacenzaOption] = useState<'redelivery' | 'pickup' | 'find_depot'>('redelivery');
  const [giacenzaMessage, setGiacenzaMessage] = useState('');

  const handleAddressFieldChange = (field: keyof typeof address, value: string) => {
    setAddress(prev => ({...prev, [field]: value}));
  };

  const getCleanedPhone = (phone: string | undefined): string => {
    if (!phone) return '';
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10 && cleanedPhone.startsWith('3')) {
        cleanedPhone = `39${cleanedPhone}`;
    }
    return cleanedPhone;
  };

  const product = products.find(p => p.id === sale.productId);
  let finalAmountText = `€${sale.saleAmount.toFixed(2)}`;

  if (product && !product.freeShipping && (product.shippingCharge || 0) > 0) {
    const shippingCharge = product.shippingCharge || 0;
    const productPrice = sale.saleAmount - shippingCharge;
    finalAmountText = `€${productPrice.toFixed(2)} (prodotto) + €${shippingCharge.toFixed(2)} (spedizione), per un totale di €${sale.saleAmount.toFixed(2)}`;
  }
  
  const welcomeMessage = template
    .replace('{customerName}', sale.customerName || 'Cliente')
    .replace('{productName}', sale.productName || 'il tuo prodotto')
    .replace('{saleAmount}', finalAmountText);

  useEffect(() => {
    if (sale.status === 'Giacenza') {
        let message = '';
        const customer = sale.customerName || 'Cliente';
        const tracking = sale.trackingCode || '[CODICE SPEDIZIONE]';

        switch (selectedGiacenzaOption) {
            case 'redelivery':
                message = `Ciao ${customer},\n\nti informiamo che il corriere non è riuscito a consegnare il tuo ordine oggi.\n\nNon preoccuparti, verrà effettuato un nuovo tentativo di consegna domani.\n\nTi ricordiamo che l'importo da saldare al corriere è di €${sale.saleAmount.toFixed(2)}.\n\nAssicurati di essere reperibile.\nGrazie.`;
                break;
            case 'pickup':
                message = `Ciao ${customer},\n\nIl tuo ordine è in giacenza presso la sede del corriere.\n\nHai 5 giorni per ritirarlo di persona.\n\nTrovi la sede e gli orari qui:\nSito: *https://spediamo.it/*\nCodice Tracciamento: *${tracking}*\n\nProcedi al più presto per evitare il reso.\n\nGrazie.`;
                break;
            case 'find_depot':
                message = `Ciao ${customer},\n\nIl tuo ordine è in giacenza.\n\nPer trovare la sede del ritiro, usa questi dati sul sito del corriere:\n\nSito: *https://spediamo.it/*\nCodice di Spedizione: *${tracking}*`;
                break;
        }
        setGiacenzaMessage(message);
    }
  }, [sale, products, selectedGiacenzaOption]);
    
  const messageToSend = sale.status === 'Giacenza' ? giacenzaMessage : welcomeMessage;
  const encodedMessage = encodeURIComponent(messageToSend);
  const cleanedPhone = getCleanedPhone(sale.customerPhone);
  const whatsappLink = `https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`;

  const handleStatusUpdate = (newStatus: SaleStatus) => {
    onUpdate(sale.id, newStatus, notes);
    onClose();
  };
  
  const handleContactClick = async () => {
    let action: ContactAction;
    if (sale.status === 'Giacenza') {
        action = `giacenza_${selectedGiacenzaOption}` as ContactAction;
    } else {
        action = 'welcome_message';
    }
    
    const newHistoryItem: ContactHistoryItem = {
        id: `c_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        action: action,
        message: messageToSend,
    };
    
    await onLogContact(sale.id, newHistoryItem);

    const width = 600;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const windowFeatures = `popup,width=${width},height=${height},top=${top},left=${left}`;
    window.open(whatsappLink, 'whatsapp_popup', windowFeatures);
  };

  const handleAddressUpdate = async () => {
    setIsSavingAddress(true);
    await onUpdateAddress(sale.id, address);
    setIsSavingAddress(false);
  };

  const handleNotesUpdate = async () => {
      setIsSavingNotes(true);
      await onUpdateNotes(sale.id, notes);
      setIsSavingNotes(false);
  };
  
  const getActionLabel = (action: ContactAction): string => {
    const labels: Record<ContactAction, string> = {
        'welcome_message': 'Messaggio di Benvenuto',
        'giacenza_redelivery': 'Giacenza - Nuova Consegna',
        'giacenza_pickup': 'Giacenza - Ritiro in Sede',
        'giacenza_find_depot': 'Giacenza - Trova Sede',
    };
    return labels[action] || 'Azione Sconosciuta';
  }

  const renderGiacenzaUI = () => (
    <>
        <div>
            <h3 className="text-lg leading-6 font-bold text-primary mb-2">Gestione Ordine in Giacenza</h3>
            <p className="text-sm text-gray-600 mb-4">Seleziona il tipo di comunicazione da inviare al cliente.</p>
            <div className="space-y-3">
                <label className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="giacenzaOption" value="redelivery" checked={selectedGiacenzaOption === 'redelivery'} onChange={() => setSelectedGiacenzaOption('redelivery')} className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                    <span className="font-semibold text-gray-800">Informa di nuova consegna</span>
                    <p className="text-xs text-gray-500 pl-6">Comunica al cliente che il corriere tenterà una nuova consegna il giorno successivo.</p>
                </label>
                <label className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="giacenzaOption" value="pickup" checked={selectedGiacenzaOption === 'pickup'} onChange={() => setSelectedGiacenzaOption('pickup')} className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                    <span className="font-semibold text-gray-800">Invita al ritiro in sede</span>
                    <p className="text-xs text-gray-500 pl-6">Informa che ha 5 giorni per ritirare l'ordine personalmente.</p>
                </label>
                 <label className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="giacenzaOption" value="find_depot" checked={selectedGiacenzaOption === 'find_depot'} onChange={() => setSelectedGiacenzaOption('find_depot')} className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                    <span className="font-semibold text-gray-800">Fornisci codice per trovare la sede</span>
                    <p className="text-xs text-gray-500 pl-6">Invia il codice di spedizione per permettere al cliente di localizzare il deposito.</p>
                </label>
            </div>
        </div>
        <div>
            <h3 className="text-base leading-6 font-semibold text-gray-800 mb-2">Anteprima Messaggio</h3>
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{giacenzaMessage}</p>
            </div>
        </div>
    </>
  );

  const renderWelcomeUI = () => (
    <>
        <div>
            <h3 className="text-lg leading-6 font-bold text-primary mb-2">Dati Cliente</h3>
            <div className="space-y-4">
                <DetailRow label="Nome" value={sale.customerName} />
                <DetailRow label="Telefono" value={sale.customerPhone} />
                <DetailRow label="Email" value={sale.customerEmail} />
                {isCustomerCare && (
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Indirizzo Cliente</label>
                        <div className="mt-1 space-y-2">
                            <input type="text" value={address.street} onChange={e => handleAddressFieldChange('street', e.target.value)} placeholder="Indirizzo (Via, Piazza, ecc.)" className="block w-full input-style" />
                            <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={address.houseNumber} onChange={e => handleAddressFieldChange('houseNumber', e.target.value)} placeholder="N. Civico" className="block w-full input-style" />
                            <input type="text" value={address.zip} onChange={e => handleAddressFieldChange('zip', e.target.value)} placeholder="CAP" className="block w-full input-style" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={address.city} onChange={e => handleAddressFieldChange('city', e.target.value)} placeholder="Città" className="block w-full input-style" />
                                <input type="text" value={address.province} onChange={e => handleAddressFieldChange('province', e.target.value)} placeholder="Provincia (sigla)" maxLength={2} className="block w-full input-style" />
                            </div>
                        </div>
                        <button
                            onClick={handleAddressUpdate}
                            disabled={isSavingAddress}
                            className="mt-2 bg-secondary text-primary font-bold py-1 px-3 text-sm rounded-lg hover:bg-secondary-light transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isSavingAddress ? 'Salvataggio...' : 'Aggiorna Indirizzo'}
                        </button>
                    </div>
                )}
            </div>
        </div>
        <div>
            <h3 className="text-lg leading-6 font-bold text-primary mb-2">Messaggio di Benvenuto</h3>
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{welcomeMessage}</p>
            </div>
        </div>
    </>
  );

  return (
    <div className="p-2 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
      {sale.status === 'Giacenza' ? renderGiacenzaUI() : renderWelcomeUI()}
      
      <div className="pt-4 text-center">
        <button
          onClick={handleContactClick}
          className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          <WhatsAppIcon className="w-6 h-6" />
          <span>Contatta su WhatsApp</span>
        </button>
      </div>

      {(sale.contactHistory && sale.contactHistory.length > 0) && (
        <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg leading-6 font-bold text-primary mb-2">Cronologia Contatti</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {sale.contactHistory.map(item => (
                    <div key={item.id} className="p-2 bg-gray-50 border rounded-md">
                        <p className="text-xs text-gray-500">
                            <span className="font-semibold">{new Date(item.timestamp).toLocaleString('it-IT')}</span> -
                            <span className="font-bold text-gray-700"> {item.userName}</span> ha inviato:
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">{getActionLabel(item.action)}</p>
                    </div>
                )).reverse()}
            </div>
        </div>
      )}

      {isCustomerCare && (
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg leading-6 font-bold text-primary mb-2">
            Aggiorna Stato Ordine e Note
          </h3>
          
          <div>
            <label htmlFor="contact-notes" className="block text-sm font-medium text-gray-700">Note</label>
            <div className="mt-1 flex items-start gap-2">
                <textarea
                    id="contact-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full input-style"
                    placeholder="Aggiungi note per la logistica..."
                />
                <button
                    onClick={handleNotesUpdate}
                    disabled={isSavingNotes}
                    className="bg-secondary text-primary font-bold py-2 px-3 rounded-lg hover:bg-secondary-light transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0 self-start"
                    title="Aggiorna note"
                >
                    {isSavingNotes ? '...' : 'Aggiorna'}
                </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 my-4">
            Dopo aver contattato il cliente, imposta lo stato della conversazione.
            <br/>
            <span className="font-semibold">Nota:</span> Cliccando uno stato, verranno salvate anche le note correnti.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleStatusUpdate('Confermato')}
              className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Confermato
            </button>
            <button
              onClick={() => handleStatusUpdate('Contattato')}
              className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors duration-200"
            >
              Contattato
            </button>
            <button
              onClick={() => handleStatusUpdate('Cancellato')}
              className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Cancellato
            </button>
            <button onClick={() => handleStatusUpdate('Non raggiungibile')} className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-200">Non Raggiungibile</button>
          </div>
        </div>
      )}
       <style>{`.input-style { px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm }`}</style>
    </div>
  );
};

export default CustomerContactModal;