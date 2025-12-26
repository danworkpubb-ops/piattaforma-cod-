
import React, { useState, useMemo } from 'react';
import { User, Affiliate, Manager, Transaction, UserRole, CustomerCareUser, Sale, SaleStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import SearchableSelect from './SearchableSelect';

interface PaymentsPageProps {
    user: User;
    fullUserObject: Affiliate | Manager | CustomerCareUser | User;
    allUsersWithBalance: (User & { currentBalance?: number })[];
    transactions: Transaction[];
    sales: Sale[]; 
    products: any[];
    onPayoutRequest: (userId: string, amount: number, paymentMethod: 'PayPal' | 'Bonifico Bancario' | 'Worldfili', paymentDetails: string) => Promise<{ success: boolean, error?: string }>;
    onTransferFunds: (fromUserId: string, toUserId: string, amount: number, notes?: string) => Promise<{ success: boolean, error?: string }>;
    onAdminTransferFunds: (fromUserId: string, toUserId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
    onAddBonus: (toUserId: string, amount: number, notes: string) => Promise<{ success: boolean; error?: string }>;
    onApproveTransaction: (transactionId: string) => void;
    onRejectTransaction: (transactionId: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
    <div className="bg-surface p-6 rounded-xl shadow-md flex flex-col border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
        <p className={`text-3xl font-black mt-2 ${color}`}>{value}</p>
    </div>
);

const PaymentsPage: React.FC<PaymentsPageProps> = ({ user, fullUserObject, allUsersWithBalance, transactions, sales, products, onPayoutRequest, onTransferFunds, onAdminTransferFunds, onApproveTransaction, onRejectTransaction, onAddBonus }) => {
    const isManagerial = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
    const isAffiliate = user.role === UserRole.AFFILIATE;
    const isCustomerCare = user.role === UserRole.CUSTOMER_CARE;
    const isLogistics = user.role === UserRole.LOGISTICS;

    const { availableBalance } = useMemo(() => {
        let income = 0;
        let spending = 0;
        const confirmedStatuses: SaleStatus[] = ['Consegnato', 'Svincolato'];

        sales.forEach(sale => {
            let belongsToUser = false;
            if (isAffiliate) belongsToUser = (sale.affiliateId === user.id || sale.affiliateId === user.short_id);
            else if (isCustomerCare) belongsToUser = (sale.lastContactedBy === user.id);
            else if (isLogistics) belongsToUser = true;

            if (belongsToUser && confirmedStatuses.includes(sale.status)) {
                const product = products.find(p => p.id === sale.productId);
                const quantity = sale.quantity || 1;
                if (isAffiliate) income += sale.commissionAmount;
                else if (isCustomerCare) income += (product?.customerCareCommission || 0) * quantity;
                else if (isLogistics) income += product?.fulfillmentCost || 0;
            }
        });

        transactions.forEach(t => {
            if (t.status !== 'Completed' && t.type !== 'Payout') return;
            if (t.toUserId === user.id && (t.type === 'Transfer' || t.type === 'Bonus') && t.status === 'Completed') income += t.amount;
            if (t.userId === user.id && t.type === 'Payout' && (t.status === 'Completed' || t.status === 'Pending')) spending += t.amount;
            if (t.fromUserId === user.id && t.type === 'Transfer' && t.status === 'Completed') spending += t.amount;
        });

        return { availableBalance: income - spending };
    }, [sales, products, transactions, user, isAffiliate, isCustomerCare, isLogistics]);

    const finalValue = isManagerial ? (fullUserObject.currentBalance || 0) : availableBalance;

    const [activeTab, setActiveTab] = useState<any>(user.role === UserRole.ADMIN ? 'requests' : 'payout');
    
    // Forms State
    const [payoutAmount, setPayoutAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'PayPal' | 'Bonifico Bancario' | 'Worldfili'>('PayPal');
    const [paymentDetails, setPaymentDetails] = useState('');
    
    const [recipientShortId, setRecipientShortId] = useState('');
    const [verifiedRecipient, setVerifiedRecipient] = useState<User | null>(null);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferNotes, setTransferNotes] = useState('');

    const [adminFromId, setAdminFromId] = useState('');
    const [adminToId, setAdminToId] = useState('');
    const [adminTransferAmount, setAdminTransferAmount] = useState('');
    
    const [bonusRecipientId, setBonusRecipientId] = useState('');
    const [bonusAmount, setBonusAmount] = useState('');
    const [bonusNotes, setBonusNotes] = useState('');

    const userTransactions = useMemo(() => {
        return transactions
            .filter(t => t.userId === user.id || t.fromUserId === user.id || t.toUserId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [transactions, user.id]);

    const pendingRequests = useMemo(() => {
        return transactions.filter(t => t.type === 'Payout' && t.status === 'Pending');
    }, [transactions]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Completed': 'bg-green-100 text-green-800',
            'Rejected': 'bg-red-100 text-red-800',
        };
        return <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-black text-on-surface mb-6 tracking-tight">Centro Pagamenti</h2>
            
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Il Tuo Saldo" value={`€${finalValue.toFixed(2)}`} color="text-green-600" />
                <StatCard title="Payout Pendenti" value={pendingRequests.length} color="text-orange-500" />
                <div className="bg-primary text-on-primary p-6 rounded-xl shadow-md flex flex-col justify-center">
                    <h3 className="text-xs font-bold opacity-80 uppercase tracking-widest">ID Pubblico Versamenti</h3>
                    <p className="text-2xl font-mono font-black mt-2 tracking-widest">{user.short_id || '---'}</p>
                </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="border-b border-gray-100 bg-gray-50/50">
                    <nav className="flex gap-4 px-6 overflow-x-auto">
                         {[
                            { key: 'requests', label: 'Approvazione Payout', roles: [UserRole.ADMIN, UserRole.MANAGER] },
                            { key: 'admin_transfer', label: 'Sposta Fondi', roles: [UserRole.ADMIN] },
                            { key: 'add_bonus', label: 'Eroga Bonus', roles: [UserRole.ADMIN, UserRole.MANAGER] },
                            { key: 'payout', label: 'Richiedi Incasso', roles: [UserRole.AFFILIATE, UserRole.MANAGER, UserRole.CUSTOMER_CARE] },
                            { key: 'transfer', label: 'Invia P2P', roles: [UserRole.AFFILIATE, UserRole.MANAGER] },
                            { key: 'history', label: 'I Miei Movimenti', roles: [UserRole.AFFILIATE, UserRole.MANAGER, UserRole.CUSTOMER_CARE] },
                            { key: 'all_history', label: 'Log Globale', roles: [UserRole.ADMIN] },
                         ].filter(tab => tab.roles.includes(user.role)).map(tab => (
                             <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`whitespace-nowrap py-5 px-2 border-b-4 font-bold text-sm transition-all ${activeTab === tab.key ? 'border-primary text-primary scale-105' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                {tab.label}
                            </button>
                         ))}
                    </nav>
                </div>
                
                <div className="p-8">
                    {/* --- ADMIN: RICHIESTE PENDENTI --- */}
                    {activeTab === 'requests' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800">Richieste di Payout in attesa</h3>
                            <div className="overflow-x-auto border rounded-xl">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left text-xs font-bold text-gray-500 uppercase">
                                            <th className="px-6 py-3">Data</th>
                                            <th className="px-6 py-3">Utente</th>
                                            <th className="px-6 py-3">Metodo</th>
                                            <th className="px-6 py-3">Importo</th>
                                            <th className="px-6 py-3 text-right">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingRequests.map(t => {
                                            const requester = allUsersWithBalance.find(u => u.id === t.userId);
                                            return (
                                                <tr key={t.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-gray-900">{requester?.name || 'Sconosciuto'}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{requester?.short_id}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold">{t.paymentMethod}</div>
                                                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{t.paymentDetails}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-lg font-black text-primary">€{t.amount.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => onApproveTransaction(t.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition-all">PAGA ORA</button>
                                                        <button onClick={() => onRejectTransaction(t.id)} className="text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-50 transition-all">RIFIUTA</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {pendingRequests.length === 0 && (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Nessuna richiesta di pagamento da elaborare.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- ADMIN: EROGA BONUS --- */}
                    {activeTab === 'add_bonus' && (
                        <div className="max-w-md mx-auto space-y-6">
                            <h3 className="text-xl font-bold text-center">Eroga Bonus Manuale</h3>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Seleziona Destinatario</label>
                                <SearchableSelect 
                                    options={allUsersWithBalance.map(u => ({ value: u.id, label: `${u.name} (${u.short_id})` }))}
                                    value={bonusRecipientId}
                                    onChange={setBonusRecipientId}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Importo Bonus (€)</label>
                                <input type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} className="w-full p-3 border rounded-lg font-bold text-lg" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Causale / Note</label>
                                <textarea value={bonusNotes} onChange={e => setBonusNotes(e.target.value)} className="w-full p-3 border rounded-lg text-sm" placeholder="Es: Premio contest mensile" />
                            </div>
                            <button 
                                onClick={async () => {
                                    if(!bonusRecipientId || !bonusAmount) return;
                                    await onAddBonus(bonusRecipientId, parseFloat(bonusAmount), bonusNotes);
                                    setBonusAmount(''); setBonusNotes(''); alert('Bonus accreditato!');
                                }}
                                className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 shadow-lg transition-all"
                            >
                                ACCREDITA BONUS ORA
                            </button>
                        </div>
                    )}

                    {/* --- USER: RICHIEDI PAGAMENTO --- */}
                    {activeTab === 'payout' && (
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const amt = parseFloat(payoutAmount);
                            if(amt > finalValue) return alert('Saldo insufficiente');
                            await onPayoutRequest(user.id, amt, paymentMethod, paymentDetails);
                            setPayoutAmount(''); setPaymentDetails(''); alert('Richiesta inviata!');
                        }} className="max-w-lg mx-auto space-y-6">
                            <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-100">
                                <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Disponibile per il prelievo</p>
                                <p className="text-5xl font-black text-green-600 mt-2">€{finalValue.toFixed(2)}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Importo da Prelevare (€)</label>
                                    <input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} required min="1" step="0.01" max={finalValue} className="mt-1 block w-full p-4 border rounded-xl font-black text-2xl text-primary" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700">Metodo</label>
                                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="mt-1 block w-full p-3 border rounded-lg font-bold">
                                            <option>PayPal</option>
                                            <option>Bonifico Bancario</option>
                                            <option>Worldfili</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700">Coordinate / Email</label>
                                        <input type="text" value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} required className="mt-1 block w-full p-3 border rounded-lg" placeholder="Email o IBAN" />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary text-on-primary font-black py-4 rounded-xl shadow-lg hover:shadow-primary/30 transition-all uppercase tracking-widest">Invia Richiesta di Incasso</button>
                        </form>
                    )}

                    {/* --- STORICO MOVIMENTI --- */}
                    {(activeTab === 'history' || activeTab === 'all_history') && (
                        <div className="overflow-x-auto border rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-xs font-bold text-gray-500 uppercase">
                                        <th className="px-6 py-3">Data</th>
                                        <th className="px-6 py-3">Tipo</th>
                                        <th className="px-6 py-3">Note / Partner</th>
                                        <th className="px-6 py-3">Importo</th>
                                        <th className="px-6 py-3">Stato</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(activeTab === 'all_history' ? transactions : userTransactions).map(t => {
                                        const isCredit = (t.toUserId === user.id || (activeTab === 'all_history' && t.type === 'Bonus'));
                                        return (
                                            <tr key={t.id} className="text-sm hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(t.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-4 font-bold">{t.type}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-900 font-medium">{t.notes}</div>
                                                    <div className="text-xs text-gray-400">{t.fromUserName ? `Da: ${t.fromUserName}` : ''} {t.toUserName ? `A: ${t.toUserName}` : ''}</div>
                                                </td>
                                                <td className={`px-6 py-4 font-black text-lg ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isCredit ? '+' : '-'} €{t.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentsPage;
