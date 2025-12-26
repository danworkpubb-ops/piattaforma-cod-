
import React, { useState, useMemo } from 'react';
import { Sale, Product, Affiliate, User, UserRole, SaleStatus, StockExpense } from '../types';
import SalesChart from './SalesChart';
import { RefreshIcon } from './icons/RefreshIcon';
import { SearchIcon } from './icons/SearchIcon';
import SearchableSelect from './SearchableSelect';

const StatCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
    <div className="bg-surface p-6 rounded-xl shadow-md flex flex-col border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
        <p className={`text-3xl font-black mt-2 ${color}`}>{value}</p>
    </div>
);

type TimePeriod = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'all';

const getPeriodRange = (period: TimePeriod): [Date, Date] | null => {
    if (period === 'all') return null;
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);

    switch (period) {
        case 'yesterday': 
            start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); 
            break;
        case 'this_week':
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff); end.setDate(start.getDate() + 6);
            break;
        case 'this_month': 
            start.setDate(1); end.setMonth(now.getMonth() + 1); end.setDate(0); 
            break;
        case 'last_month':
            start.setMonth(now.getMonth() - 1); start.setDate(1);
            end.setMonth(now.getMonth()); end.setDate(0);
            break;
    }
    return [start, end];
};

interface PerformanceProps {
    user: User;
    sales: Sale[];
    products: Product[];
    affiliates: Affiliate[];
    stockExpenses: StockExpense[];
    onRefreshData: () => Promise<void>;
}

