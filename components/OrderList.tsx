import React, { useMemo, useState, useEffect, useRef, useCallback, memo } from 'react';
import { Sale, SaleStatus, User, UserRole, Affiliate, PlatformSettings } from '../types';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { TruckIcon } from './icons/TruckIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SearchIcon } from './icons/SearchIcon';
import { CogIcon } from './icons/CogIcon';
import { PlusIcon } from './icons/PlusIcon';
// FIX: Added 'supabase' to the imports to resolve the "Cannot find name 'supabase'" error on line 200.
import { syncSpediamoShipments, createTestOrder, supabase } from '../database';

const OrderRow = memo(({ 
    sale, 
    isCustomerCare, 
    isAffiliate, 
    isLogistics,
    isAdmin,
    canEditStatus, 
    getStatusBadge, 
    formatDate, 
    displayAffiliateId, 
    onViewOrder, 
    onContactCustomer, 
    onShipOrder,
    canContact, 
    handleStatusChange, 
    optionsForRole,
    showOrderId 
}: any) => {
    const variantDisplay = sale.selectedVariants && sale.selectedVariants.length > 0 
    ? sale.selectedVariants.map((v: any) => v.variantName).join(', ') 
    : sale.variantName;

    const canShip = (isLogistics || isAdmin || !isAffiliate) && sale.status === 'Confermato';

    return (
        <tr className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewOrder(sale)}>
                <div className="text-sm text-gray-900">{formatDate(sale.saleDate)}</div>
            </td>
            <td className="px-6 py-4 cursor-pointer" onClick={() => onViewOrder(sale)}>
                <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={sale.productName}>
                    {sale.productName}
                </div>
                {variantDisplay && <div className="text-xs text-gray-500 truncate" title={variantDisplay}>{variantDisplay}</div>}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center cursor-pointer" onClick={() => onViewOrder(sale)}>
                <div className="text-sm font-bold text-gray-900">{sale.quantity || 1}</div>
            </td>
            
            {(isCustomerCare || isLogistics || isAdmin) && (
                <>
                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewOrder(sale)}>
                    <div className="text-sm font-semibold text-gray-900 truncate" title={sale.customerName}>{sale.customerName || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewOrder(sale)}>
                    <div className="text-sm text-gray-500">{sale.customerPhone || '-'}</div>
                </td>
                </>
            )}

            {!isAffiliate && (
                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewOrder(sale)}>
                    <div className="text-sm font-medium text-gray-900 truncate" title={sale.affiliateName}>{sale.affiliateName}</div>
                    <div className="text-xs text-gray-500 font-mono">{displayAffiliateId}</div>
                </td>
            )}

            {isAffiliate && (
                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewOrder(sale)}>
                    <div className="text-sm text-gray-500 font-mono">{sale.subId || '-'}</div>
                </td>
            )}

            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewOrder(sale)}>
                <div className="text-sm font-bold text-gray-900">€{sale.saleAmount.toFixed(2)}</div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                {canEditStatus ? (
                    <div className="flex items-center gap-2">
                        <select
                            value={sale.status}
                            onChange={(e) => handleStatusChange(sale.id, e.target.value as SaleStatus)}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs font-bold rounded-full border-0 focus:ring-2 py-1 pl-2 pr-8 cursor-pointer shadow-sm ${getStatusBadge(sale.status)}`}
                        >
                            {optionsForRole.map((status: string) => (
                                <option key={status} value={status} className="bg-white text-gray-900 font-normal">{status}</option>
                            ))}
                        </select>
                        {sale.isBonus && <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-600 text-white animate-pulse">BONUS</span>}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${getStatusBadge(sale.status)}`}>
                            {sale.status}
                        </span>
                        {sale.isBonus && <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-600 text-white">BONUS</span>}
                    </div>
                )}
            </td>

            {showOrderId && (
                <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-gray-400" onClick={() => onViewOrder(sale)}>
                    {sale.id}
                </td>
            )}

            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onViewOrder(sale); }} 
                        className="bg-blue-50 text-blue-700 font-bold text-xs py-1.5 px-3 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        Dettagli
                    </button>
                    {canShip && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); onShipOrder(sale); }} 
                            className="bg-indigo-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-1 transition-transform active:scale-95"
                        >
                            <TruckIcon className="w-3 h-3" /> Spedisci
                        </button>
                    )}
                    {canContact && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onContactCustomer(sale); }} 
                            className="bg-green-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-1 transition-transform active:scale-95"
                        >
                            <WhatsAppIcon className="w-3 h-3" /> Contatta
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

