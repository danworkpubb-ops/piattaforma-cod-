import React, { useMemo } from 'react';
import { Sale } from '../types';

interface SalesChartProps {
  sales: Sale[];
  granularity: 'hour' | 'day';
}

const SalesChart: React.FC<SalesChartProps> = ({ sales, granularity }) => {
  const chartData = useMemo(() => {
    if (granularity === 'hour') {
      const salesByHour: { [key: string]: number } = {};
      // Initialize all hours to 0 to ensure a full 24h chart
      for (let i = 0; i < 24; i++) {
        salesByHour[i.toString().padStart(2, '0')] = 0;
      }
      
      sales.forEach(sale => {
        const hour = new Date(sale.saleDate).getHours().toString().padStart(2, '0');
        if (salesByHour[hour] !== undefined) {
          salesByHour[hour] += sale.saleAmount;
        }
      });
      
      return Object.entries(salesByHour).map(([hour, total]) => ({
        label: `${hour}:00`,
        total
      }));
    } else { // granularity === 'day'
      const salesByDay: { [key: string]: number } = {};
      sales.forEach(sale => {
        const day = new Date(sale.saleDate).toISOString().split('T')[0];
        if (!salesByDay[day]) {
          salesByDay[day] = 0;
        }
        salesByDay[day] += sale.saleAmount;
      });
      
      return Object.entries(salesByDay)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([day, total]) => ({
          label: new Date(day).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          total
        }));
    }
  }, [sales, granularity]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    const max = Math.max(...chartData.map(d => d.total));
    return max > 0 ? max : 1; // Return at least 1 to prevent full height bars for 0 values
  }, [chartData]);
  
  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Nessun dato di vendita per il periodo selezionato.</div>
  }

  // Use a different gap and bar width for hourly view to fit all bars
  const chartGap = granularity === 'hour' ? 'gap-1' : 'gap-2';
  const barWidth = granularity === 'hour' ? 'w-full' : 'w-3/4';

  return (
    <div className={`w-full h-full flex items-end justify-around ${chartGap} border-l border-b border-gray-200 pl-2 pt-4`}>
      {chartData.map((data, index) => (
        <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
          <div
            className={`${barWidth} bg-blue-200 hover:bg-primary rounded-t-md transition-all duration-300`}
            style={{ height: `${(data.total / maxValue) * 100}%` }}
          >
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                €{data.total.toFixed(2)}
            </div>
          </div>
          <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
             {/* For hourly view, show label every 2 hours to prevent clutter */}
            {(granularity === 'hour' && parseInt(data.label.split(':')[0]) % 2 === 0) || granularity === 'day' ? data.label : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SalesChart;