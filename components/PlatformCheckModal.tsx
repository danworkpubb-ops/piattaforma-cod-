// FIX: Added `useMemo` to the import statement to resolve reference errors and subsequent type inference issues.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sale, PlatformSettings, User, UserRole } from '../types';
import { supabase } from '../database';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface PlatformCheckModalProps {
    user: User;
    sales: Sale[];
    settings: PlatformSettings;
    onClose: () => void;
}

interface CheckResult {
    status: 'pending' | 'ok' | 'error' | 'warning';
    message: string;
}

const CheckItem: React.FC<{ title: string; description: string; result: CheckResult }> = ({ title, description, result }) => {
    const getStatusIcon = () => {
        switch (result.status) {
            case 'ok':
                return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
            case 'error':
                return <XCircleIcon className="w-6 h-6 text-red-500" />;
            case 'warning':
                return <XCircleIcon className="w-6 h-6 text-yellow-500" />;
            case 'pending':
                return <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>;
            default:
                return null;
        }
    };

    const getBorderColor = () => {
        switch (result.status) {
            case 'ok': return 'border-green-200';
            case 'error': return 'border-red-200';
            case 'warning': return 'border-yellow-200';
            default: return 'border-gray-200';
        }
    };

    return (
        <div className={`p-4 border rounded-lg ${getBorderColor()} bg-gray-50`}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>
                <div className="flex-grow">
                    <h4 className="font-bold text-gray-800">{title}</h4>
                    <p className="text-sm text-gray-500">{description}</p>
                    <p className={`text-sm mt-2 font-semibold ${result.status === 'error' ? 'text-red-600' : result.status === 'warning' ? 'text-yellow-700' : 'text-gray-700'}`}>
                        {result.message}
                    </p>
                </div>
            </div>
        </div>
    );
};