interface OrderListProps {
  sales: Sale[];
  onViewOrder: (sale: Sale) => void;
  onContactCustomer: (sale: Sale) => void;
  onManageOrder: (sale: Sale) => void;
  user: User;
  affiliates: Affiliate[];
  platformSettings: PlatformSettings;
  onOpenWhatsAppTemplateEditor: () => void;
  onRefreshData: () => Promise<void>;
  onShipOrder: (sale: Sale) => void;
  onUpdateSaleStatus: (saleId: string, status: SaleStatus) => Promise<void>;
  onUpdateSale: (sale: Sale) => Promise<void>;
}

const OrderList: React.FC<OrderListProps> = ({ 
    sales, 
    onViewOrder, 
    onContactCustomer, 
    onShipOrder,
    user, 
    affiliates, 
    platformSettings,
    onRefreshData, 
    onUpdateSaleStatus 
}) => {
  const [filters, setFilters] = useState({ searchQuery: '', statusFilter: 'all' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const filteredSales = useMemo(() => {
    let result = sales;
    if (filters.statusFilter !== 'all') {
        result = result.filter(s => s.status === filters.statusFilter);
    }
    if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        result = result.filter(s => 
            (s.customerName?.toLowerCase().includes(q)) || 
            (s.customerPhone?.includes(q)) ||
            (s.id.toLowerCase().includes(q)) ||
            (s.affiliateName?.toLowerCase().includes(q))
        );
    }
    return result;
  }, [sales, filters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshData();
    setIsRefreshing(false);
  };

  const handleCreateTest = async () => {
      // Per creare un ordine serve un prodotto reale a cui associarlo. 
      // Cerchiamo il primo prodotto attivo nel sistema.
      try {
        const { data: prods } = await supabase.from('products').select('id, name').eq('is_active', true).limit(1);
        if (!prods || prods.length === 0) {
            alert("Errore: devi prima creare almeno un prodotto attivo nel sistema per generare un ordine test.");
            return;
        }

        setIsCreatingTest(true);
        const res = await createTestOrder(prods[0].id, prods[0].name, user.id, user.name);
        
        if (res.success) {
            await onRefreshData();
            alert("Ordine di test creato con successo! Ora puoi testare il tasto 'Spedisci'.");
        } else {
            alert(`Errore creazione: ${res.error?.message}`);
        }
      } catch (e: any) {
          alert(`Errore: ${e.message}`);
      } finally {
          setIsCreatingTest(false);
      }
  };

  const handleSpediamoSync = async () => {
      if (!platformSettings.spediamo_api_key) {
          alert("Errore: Chiave API Spediamo.it non configurata nelle impostazioni.");
          return;
      }
      setIsSyncing(true);
      const res = await syncSpediamoShipments(sales, platformSettings.spediamo_api_key);
      await onRefreshData();
      setIsSyncing(false);
      alert(`Sincronizzazione completata!\nOrdini aggiornati: ${res.updated}\nErrori riscontrati: ${res.errors}`);
  };

  const getStatusBadge = (status: SaleStatus) => {
    const map: any = { 
        'Consegnato': 'bg-green-100 text-green-800', 
        'Spedito': 'bg-indigo-600 text-white', 
        'Confermato': 'bg-blue-100 text-blue-800',
        'Svincolato': 'bg-teal-100 text-teal-800',
        'In attesa': 'bg-yellow-100 text-yellow-800',
        'Contattato': 'bg-cyan-100 text-cyan-800',
        'Non raggiungibile': 'bg-amber-100 text-amber-800',
        'Giacenza': 'bg-orange-100 text-orange-800',
        'Non ritirato': 'bg-orange-100 text-orange-800',
        'Test': 'bg-purple-100 text-purple-800',
        'Cancellato': 'bg-red-100 text-red-800',
        'Annullato': 'bg-red-100 text-red-800',
        'Duplicato': 'bg-gray-200 text-gray-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const statusOptions = [
    'In attesa', 'Contattato', 'Confermato', 'Spedito', 'Svincolato', 'Consegnato', 'Cancellato', 'Annullato', 'Test', 'Duplicato', 'Giacenza', 'Non raggiungibile', 'Non ritirato'
  ];

  // LOGICA PERMESSI MODIFICA STATO
  const canEditStatusGlobal = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER || user.role === UserRole.CUSTOMER_CARE || user.role === UserRole.LOGISTICS;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-on-surface">Ordini</h2>
            <p className="text-sm text-gray-500 mt-1">Gestione vendite e spedizioni ({filteredSales.length} risultati)</p>
        </div>
        <div className="flex gap-2">
            {(user.role === UserRole.ADMIN || user.role === UserRole.LOGISTICS) && (
                 <button 
                    onClick={handleCreateTest} 
                    disabled={isCreatingTest}
                    className="flex items-center gap-2 bg-orange-600 text-white font-bold text-sm p-2 px-4 rounded-lg shadow-md hover:bg-orange-700 transition-all disabled:opacity-50"
                >
                    <PlusIcon className="w-4 h-4" />
                    {isCreatingTest ? 'Creazione...' : 'Crea Ordine Test'}
                </button>
            )}
            {platformSettings.spediamo_api_key && (user.role === UserRole.ADMIN || user.role === UserRole.LOGISTICS) && (
                 <button 
                    onClick={handleSpediamoSync} 
                    disabled={isSyncing} 
                    className="flex items-center gap-2 bg-indigo-50 p-2 px-4 rounded-lg shadow-sm hover:bg-indigo-100 border border-indigo-200 transition-all disabled:opacity-50 font-bold text-sm text-indigo-700"
                >
                    <TruckIcon className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} /> 
                    {isSyncing ? 'Sincronizzando Spediamo...' : 'Sincronizza Stati Spediamo'}
                </button>
            )}
            <button 
                onClick={handleRefresh} 
                disabled={isRefreshing} 
                className="flex items-center gap-2 bg-surface p-2 px-4 rounded-lg shadow-sm hover:bg-gray-50 border border-gray-200 transition-all disabled:opacity-50 font-bold text-sm text-primary"
            >
                <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} /> 
                {isRefreshing ? 'Sincronizzazione...' : 'Aggiorna Dati'}
            </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="Cerca cliente, telefono, ID o partner..." 
                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" 
                    onChange={(e) => setFilters(f => ({...f, searchQuery: e.target.value}))} 
                />
                <SearchIcon className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            </div>
            <select 
                className="p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none font-bold text-sm text-gray-700 shadow-sm" 
                value={filters.statusFilter}
                onChange={(e) => setFilters(f => ({...f, statusFilter: e.target.value}))}
            >
                <option value="all">Tutti gli stati</option>
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prodotto</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Q.tà</th>
                        {(user.role === UserRole.CUSTOMER_CARE || user.role === UserRole.LOGISTICS || user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && (
                            <>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Telefono</th>
                            </>
                        )}
                        {user.role !== UserRole.AFFILIATE && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Partner</th>}
                        {user.role === UserRole.AFFILIATE && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sub ID</th>}
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Totale</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stato</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Azioni</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map(sale => {
                        const affiliateInfo = affiliates.find(a => a.id === sale.affiliateId);
                        const displayAffId = affiliateInfo?.short_id || affiliateInfo?.id || sale.affiliateId;
                        
                        return (
                            <OrderRow 
                                key={sale.id}
                                sale={sale}
                                isAffiliate={user.role === UserRole.AFFILIATE}
                                isCustomerCare={user.role === UserRole.CUSTOMER_CARE}
                                isLogistics={user.role === UserRole.LOGISTICS}
                                isAdmin={user.role === UserRole.ADMIN}
                                canEditStatus={canEditStatusGlobal}
                                getStatusBadge={getStatusBadge}
                                formatDate={(d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                handleStatusChange={onUpdateSaleStatus}
                                optionsForRole={statusOptions}
                                onViewOrder={onViewOrder}
                                onContactCustomer={onContactCustomer}
                                onShipOrder={onShipOrder}
                                canContact={user.role === UserRole.CUSTOMER_CARE || user.role === UserRole.ADMIN || user.role === UserRole.MANAGER}
                                displayAffiliateId={displayAffId}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>

        {filteredSales.length === 0 && (
            <div className="p-20 text-center text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="mt-4 text-lg font-medium">Nessun ordine trovato.</p>
                <button onClick={handleRefresh} className="mt-2 text-primary font-bold hover:underline">Sincronizza per aggiornare la lista</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default memo(OrderList);