
import React, { useState, useMemo } from 'react';
import { Affiliate, UserStatus } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { approveUserRPC, rejectUserRPC, sendApprovalEmail } from '../database';

interface AffiliateManagerProps {
  affiliates: Affiliate[];
  onAddAffiliate: () => void;
  onEditAffiliate: (affiliate: Affiliate) => void;
  onDeleteAffiliate: (affiliateId: string) => void;
  onRefreshData?: () => void;
}

const AffiliateManager: React.FC<AffiliateManagerProps> = ({ affiliates, onAddAffiliate, onEditAffiliate, onDeleteAffiliate, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<UserStatus | 'all'>('pending');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredAffiliates = useMemo(() => {
    return affiliates.filter(a => {
        const status = a.status || 'pending';
        if (activeTab === 'all') return true;
        return status === activeTab;
    });
  }, [affiliates, activeTab]);

  const handleApprove = async (affiliate: Affiliate) => {
    if (loadingId) return;
    
    const isReactivating = affiliate.status === 'blocked';
    const msg = isReactivating 
        ? `Riattivare l'account di ${affiliate.name}? L'utente potrà accedere di nuovo alla piattaforma.`
        : `Approvare l'account di ${affiliate.name}? Verrà inviata una notifica di attivazione.`;
    
    if (!window.confirm(msg)) return;

    setLoadingId(affiliate.id);
    try {
        const { error } = await approveUserRPC(affiliate.id);
        if (error) {
            alert(`Errore Database: ${error.message}`);
            return;
        }
        sendApprovalEmail(affiliate.email, affiliate.name).catch(e => console.error("Email fallita:", e));
        
        if (onRefreshData) await onRefreshData();
        setActiveTab('active');
        
        alert(isReactivating ? "Account riattivato con successo." : "Account approvato e attivato.");
    } catch (e: any) {
        alert(`Eccezione: ${e.message}`);
    } finally {
        setLoadingId(null);
    }
  };

  const handleReject = async (affiliate: Affiliate) => {
    if (loadingId) return;
    
    const isDeactivating = affiliate.status === 'active';
    const msg = isDeactivating 
        ? `DISATTIVARE l'account di ${affiliate.name}? L'utente non potrà più effettuare il login.`
        : `RIFIUTARE la richiesta di ${affiliate.name}? L'account verrà spostato tra i bloccati.`;
    
    if (!window.confirm(msg)) return;

    setLoadingId(affiliate.id);
    try {
        const { error } = await rejectUserRPC(affiliate.id);
        if (error) throw error;
        
        if (onRefreshData) await onRefreshData();
        setActiveTab('blocked');
        
        alert(isDeactivating ? "Account disattivato." : "Richiesta rifiutata.");
    } catch (e: any) {
        alert(`Errore: ${e.message}`);
    } finally {
        setLoadingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-on-surface">Gestione Affiliati</h2>
            <p className="text-sm text-gray-500 mt-1">Gestisci i partner della piattaforma ({affiliates.length} totali)</p>
        </div>
        <button
          onClick={onAddAffiliate}
          className="bg-primary text-on-primary font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center gap-2"
        >
          <PlusIcon />
          Aggiungi Affiliato
        </button>
      </div>

      <div className="mb-6 bg-surface rounded-xl shadow-sm p-1 flex w-fit border border-gray-200">
          <button 
            onClick={() => setActiveTab('pending')} 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              In Attesa ({affiliates.filter(a => (a.status || 'pending') === 'pending').length})
          </button>
          <button 
            onClick={() => setActiveTab('active')} 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              Attivi ({affiliates.filter(a => a.status === 'active').length})
          </button>
          <button 
            onClick={() => setActiveTab('blocked')} 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'blocked' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              Bloccati ({affiliates.filter(a => a.status === 'blocked').length})
          </button>
      </div>

      <div className="bg-surface rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID Pubblico</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stato</th>
              <th className="relative px-6 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAffiliates.map((affiliate) => {
              const currentStatus = affiliate.status || 'pending';
              return (
                <tr key={affiliate.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded inline-block">{affiliate.short_id || '---'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{affiliate.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{affiliate.email}</td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        currentStatus === 'active' ? 'bg-green-100 text-green-800' : 
                        currentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {currentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      {currentStatus === 'pending' && (
                          <>
                              <button 
                                  onClick={() => handleApprove(affiliate)} 
                                  disabled={!!loadingId}
                                  className="flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm disabled:opacity-50"
                              >
                                  {loadingId === affiliate.id ? '...' : <><CheckCircleIcon className="w-4 h-4" /> Approva</>}
                              </button>
                              <button 
                                  onClick={() => handleReject(affiliate)} 
                                  disabled={!!loadingId}
                                  className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 font-bold disabled:opacity-50"
                              >
                                  Rifiuta
                              </button>
                          </>
                      )}

                      {currentStatus === 'active' && (
                          <button 
                              onClick={() => handleReject(affiliate)} 
                              disabled={!!loadingId}
                              className="flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                              {loadingId === affiliate.id ? '...' : <><XCircleIcon className="w-4 h-4" /> Disattiva Account</>}
                          </button>
                      )}

                      {currentStatus === 'blocked' && (
                          <button 
                              onClick={() => handleApprove(affiliate)} 
                              disabled={!!loadingId}
                              className="flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-green-600 border border-green-200 hover:bg-green-50 transition-all disabled:opacity-50"
                          >
                              {loadingId === affiliate.id ? '...' : <><CheckCircleIcon className="w-4 h-4" /> Riattiva Account</>}
                          </button>
                      )}

                      <button onClick={() => onEditAffiliate(affiliate)} className="text-gray-400 hover:text-primary p-2">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onDeleteAffiliate(affiliate.id)} className="text-gray-400 hover:text-red-600 p-2">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAffiliates.length === 0 && (
            <div className="p-20 text-center text-gray-400">
                <p className="text-lg">Nessun utente trovato in questa sezione.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateManager;
