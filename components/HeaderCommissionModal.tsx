import React, { useMemo } from 'react';
import { Sale, SaleStatus, User, UserRole, Product } from '../types';
import { TruckIcon } from './icons/TruckIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface HeaderCommissionModalProps {
  sales: Sale[];
  user: User;
  products: Product[];
}

const StatRow: React.FC<{ icon: React.ReactNode; label: string; count: number; value: number }> = ({ icon, label, count, value }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{count} {count === 1 ? 'ordine' : 'ordini'}</p>
      </div>
    </div>
    <p className="font-bold text-lg text-green-600">€{value.toFixed(2)}</p>
  </div>
);

const HeaderCommissionModal: React.FC<HeaderCommissionModalProps> = ({ sales, user, products }) => {
  const { pendingBreakdown, otherBreakdown } = useMemo(() => {
    const pending: Record<string, { count: number; totalCommission: number }> = {
      'In attesa': { count: 0, totalCommission: 0 },
      'Confermato': { count: 0, totalCommission: 0 },
      'Spedito': { count: 0, totalCommission: 0 },
      'Giacenza': { count: 0, totalCommission: 0 },
    };
    
    const other: Record<string, { count: number; totalCommission: number }> = {
      'Consegnato': { count: 0, totalCommission: 0 },
      'Svincolato': { count: 0, totalCommission: 0 },
      'Non ritirato': { count: 0, totalCommission: 0 },
    };

    let userSales = sales;
    const isAffiliate = user.role === UserRole.AFFILIATE;
    const isCustomerCare = user.role === UserRole.CUSTOMER_CARE;

    if (isAffiliate) {
        userSales = sales.filter(s => s.affiliateId === user.id);
    } else if (isCustomerCare) {
        userSales = sales.filter(s => s.lastContactedBy === user.id);
    }

    for (const sale of userSales) {
      let commission = 0;
      if (isAffiliate) {
          commission = sale.commissionAmount;
      } else if (isCustomerCare) {
          const product = products.find(p => p.id === sale.productId);
          if (product) {
              commission = (product.customerCareCommission || 0);
          }
      } else {
          // For admin/manager, show affiliate commissions by default.
          commission = sale.commissionAmount;
      }

      if (sale.status in pending) {
        pending[sale.status].count++;
        pending[sale.status].totalCommission += commission;
      } else if (sale.status in other) {
        other[sale.status].count++;
        other[sale.status].totalCommission += commission;
      }
    }

    return { pendingBreakdown: pending, otherBreakdown: other };
  }, [sales, user, products]);

  return (
    <div className="space-y-6">
        <div>
            <h4 className="text-lg font-bold text-on-surface mb-3">Commissioni in Attesa</h4>
            <div className="space-y-4">
                <StatRow
                    icon={<ClockIcon className="w-6 h-6 text-yellow-500" />}
                    label="In attesa"
                    count={pendingBreakdown['In attesa'].count}
                    value={pendingBreakdown['In attesa'].totalCommission}
                />
                <StatRow
                    icon={<ClockIcon className="w-6 h-6 text-blue-500" />}
                    label="Confermato"
                    count={pendingBreakdown['Confermato'].count}
                    value={pendingBreakdown['Confermato'].totalCommission}
                />
                <StatRow
                    icon={<TruckIcon className="w-6 h-6 text-indigo-500" />}
                    label="Spedito"
                    count={pendingBreakdown['Spedito'].count}
                    value={pendingBreakdown['Spedito'].totalCommission}
                />
                <StatRow
                    icon={<ClockIcon className="w-6 h-6 text-orange-500" />}
                    label="Giacenza"
                    count={pendingBreakdown['Giacenza'].count}
                    value={pendingBreakdown['Giacenza'].totalCommission}
                />
            </div>
        </div>
        <div>
            <h4 className="text-lg font-bold text-on-surface mb-3">Altri Stati</h4>
             <div className="space-y-4">
                <StatRow
                    icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />}
                    label="Consegnato"
                    count={otherBreakdown['Consegnato'].count}
                    value={otherBreakdown['Consegnato'].totalCommission}
                />
                <StatRow
                    icon={<CheckCircleIcon className="w-6 h-6 text-teal-500" />}
                    label="Svincolato"
                    count={otherBreakdown['Svincolato'].count}
                    value={otherBreakdown['Svincolato'].totalCommission}
                />
                <StatRow
                    icon={<XCircleIcon className="w-6 h-6 text-red-500" />}
                    label="Non Ritirato"
                    count={otherBreakdown['Non ritirato'].count}
                    value={otherBreakdown['Non ritirato'].totalCommission}
                />
            </div>
        </div>
    </div>
  );
};

export default HeaderCommissionModal;