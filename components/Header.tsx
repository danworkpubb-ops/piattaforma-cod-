
import React, { useMemo } from 'react';
import { User, UserRole, Sale, Notification, Product, SaleStatus, Transaction } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import NotificationBell from './NotificationBell';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface HeaderProps {
  user: User;
  fullUserObject: (User & { currentBalance?: number; }) | null;
  sales: Sale[];
  products: Product[];
  notifications: Notification[];
  transactions: Transaction[]; 
  onOpenCommissionDetails: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onViewNotification: (notification: Notification) => void;
  onOpenPlatformCheck: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, fullUserObject, sales, products, notifications, transactions, onOpenCommissionDetails, onMarkAsRead, onMarkAllAsRead, onViewNotification, onOpenPlatformCheck }) => {
  const isAffiliate = user.role === UserRole.AFFILIATE;
  const isCustomerCare = user.role === UserRole.CUSTOMER_CARE;
  const isLogistics = user.role === UserRole.LOGISTICS;

  // CALCOLO SALDO DINAMICO (Income - Outgoings)
  const { availableBalance, pendingRevenue } = useMemo(() => {
    let income = 0;
    let spending = 0;
    let pending = 0;

    const confirmedStatuses: SaleStatus[] = ['Consegnato', 'Svincolato'];
    const pendingStatuses: SaleStatus[] = ['In attesa', 'Contattato', 'Confermato', 'Spedito', 'Giacenza'];

    // 1. Commissioni da Vendite
    sales.forEach(sale => {
        let belongsToUser = false;
        if (isAffiliate) belongsToUser = (sale.affiliateId === user.id || sale.affiliateId === user.short_id);
        else if (isCustomerCare) belongsToUser = (sale.lastContactedBy === user.id);
        else if (isLogistics) belongsToUser = true;

        if (belongsToUser) {
            const product = products.find(p => p.id === sale.productId);
            const quantity = sale.quantity || 1;
            let comm = 0;
            
            if (isAffiliate) comm = sale.commissionAmount;
            else if (isCustomerCare) comm = (product?.customerCareCommission || 0) * quantity;
            else if (isLogistics) comm = product?.fulfillmentCost || 0;

            if (confirmedStatuses.includes(sale.status)) {
                income += comm;
            } else if (pendingStatuses.includes(sale.status)) {
                pending += comm;
            }
        }
    });

    // 2. Transazioni (Payouts, Transfers, Bonus)
    transactions.forEach(t => {
        if (t.status !== 'Completed' && t.type !== 'Payout') return; // Consideriamo solo transazioni concluse o Payout pendenti per il calcolo del disponibile

        // Entrate extra: Trasferimenti ricevuti o Bonus
        if (t.toUserId === user.id && (t.type === 'Transfer' || t.type === 'Bonus') && t.status === 'Completed') {
            income += t.amount;
        }

        // Uscite: Payout effettuati (anche se pending scalano il saldo) o Trasferimenti inviati
        if (t.userId === user.id && t.type === 'Payout' && (t.status === 'Completed' || t.status === 'Pending')) {
            spending += t.amount;
        }
        if (t.fromUserId === user.id && t.type === 'Transfer' && t.status === 'Completed') {
            spending += t.amount;
        }
    });

    return { 
        availableBalance: income - spending, 
        pendingRevenue: pending 
    };
  }, [sales, products, transactions, user.id, user.short_id, user.role, isAffiliate, isLogistics, isCustomerCare]);

  // Se l'utente è ADMIN o MANAGER, usiamo il saldo tabellare se disponibile, altrimenti il calcolo dinamico
  const finalValue = (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) 
    ? (fullUserObject?.currentBalance || 0) 
    : availableBalance;

  return (
    <header className="bg-surface shadow-sm p-4 sticky top-0 z-20">
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 sm:gap-8">
        <div className="flex items-center gap-3 text-green-600" title="Saldo netto prelevabile (Commissioni + Bonus + Trasferimenti - Payout)">
          <CheckCircleIcon className="w-7 h-7" />
          <div>
              <span className="text-xs text-gray-500 font-semibold uppercase">Saldo Disponibile</span>
              <p className="text-xl font-bold">€{finalValue.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-orange-500" title="Commissioni per ordini non ancora consegnati">
          <ClockIcon className="w-7 h-7" />
          <div>
              <span className="text-xs text-gray-500 font-semibold uppercase">In Attesa</span>
              <p className="text-xl font-bold">€{pendingRevenue.toFixed(2)}</p>
          </div>
        </div>
        <button onClick={onOpenPlatformCheck} className="flex items-center gap-2 text-left rounded-lg p-2 hover:bg-gray-100 transition-colors text-blue-600">
            <ShieldCheckIcon className="w-7 h-7" />
             <div>
                <span className="text-xs text-gray-500 font-semibold uppercase">Diagnostica</span>
                <p className="text-base font-bold">Check</p>
            </div>
        </button>
        <NotificationBell user={user} notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onViewNotification={onViewNotification} />
      </div>
    </header>
  );
};

export default Header;
