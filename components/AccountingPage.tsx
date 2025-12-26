import React, { useState, useMemo } from 'react';
import { Product, Sale, StockExpense, Transaction } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface AccountingPageProps {
    products: Product[];
    sales: Sale[];
    stockExpenses: StockExpense[];
    transactions: Transaction[];
    onAddExpense: (expense: Omit<StockExpense, 'id' | 'createdAt' | 'totalCost'>) => Promise<void>;
    onDeleteExpense: (expenseId: string) => Promise<void>;
}

const StatDisplay: React.FC<{ label: string; value: number; color: string; isLarge?: boolean; isBordered?: boolean; }> = 
({ label, value, color, isLarge, isBordered }) => (
    <div className={`flex justify-between items-baseline ${isBordered ? 'border-t pt-3 mt-3' : ''}`}>
        <span className={`text-sm ${isLarge ? 'font-bold' : 'font-medium'} text-gray-600`}>{label}</span>
        <span className={`font-bold ${isLarge ? 'text-2xl' : 'text-lg'} ${color}`}>
            {value >= 0 ? `€${value.toFixed(2)}` : `- €${Math.abs(value).toFixed(2)}`}
        </span>
    </div>
);

const AccountingPage: React.FC<AccountingPageProps> = ({ products, sales, stockExpenses, transactions, onAddExpense, onDeleteExpense }) => {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [payer, setPayer] = useState<'PLATFORM' | 'LOGISTICS'>('PLATFORM');
    const [notes, setNotes] = useState('');
    
    const [reportMonth, setReportMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const numQuantity = parseInt(quantity, 10);
        const numUnitCost = parseFloat(unitCost);

        if (!productId || !numQuantity || !numUnitCost || !date) {
            alert('Per favore, compila tutti i campi obbligatori.');
            return;
        }

        await onAddExpense({
            date,
            productId,
            quantity: numQuantity,
            unitCost: numUnitCost,
            payer,
            notes: notes || undefined,
        });

        // Reset form
        setDate(new Date().toISOString().slice(0, 10));
        setProductId('');
        setQuantity('');
        setUnitCost('');
        setNotes('');
    };

    const monthlyReport = useMemo(() => {
        const [year, month] = reportMonth.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const deliveredSales = sales.filter(s => {
            const saleDate = new Date(s.saleDate);
            return s.status === 'Consegnato' && saleDate >= startDate && saleDate <= endDate;
        });

        const expensesInMonth = stockExpenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
        
        const payoutsInMonth = transactions.filter(t => {
            const transactionDate = new Date(t.createdAt);
            return (
                t.type === 'Payout' &&
                t.status === 'Completed' &&
                transactionDate >= startDate &&
                transactionDate <= endDate
            );
        });
        const totalPayouts = payoutsInMonth.reduce((sum, t) => sum + t.amount, 0);

        let grossPlatformRevenue = 0;
        let totalAffiliateCommissions = 0;
        let totalCustomerCareCommissions = 0;
        let totalPlatformFees = 0;

        for (const sale of deliveredSales) {
            const product = products.find(p => p.id === sale.productId);
            if (!product) continue;
            
            const bundle = product.bundleOptions?.find(b => b.id === sale.bundleId);

            // This is the amount Logistics owes the platform for a delivered COD order
            grossPlatformRevenue += sale.saleAmount - (product.shippingCost || 0) - (product.fulfillmentCost || 0);
            
            totalAffiliateCommissions += sale.commissionAmount;
            totalCustomerCareCommissions += product.customerCareCommission || 0;
            totalPlatformFees += bundle?.platformFee ?? (product.platformFee || 0);
        }

        const platformStockExpenses = expensesInMonth
            .filter(e => e.payer === 'PLATFORM')
            .reduce((sum, e) => sum + e.totalCost, 0);

        const logisticsStockExpenses = expensesInMonth
            .filter(e => e.payer === 'LOGISTICS')
            .reduce((sum, e) => sum + e.totalCost, 0);
            
        const platformTurnover = grossPlatformRevenue - logisticsStockExpenses + totalPlatformFees;
        
        const platformNetProfit = platformTurnover - totalAffiliateCommissions - totalCustomerCareCommissions - platformStockExpenses - totalPayouts;

        return {
            grossPlatformRevenue,
            logisticsStockExpenses,
            platformTurnover,
            totalAffiliateCommissions,
            totalCustomerCareCommissions,
            platformStockExpenses,
            totalPlatformFees,
            platformNetProfit,
            totalPayouts,
        };
    }, [reportMonth, sales, products, stockExpenses, transactions]);
    
    const recentExpenses = useMemo(() => {
        return [...stockExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }, [stockExpenses]);

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold text-on-surface">Contabilità e Profitto</h2>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main Content: Report */}
                <div className="lg:col-span-3 bg-surface rounded-xl shadow-md p-6">
                     <h3 className="text-xl font-bold text-on-surface mb-4">Report Mensile Piattaforma</h3>
                     <div className="mb-6">
                        <label htmlFor="report-month" className="block text-sm font-medium text-gray-700">Seleziona Mese</label>
                        <input
                            type="month"
                            id="report-month"
                            value={reportMonth}
                            onChange={(e) => setReportMonth(e.target.value)}
                            className="mt-1 block w-full max-w-xs px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                     </div>

                     <div className="space-y-4">
                        <h4 className="font-bold text-gray-800">Calcolo Fatturato</h4>
                        <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                            <StatDisplay label="Incasso Lordo da Logistica" value={monthlyReport.grossPlatformRevenue} color="text-green-600" />
                            <StatDisplay label="Costo Stock (pagato da Logistica)" value={-monthlyReport.logisticsStockExpenses} color="text-red-600" />
                            <StatDisplay label="Fee Piattaforma" value={monthlyReport.totalPlatformFees} color="text-green-600" />
                            <StatDisplay label="= Fatturato Piattaforma" value={monthlyReport.platformTurnover} color="text-blue-600" isBordered />
                        </div>
                        <h4 className="font-bold text-gray-800 pt-4">Calcolo Utile Netto</h4>
                         <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                             <StatDisplay label="Fatturato Piattaforma" value={monthlyReport.platformTurnover} color="text-blue-600" />
                             <StatDisplay label="Commissioni Affiliati" value={-monthlyReport.totalAffiliateCommissions} color="text-red-600" />
                             <StatDisplay label="Commissioni Customer Care" value={-monthlyReport.totalCustomerCareCommissions} color="text-red-600" />
                             <StatDisplay label="Pagamenti Effettuati (Payout)" value={-monthlyReport.totalPayouts} color="text-red-600" />
                             <StatDisplay label="Costo Stock (pagato da Piattaforma)" value={-monthlyReport.platformStockExpenses} color="text-red-600" />
                             <StatDisplay label="= UTILE NETTO PIATTAFORMA" value={monthlyReport.platformNetProfit} color={monthlyReport.platformNetProfit >= 0 ? "text-primary" : "text-red-700"} isLarge isBordered />
                         </div>
                     </div>
                </div>

                {/* Right Column: Expense Form & List */}
                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-surface rounded-xl shadow-md p-6">
                        <h3 className="text-xl font-bold text-on-surface mb-4">Registra Spesa Stock</h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label htmlFor="exp-date" className="block text-sm font-medium text-gray-700">Data</label>
                                <input type="date" id="exp-date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full input-style" />
                            </div>
                             <div>
                                <label htmlFor="exp-product" className="block text-sm font-medium text-gray-700">Prodotto</label>
                                <select id="exp-product" value={productId} onChange={e => setProductId(e.target.value)} required className="mt-1 block w-full input-style">
                                    <option value="" disabled>Seleziona un prodotto...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="exp-quantity" className="block text-sm font-medium text-gray-700">Quantità</label>
                                    <input type="number" id="exp-quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="exp-cost" className="block text-sm font-medium text-gray-700">Costo Unitario (€)</label>
                                    <input type="number" id="exp-cost" value={unitCost} onChange={e => setUnitCost(e.target.value)} required min="0.01" step="0.01" className="mt-1 block w-full input-style" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pagato da</label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center"><input type="radio" value="PLATFORM" checked={payer==='PLATFORM'} onChange={() => setPayer('PLATFORM')} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" /> <span className="ml-2 text-sm">Piattaforma</span></label>
                                    <label className="flex items-center"><input type="radio" value="LOGISTICS" checked={payer==='LOGISTICS'} onChange={() => setPayer('LOGISTICS')} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" /> <span className="ml-2 text-sm">Logistica</span></label>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="exp-notes" className="block text-sm font-medium text-gray-700">Note (Opzionale)</label>
                                <textarea id="exp-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full input-style"></textarea>
                            </div>
                            <button type="submit" className="w-full flex justify-center items-center gap-2 bg-primary text-on-primary font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">
                                <PlusIcon /> Aggiungi Spesa
                            </button>
                        </form>
                    </div>
                    <div className="bg-surface rounded-xl shadow-md p-6">
                        <h3 className="text-xl font-bold text-on-surface mb-4">Spese Recenti</h3>
                        <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                           {recentExpenses.map(exp => {
                                const product = products.find(p => p.id === exp.productId);
                                return (
                                    <li key={exp.id} className="p-2 border rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-semibold">{product?.name || 'Prodotto non trovato'}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(exp.date).toLocaleDateString()} - €{exp.totalCost.toFixed(2)} ({exp.payer})
                                            </p>
                                        </div>
                                        <button onClick={() => onDeleteExpense(exp.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button>
                                    </li>
                                );
                           })}
                           {recentExpenses.length === 0 && <p className="text-sm text-gray-500 text-center">Nessuna spesa registrata.</p>}
                        </ul>
                    </div>
                </div>
            </div>
             <style>{`.input-style { px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm }`}</style>
        </div>
    );
};

export default AccountingPage;