const Performance: React.FC<PerformanceProps> = ({ user, sales, products, onRefreshData }) => {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_month');
    const [selectedProductId, setSelectedProductId] = useState<string>('all');
    const [searchSubId, setSearchSubId] = useState<string>('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isAffiliate = user.role === UserRole.AFFILIATE;
    const isCustomerCare = user.role === UserRole.CUSTOMER_CARE;
    const isLogistics = user.role === UserRole.LOGISTICS;

    const handleRefresh = async () => {
        setIsRefreshing(true); 
        await onRefreshData(); 
        setIsRefreshing(false);
    };

    const productOptions = useMemo(() => {
        return [
            { value: 'all', label: 'Tutti i prodotti' },
            ...products.map(p => ({ value: p.id, label: p.name, refNumber: p.refNumber }))
        ];
    }, [products]);

    const finalFilteredSales = useMemo(() => {
        const range = getPeriodRange(timePeriod);
        return sales.filter(s => {
            if (isAffiliate && (s.affiliateId !== user.id && s.affiliateId !== user.short_id)) return false;
            if (isCustomerCare && s.lastContactedBy !== user.id) return false;
            
            if (range) {
                const date = new Date(s.saleDate);
                if (date < range[0] || date > range[1]) return false;
            }

            if (selectedProductId !== 'all' && s.productId !== selectedProductId) return false;
            if (searchSubId.trim() && !String(s.subId || '').toLowerCase().includes(searchSubId.toLowerCase())) return false;

            return true;
        });
    }, [sales, timePeriod, user, isAffiliate, isCustomerCare, selectedProductId, searchSubId]);

    const stats = useMemo(() => {
        let confirmedGuadagno = 0;
        let pendingGuadagno = 0;
        let totalCount = 0;
        
        const confirmedStatuses: SaleStatus[] = ['Consegnato', 'Svincolato'];
        const pendingStatuses: SaleStatus[] = ['In attesa', 'Contattato', 'Confermato', 'Spedito', 'Giacenza'];

        finalFilteredSales.forEach(s => {
            if (['Annullato', 'Cancellato', 'Duplicato', 'Test'].includes(s.status)) return;
            
            totalCount++;
            const prod = products.find(p => p.id === s.productId);
            const qty = s.quantity || 1;
            let comm = 0;
            
            if (isAffiliate) comm = s.commissionAmount;
            else if (isCustomerCare) comm = (prod?.customerCareCommission || 0) * qty;
            else if (isLogistics) comm = (prod?.fulfillmentCost || 0);
            else comm = s.saleAmount;

            if (s.isBonus || confirmedStatuses.includes(s.status)) confirmedGuadagno += comm;
            else if (pendingStatuses.includes(s.status)) pendingGuadagno += comm;
        });

        const deliveryRate = totalCount > 0 ? (finalFilteredSales.filter(s => confirmedStatuses.includes(s.status)).length / totalCount) * 100 : 0;

        return { confirmed: confirmedGuadagno, pending: pendingGuadagno, totalCount, deliveryRate };
    }, [finalFilteredSales, products, isAffiliate, isCustomerCare, isLogistics]);

    const chartSales = useMemo(() => {
        return finalFilteredSales.map(s => {
            const p = products.find(prod => prod.id === s.productId);
            let amount = s.saleAmount;
            if (isAffiliate) amount = s.commissionAmount;
            else if (isCustomerCare) amount = (p?.customerCareCommission || 0) * (s.quantity || 1);
            else if (isLogistics) amount = p?.fulfillmentCost || 0;
            return { ...s, saleAmount: amount };
        });
    }, [finalFilteredSales, products, isAffiliate, isCustomerCare, isLogistics]);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-on-surface">Performance Report</h2>
                    <p className="text-sm text-gray-500">Analisi dettagliata e filtri avanzati sui tuoi dati</p>
                </div>
                <button onClick={handleRefresh} disabled={isRefreshing} className="bg-surface p-3 rounded-full border shadow-sm hover:bg-gray-50 transition-all">
                    <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Guadagno Maturato" value={`€${stats.confirmed.toFixed(2)}`} color="text-green-600" />
                <StatCard title="Guadagno Potenziale" value={`€${stats.pending.toFixed(2)}`} color="text-orange-500" />
                <StatCard title="Volume Ordini" value={stats.totalCount} color="text-indigo-600" />
                <StatCard title="Tasso Consegna" value={`${stats.deliveryRate.toFixed(1)}%`} color="text-purple-600" />
            </div>

            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 text-gray-700 uppercase tracking-wider">Andamento Temporale</h3>
                <div className="h-80">
                    <SalesChart sales={chartSales} granularity={['today', 'yesterday'].includes(timePeriod) ? 'hour' : 'day'} />
                </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Filtri Analitici</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Periodo</label>
                        <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value as TimePeriod)} className="w-full mt-1 p-2 bg-gray-50 border-none rounded-lg font-bold text-sm">
                            <option value="today">Oggi</option>
                            <option value="yesterday">Ieri</option>
                            <option value="this_week">Questa Settimana</option>
                            <option value="this_month">Questo Mese</option>
                            <option value="last_month">Mese Scorso</option>
                            <option value="all">Sempre</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">Prodotto</label>
                        <SearchableSelect
                            options={productOptions}
                            value={selectedProductId}
                            onChange={setSelectedProductId}
                            placeholder="Cerca prodotto..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Cerca Sub ID</label>
                        <div className="relative mt-1">
                            <input type="text" value={searchSubId} onChange={(e) => setSearchSubId(e.target.value)} placeholder="E.g. fb_ads" className="w-full p-2 pl-9 bg-gray-50 border-none rounded-lg font-bold text-sm" />
                            <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="font-bold text-gray-700">Analisi Risultati per Prodotto</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50/50">
                            <tr className="text-left text-xs font-bold text-gray-400 uppercase">
                                <th className="px-6 py-3">Prodotto</th>
                                <th className="px-6 py-3">Vendite Totali</th>
                                <th className="px-6 py-3">In Attesa</th>
                                <th className="px-6 py-3">Consegnati</th>
                                <th className="px-6 py-3 text-right">Provv. Maturata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {Array.from(new Set(finalFilteredSales.map(s => s.productId))).map(pid => {
                                const pSales = finalFilteredSales.filter(s => s.productId === pid);
                                const prod = products.find(p => p.id === pid);
                                
                                const deliveredCount = pSales.filter(s => ['Consegnato', 'Svincolato'].includes(s.status)).length;
                                const pendingCount = pSales.filter(s => ['In attesa', 'Contattato', 'Confermato', 'Spedito', 'Giacenza'].includes(s.status)).length;
                                
                                let totalEarned = 0;
                                pSales.filter(s => s.isBonus || ['Consegnato', 'Svincolato'].includes(s.status)).forEach(s => {
                                    if (isAffiliate) totalEarned += s.commissionAmount;
                                    else if (isCustomerCare) totalEarned += (prod?.customerCareCommission || 0) * (s.quantity || 1);
                                    else if (isLogistics) totalEarned += (prod?.fulfillmentCost || 0);
                                    else totalEarned += s.saleAmount;
                                });

                                return (
                                    <tr key={pid} className="text-sm hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-bold text-gray-800">{String(prod?.name || pid)}</td>
                                        <td className="px-6 py-4">{Number(pSales.length)}</td>
                                        <td className="px-6 py-4 text-orange-600 font-semibold">{Number(pendingCount)}</td>
                                        <td className="px-6 py-4 text-green-600 font-semibold">{Number(deliveredCount)}</td>
                                        <td className="px-6 py-4 text-right font-black text-primary">€{totalEarned.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {finalFilteredSales.length === 0 && <div className="p-12 text-center text-gray-400 text-sm">Nessun dato corrispondente ai filtri selezionati.</div>}
                </div>
            </div>
        </div>
    );
};

export default Performance;
