
import React, { useState, useMemo } from 'react';
import { Product, Affiliate, Sale, User, UserRole, Notification, SaleStatus } from '../types';
import SalesChart from './SalesChart';

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

interface DashboardProps {
  user: User;
  products: Product[];
  affiliates: Affiliate[];
  sales: Sale[];
  notifications: Notification[];
}

const DashboardStatCard: React.FC<{ title: string; value: string | number; color: string; bgColor: string }> = ({ title, value, color, bgColor }) => (
    <div className={`${bgColor} p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center transition-transform hover:scale-[1.02]`}>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</h3>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user, products, sales, notifications }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_month');
  
  const isAdminOrManager = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
  const isAffiliate = user.role === UserRole.AFFILIATE;
  const isCustomerCare = user.role === UserRole.CUSTOMER_CARE;
  const isLogistics = user.role === UserRole.LOGISTICS;

  // Filtro vendite in base al ruolo e al periodo selezionato
  const filteredDashboardSales = useMemo(() => {
    const range = getPeriodRange(timePeriod);
    return sales.filter(s => {
        // Filtro Ruolo
        if (isAffiliate && (s.affiliateId !== user.id && s.affiliateId !== user.short_id)) return false;
        if (isCustomerCare && s.lastContactedBy !== user.id) return false;
        
        // Filtro Tempo
        if (range) {
            const date = new Date(s.saleDate);
            if (date < range[0] || date > range[1]) return false;
        }
        return true;
    });
  }, [sales, user, isAffiliate, isCustomerCare, timePeriod]);

  // Calcolo metriche per Admin/Manager
  const adminMetrics = useMemo(() => {
    if (!isAdminOrManager) return null;

    let totalTurnover = 0;
    let totalExpenses = 0;
    let successfulSalesCount = 0;

    const excludedStatuses: SaleStatus[] = ['Annullato', 'Cancellato', 'Duplicato', 'Test'];

    filteredDashboardSales.forEach(s => {
        if (excludedStatuses.includes(s.status)) return;

        successfulSalesCount++;
        totalTurnover += s.saleAmount;

        const product = products.find(p => p.id === s.productId);
        if (product) {
            const qty = s.quantity || 1;
            const affiliateComm = s.commissionAmount;
            const ccComm = (product.customerCareCommission || 0) * qty;
            const logisticsComm = (product.fulfillmentCost || 0);
            
            // Spedizione: se gratuita per il cliente, la paga la piattaforma interamente
            // se a pagamento, la piattaforma paga il costo reale ma ha incassato shippingCharge
            const realShippingCost = product.shippingCost || 0;
            
            const cogs = (product.costOfGoods || 0) * qty;

            // Totale spese per questo ordine
            totalExpenses += (affiliateComm + ccComm + logisticsComm + realShippingCost + cogs);
        }
    });

    return {
        turnover: totalTurnover,
        expenses: totalExpenses,
        profit: totalTurnover - totalExpenses,
        count: successfulSalesCount
    };
  }, [filteredDashboardSales, products, isAdminOrManager]);

  const chartData = useMemo(() => {
    return filteredDashboardSales.map(s => {
        const p = products.find(prod => prod.id === s.productId);
        let amount = s.saleAmount;
        if (isAffiliate) amount = s.commissionAmount;
        else if (isCustomerCare) amount = (p?.customerCareCommission || 0) * (s.quantity || 1);
        else if (isLogistics) amount = p?.fulfillmentCost || 0;
        return { ...s, saleAmount: amount };
    });
  }, [filteredDashboardSales, products, isAffiliate, isCustomerCare, isLogistics]);

  const latestSales = useMemo(() => [...filteredDashboardSales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()).slice(0, 6), [filteredDashboardSales]);
  const newestProducts = useMemo(() => [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [products]);
  const latestNews = useMemo(() => [...notifications].filter(n => n.targetRoles.includes(user.role)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [notifications, user.role]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-black text-on-surface">Bentornato, {user.name}</h2>
            <p className="text-gray-500">Riepilogo attività per il periodo selezionato.</p>
        </div>
        <div className="bg-surface p-2 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <span className="text-xs font-bold text-gray-400 uppercase px-3">Periodo:</span>
            <select 
                value={timePeriod} 
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                className="bg-transparent border-none font-bold text-sm text-primary focus:ring-0 cursor-pointer"
            >
                <option value="today">Oggi</option>
                <option value="yesterday">Ieri</option>
                <option value="this_week">Questa Settimana</option>
                <option value="this_month">Questo Mese</option>
                <option value="last_month">Mese Scorso</option>
                <option value="all">Tutto il tempo</option>
            </select>
        </div>
      </div>

      {/* Widget Finanziario per Admin e Manager */}
      {isAdminOrManager && adminMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardStatCard 
                title="Fatturato Totale" 
                value={`€${adminMetrics.turnover.toFixed(2)}`} 
                color="text-green-600" 
                bgColor="bg-white"
            />
            <DashboardStatCard 
                title="Spese Totali" 
                value={`€${adminMetrics.expenses.toFixed(2)}`} 
                color="text-red-600" 
                bgColor="bg-white"
            />
            <DashboardStatCard 
                title="Profitto Netto" 
                value={`€${adminMetrics.profit.toFixed(2)}`} 
                color="text-blue-700" 
                bgColor="bg-blue-50/50"
            />
            <DashboardStatCard 
                title="Vendite Totali" 
                value={adminMetrics.count} 
                color="text-indigo-600" 
                bgColor="bg-white"
            />
        </div>
      )}

      {/* Grafico Principale */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6 text-gray-700 uppercase tracking-wider">Andamento {isAdminOrManager ? 'Fatturato' : 'Risultati'}</h3>
        <div className="h-72">
          <SalesChart sales={chartData} granularity={['today', 'yesterday'].includes(timePeriod) ? 'hour' : 'day'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ultime Conversioni */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Ultime Conversioni</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="text-left text-xs font-bold text-gray-400 uppercase border-b border-gray-50">
                            <th className="pb-3 px-2">Data</th>
                            <th className="pb-3 px-2">Prodotto</th>
                            <th className="pb-3 px-2">Importo</th>
                            <th className="pb-3 text-right px-2">Stato</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {latestSales.map(s => (
                            <tr key={s.id} className="text-sm">
                                <td className="py-4 px-2 text-gray-500 whitespace-nowrap">{new Date(s.saleDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</td>
                                <td className="py-4 px-2 font-bold text-gray-800 truncate max-w-[120px]">{s.productName}</td>
                                <td className="py-4 px-2 font-black text-primary">€{typeof s.saleAmount === 'number' ? s.saleAmount.toFixed(2) : '0.00'}</td>
                                <td className="py-4 px-2 text-right">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        s.status === 'Consegnato' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>{String(s.status)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {latestSales.length === 0 && <p className="text-center py-10 text-gray-400 text-sm italic">Nessun dato nel periodo selezionato</p>}
            </div>
        </div>

        {/* Sidebar della Dashboard */}
        <div className="space-y-8">
            {/* Nuovi Prodotti */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Nuovi Arrivi</h3>
                <div className="space-y-4">
                    {newestProducts.map(p => (
                        <div key={p.id} className="flex items-center gap-3">
                            <img src={p.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-gray-100" alt="" />
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                                <p className="text-xs text-primary font-black">€{p.price.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ultime Notizie */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Notizie & Avvisi</h3>
                <div className="space-y-4">
                    {latestNews.map(n => (
                        <div key={n.id} className="border-l-4 border-secondary pl-3">
                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{n.title}</p>
                            <p className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                    {latestNews.length === 0 && <p className="text-xs text-gray-400">Nessuna notizia recente</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