const PlatformCheckModal: React.FC<PlatformCheckModalProps> = ({ user, sales, settings, onClose }) => {
    const initialCheckState = useMemo(() => {
        const checks: Record<string, CheckResult> = {
            dbConnection: { status: 'pending', message: 'Verifica in corso...' },
            orderReception: { status: 'pending', message: 'Verifica in corso...' },
        };
        if ([UserRole.ADMIN, UserRole.MANAGER, UserRole.LOGISTICS].includes(user.role)) {
            checks.paccoFacile = { status: 'pending', message: 'Verifica in corso...' };
        }
        if ([UserRole.ADMIN, UserRole.MANAGER].includes(user.role)) {
            checks.globalWebhook = { status: 'pending', message: 'Verifica in corso...' };
        }
        return checks;
    }, [user.role]);


    const [results, setResults] = useState<Record<string, CheckResult>>(initialCheckState);
    const [isRunning, setIsRunning] = useState(false);

    const runAllChecks = useCallback(async () => {
        setIsRunning(true);
        setResults(initialCheckState);
        
        const tempResults: Record<string, CheckResult> = { ...initialCheckState };

        // Check 1: Database Connection
        try {
            const { error } = await supabase.from('settings').select('key').limit(1);
            if (error) throw error;
            tempResults.dbConnection = { status: 'ok', message: 'Connessione al database riuscita.' };
        } catch (error) {
            tempResults.dbConnection = { status: 'error', message: `Errore di connessione al database: ${(error as Error).message}` };
        }

        // Check 2: Order Reception
        const sortedSales = [...sales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
        const isAffiliate = user.role === UserRole.AFFILIATE;
        
        if (sortedSales.length > 0) {
            const lastSaleDate = new Date(sortedSales[0].saleDate);
            const now = new Date();
            const hoursDiff = (now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                tempResults.orderReception = { status: 'warning', message: `Attenzione: ${isAffiliate ? 'Il tuo ultimo ordine' : "L'ultimo ordine"} è stato ricevuto più di 24 ore fa (${lastSaleDate.toLocaleString('it-IT')}). Controllare i form di vendita.` };
            } else {
                tempResults.orderReception = { status: 'ok', message: `${isAffiliate ? 'Il tuo ultimo ordine' : "L'ultimo ordine"} è stato ricevuto correttamente il ${lastSaleDate.toLocaleString('it-IT')}.` };
            }
        } else {
            tempResults.orderReception = { status: 'warning', message: isAffiliate ? 'Nessun ordine trovato per il tuo account.' : 'Nessun ordine presente nella piattaforma.' };
        }

        // Check 3: PaccoFacile API Key
        if (initialCheckState.paccoFacile) {
            if (settings.paccofacile_api_key && settings.paccofacile_api_key.trim() !== '') {
                tempResults.paccoFacile = { status: 'ok', message: 'La chiave API per PaccoFacile.it è configurata.' };
            } else {
                tempResults.paccoFacile = { status: 'error', message: 'La chiave API per PaccoFacile.it non è configurata. La creazione delle spedizioni automatiche non funzionerà.' };
            }
        }
        
        // Check 4: Global Webhook
        if (initialCheckState.globalWebhook) {
            if (settings.global_webhook_url && settings.global_webhook_url.trim() !== '') {
                 tempResults.globalWebhook = { status: 'ok', message: 'Il webhook globale è configurato.' };
            } else {
                 tempResults.globalWebhook = { status: 'warning', message: 'Il webhook globale non è configurato. I dati degli ordini non verranno inviati a sistemi esterni in automatico.' };
            }
        }
        
        setResults(tempResults);
        setIsRunning(false);
    }, [user, sales, settings, initialCheckState]);

    useEffect(() => {
        runAllChecks();
    }, [runAllChecks]);

    const overallStatus = useMemo(() => {
        // FIX: Explicitly type the parameter in the map function to resolve the 'Property 'status' does not exist on type 'unknown'' error.
        const statuses = Object.values(results).map((r: CheckResult) => r.status);
        if (statuses.includes('pending')) return 'pending';
        if (statuses.includes('error')) return 'error';
        if (statuses.includes('warning')) return 'warning';
        return 'ok';
    }, [results]);

    const getOverallMessage = () => {
        switch(overallStatus) {
            case 'ok':
                return { text: 'Tutto sembra funzionare correttamente!', color: 'text-green-600' };
            case 'error':
                return { text: 'Sono stati rilevati problemi critici!', color: 'text-red-600' };
            case 'warning':
                return { text: 'Sono stati rilevati avvisi non critici.', color: 'text-yellow-600' };
            default:
                return { text: 'Analisi in corso...', color: 'text-gray-500' };
        }
    };
    const { text: overallMessage, color: overallColor } = getOverallMessage();

    return (
        <div className="space-y-6">
            <div className={`p-4 text-center rounded-lg ${overallStatus === 'ok' ? 'bg-green-50' : overallStatus === 'error' ? 'bg-red-50' : overallStatus === 'warning' ? 'bg-yellow-50' : 'bg-gray-100'}`}>
                <h3 className={`text-lg font-bold ${overallColor}`}>{overallMessage}</h3>
            </div>

            <div className="space-y-4">
                <CheckItem
                    title="Connessione Database"
                    description="Verifica la capacità della piattaforma di connettersi e leggere i dati dal database principale."
                    result={results.dbConnection}
                />
                <CheckItem
                    title={user.role === UserRole.AFFILIATE ? "Ricezione Tuoi Ordini" : "Ricezione Ordini"}
                    description="Controlla la data e l'ora dell'ultimo ordine ricevuto per assicurarsi che i form funzionino."
                    result={results.orderReception}
                />
                {results.paccoFacile && <CheckItem
                    title="API PaccoFacile.it"
                    description="Verifica che la chiave API per il servizio di spedizione sia presente nelle impostazioni."
                    result={results.paccoFacile}
                />}
                {results.globalWebhook && <CheckItem
                    title="Webhook Globale"
                    description="Controlla se è stato impostato un URL per inviare i dati di tutti gli ordini a un sistema esterno."
                    result={results.globalWebhook}
                />}
            </div>

            <div className="mt-8 flex justify-end gap-4">
                <button
                    type="button"
                    onClick={runAllChecks}
                    disabled={isRunning}
                    className="flex items-center gap-2 bg-secondary text-primary font-bold py-2 px-4 rounded-lg hover:bg-secondary-light transition-colors duration-200 disabled:opacity-60"
                >
                    <RefreshIcon className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
                    {isRunning ? 'Verificando...' : 'Riesegui Controlli'}
                </button>
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                    Chiudi
                </button>
            </div>
        </div>
    );
};

export default PlatformCheckModal;
