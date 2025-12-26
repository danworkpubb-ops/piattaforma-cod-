import React, { useState, useMemo } from 'react';
import { Product, ProductVariant } from '../types';
import Modal from './Modal';
import { PencilIcon } from './icons/PencilIcon';

// StockEditForm component to be placed inside the modal
const StockEditForm: React.FC<{
    productName: string;
    variantName?: string;
    currentStock: number;
    onSave: (newStock: number) => void;
    onClose: () => void;
}> = ({ productName, variantName, currentStock, onSave, onClose }) => {
    const [newStock, setNewStock] = useState(currentStock.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const stockValue = parseInt(newStock, 10);
        if (!isNaN(stockValue) && stockValue >= 0) {
            onSave(stockValue);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h3 className="text-lg font-bold">{productName}</h3>
                {variantName && <p className="text-sm text-gray-600">{variantName}</p>}
            </div>
            <div>
                <label htmlFor="current-stock" className="block text-sm font-medium text-gray-700">Stock Attuale</label>
                <input id="current-stock" type="text" value={currentStock} readOnly className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm" />
            </div>
             <div>
                <label htmlFor="new-stock" className="block text-sm font-medium text-gray-700">Nuovo Stock</label>
                <input 
                    id="new-stock" 
                    type="number" 
                    value={newStock} 
                    onChange={(e) => setNewStock(e.target.value)}
                    min="0"
                    required
                    autoFocus
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" 
                />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Annulla</button>
                <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark">Salva</button>
            </div>
        </form>
    );
};


interface InventoryPageProps {
    products: Product[];
    onUpdateStock: (productId: string, updates: { stockQuantity: number } | { variantId: string, stockQuantity: number }) => Promise<void>;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ products, onUpdateStock }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
    const [editingStock, setEditingStock] = useState<{ product: Product; variant?: ProductVariant } | null>(null);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.refNumber.toLowerCase().includes(searchQuery.toLowerCase());
            if (!nameMatch) return false;

            if (stockFilter === 'all') return true;

            const checkStockLevel = (stock: number) => {
                if (stockFilter === 'out') return stock <= 0;
                if (stockFilter === 'low') return stock > 0 && stock <= 10;
                return false;
            };

            if (p.variants && p.variants.length > 0) {
                return p.variants.some(v => checkStockLevel(v.stockQuantity ?? 0));
            } else {
                return checkStockLevel(p.stockQuantity ?? 0);
            }
        });
    }, [products, searchQuery, stockFilter]);

    const handleSaveStock = async (newStock: number) => {
        if (!editingStock) return;
        
        const { product, variant } = editingStock;

        if (variant) {
            await onUpdateStock(product.id, { variantId: variant.id, stockQuantity: newStock });
        } else {
            await onUpdateStock(product.id, { stockQuantity: newStock });
        }
        setEditingStock(null);
    };
    
    const getStockStatusColor = (stock: number) => {
        if (stock <= 0) return 'text-red-600';
        if (stock <= 10) return 'text-yellow-600';
        return 'text-gray-800';
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-on-surface mb-6">Gestione Magazzino</h2>

            <div className="bg-surface rounded-xl shadow-md p-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Cerca per nome o REF..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                     <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value as any)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    >
                        <option value="all">Tutti gli stati</option>
                        <option value="low">In esaurimento (1-10 pz)</option>
                        <option value="out">Esauriti (0 pz)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredProducts.map(product => (
                    <div key={product.id} className="bg-surface rounded-xl shadow-md p-4">
                        <div className="flex items-start gap-4">
                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                            <div className="flex-grow">
                                <h3 className="font-bold text-on-surface">{product.name}</h3>
                                <p className="text-xs text-gray-500 font-mono">{product.refNumber}</p>

                                <div className="mt-2 pt-2 border-t">
                                    {product.variants && product.variants.length > 0 ? (
                                        <div className="space-y-2">
                                            {product.variants.map(variant => (
                                                <div key={variant.id} className="flex justify-between items-center text-sm p-1 hover:bg-gray-50 rounded-md">
                                                    <span>{variant.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-bold w-16 text-right ${getStockStatusColor(variant.stockQuantity)}`}>{variant.stockQuantity} pz</span>
                                                        <button onClick={() => setEditingStock({ product, variant })} className="text-primary hover:text-primary-dark p-1" title="Modifica stock variante"><PencilIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center text-sm p-1">
                                            <span>Stock Unico</span>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold w-16 text-right ${getStockStatusColor(product.stockQuantity ?? 0)}`}>{product.stockQuantity ?? 0} pz</span>
                                                <button onClick={() => setEditingStock({ product })} className="text-primary hover:text-primary-dark p-1" title="Modifica stock"><PencilIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {filteredProducts.length === 0 && (
                <div className="text-center py-16 bg-surface rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">Nessun prodotto trovato</h3>
                    <p className="text-gray-500 mt-2">Prova a modificare i filtri di ricerca.</p>
                </div>
            )}
            
            <Modal isOpen={!!editingStock} onClose={() => setEditingStock(null)} title="Modifica Stock">
                {editingStock && (
                    <StockEditForm
                        productName={editingStock.product.name}
                        variantName={editingStock.variant?.name}
                        currentStock={editingStock.variant?.stockQuantity ?? editingStock.product.stockQuantity ?? 0}
                        onSave={handleSaveStock}
                        onClose={() => setEditingStock(null)}
                    />
                )}
            </Modal>
        </div>
    );
};
export default InventoryPage;