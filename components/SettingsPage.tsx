
import React, { useState, useEffect, useMemo } from 'react';
import { PlatformSettings, User, UserRole, Product } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import SearchableSelect from './SearchableSelect';

interface SettingsPageProps {
    user: User;
    settings: PlatformSettings;
    products: Product[];
    onSaveAppearance: (settingsData: Partial<PlatformSettings> & { logoFile?: File | null }) => Promise<void>;
    onSaveIntegrations: (settingsData: Partial<PlatformSettings>) => Promise<void>;
    onSaveIpBlocklist: (ips: string[]) => Promise<void>;
}

type AlignmentOption = 'flex-start' | 'center' | 'flex-end';
type ActiveTab = 'ip' | 'appearance' | 'integrations' | 'calculator';

const LogoSizeControl: React.FC<{
    title: string,
    previewContent: React.ReactNode,
    width: string,
    height: string,
    onWidthChange: (value: string) => void,
    onHeightChange: (value: string) => void,
    children?: React.ReactNode,
}> = ({ title, previewContent, width, height, onWidthChange, onHeightChange, children }) => {
    return (
        <div className="p-4 border rounded-lg bg-white">
            <h4 className="font-semibold text-gray-700 mb-3">{title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex items-center justify-center bg-gray-100 rounded-md p-4 min-h-[120px]">
                    {previewContent}
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor={`${title}-width`} className="text-sm font-medium text-gray-600 flex justify-between">
                            <span>Larghezza</span>
                            <span>{width}px</span>
                        </label>
                        <input
                            type="range"
                            id={`${title}-width`}
                            min="20"
                            max="200"
                            value={width}
                            onChange={(e) => onWidthChange(e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label htmlFor={`${title}-height`} className="text-sm font-medium text-gray-600 flex justify-between">
                            <span>Altezza</span>
                            <span>{height}px</span>
                        </label>
                        <input
                            type="range"
                            id={`${title}-height`}
                            min="20"
                            max="200"
                            value={height}
                            onChange={(e) => onHeightChange(e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

const ProfitCalculator: React.FC<{ products: Product[] }> = ({ products }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('single');

  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name, refNumber: p.refNumber })), [products]);
  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);

  const offerOptions = useMemo(() => {
    if (!selectedProduct) return [];
    const singleOffer = { value: 'single', label: `1x Prodotto Singolo - €${selectedProduct.price.toFixed(2)}` };
    const bundleOffers = (selectedProduct.bundleOptions || []).map(b => ({
      value: b.id,
      label: `${b.quantity}x Offerta Multi-pack - €${b.price.toFixed(2)}`
    }));
    return [singleOffer, ...bundleOffers];
  }, [selectedProduct]);

  useEffect(() => {
    setSelectedOfferId('single');
  }, [selectedProductId]);

  const calculation = useMemo(() => {
    if (!selectedProduct) return null;

    let offer;
    if (selectedOfferId === 'single') {
        offer = {
            price: selectedProduct.price,
            quantity: 1,
            commissionValue: selectedProduct.commissionValue,
            platformFee: selectedProduct.platformFee || 0,
        };
    } else {
        const bundle = selectedProduct.bundleOptions?.find(b => b.id === selectedOfferId);
        if (!bundle) return null;
        offer = {
            price: bundle.price,
            quantity: bundle.quantity,
            commissionValue: bundle.commissionValue,
            platformFee: bundle.platformFee || 0,
        };
    }
    
    const costOfGoods = (selectedProduct.costOfGoods || 0) * offer.quantity;
    const shippingCost = selectedProduct.shippingCost || 0;
    const shippingCharge = selectedProduct.shippingCharge || 0;
    const effectiveShippingCost = !(selectedProduct.freeShipping ?? true) ? Math.max(0, shippingCost - shippingCharge) : shippingCost;
    const fulfillmentCost = selectedProduct.fulfillmentCost || 0;
    const customerCareCommission = selectedProduct.customerCareCommission || 0;
    const affiliateCommission = offer.commissionValue;

    const totalCosts = costOfGoods + effectiveShippingCost + fulfillmentCost + customerCareCommission + affiliateCommission;
    const platformProfit = offer.platformFee;
    const totalRevenue = offer.price;

    return { totalRevenue, totalCosts, platformProfit, costOfGoods, shippingCost: effectiveShippingCost, fulfillmentCost, customerCareCommission, affiliateCommission };
  }, [selectedProduct, selectedOfferId]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Calcolatore di Profitto Piattaforma</h3>
        <p className="text-sm text-gray-500 mt-1">Stima il guadagno della piattaforma per singola vendita.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Seleziona Prodotto</label>
          <SearchableSelect options={productOptions} value={selectedProductId} onChange={setSelectedProductId} placeholder="Cerca un prodotto..." />
        </div>
        {selectedProduct && (
          <div>
            <label htmlFor="offer-select" className="block text-sm font-medium text-gray-700">Seleziona Offerta</label>
            <select id="offer-select" value={selectedOfferId} onChange={e => setSelectedOfferId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
              {offerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {calculation && selectedProduct && (
        <div className="mt-6 bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h4 className="font-bold text-lg text-blue-900 mb-4">Analisi Proiezione</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center"><span className="text-gray-600">Ricavo Lordo</span><span className="font-semibold text-green-600 text-base">+ €{calculation.totalRevenue.toFixed(2)}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">Costi Diretti (Stock + Sped)</span><span className="font-semibold text-red-600">- €{(calculation.costOfGoods + calculation.shippingCost).toFixed(2)}</span></div>
            <div className="flex justify-between items-center border-t border-blue-200 pt-3 mt-4"><span className="font-bold text-blue-900 text-base">Margine Piattaforma</span><span className="font-extrabold text-primary text-xl">€{calculation.platformProfit.toFixed(2)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ user, settings, products, onSaveAppearance, onSaveIntegrations, onSaveIpBlocklist }) => {
    const isAdmin = user.role === UserRole.ADMIN;
    const [activeTab, setActiveTab] = useState<ActiveTab>('ip');

    const [logoInputMethod, setLogoInputMethod] = useState<'upload' | 'url'>('upload');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSavingAppearance, setIsSavingAppearance] = useState(false);
    const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);
    const [isSavingIpBlocklist, setIsSavingIpBlocklist] = useState(false);

    const [sizes, setSizes] = useState({
        sidebarOpenWidth: '80', sidebarOpenHeight: '56', sidebarClosedWidth: '56', sidebarClosedHeight: '56', loginWidth: '128', loginHeight: '128',
    });
    
    const [appearance, setAppearance] = useState({
        sidebarOpenBgColor: '#1a237e', sidebarOpenHAlign: 'center' as AlignmentOption, sidebarOpenVAlign: 'center' as AlignmentOption,
    });
    
    const [integrations, setIntegrations] = useState({
        apiKey: '',
        spediamoKey: '',
        senderName: '', senderCompany: '', senderAddress: '', senderCity: '', senderZip: '', senderProvince: '', senderPhone: '', senderEmail: '',
        globalWebhookUrl: '', whatsappTemplate: '',
    });

    const [blockedIps, setBlockedIps] = useState<string[]>([]);
    const [newIp, setNewIp] = useState('');
    const [ipError, setIpError] = useState('');

    useEffect(() => {
        const currentLogo = settings.platform_logo || '';
        setLogoPreview(currentLogo);
        setLogoUrl(currentLogo);
        setLogoInputMethod(currentLogo.startsWith('http') ? 'url' : 'upload');

        setSizes({
            sidebarOpenWidth: settings.logo_sidebar_open_width || '80',
            sidebarOpenHeight: settings.logo_sidebar_open_height || '56',
            sidebarClosedWidth: settings.logo_sidebar_closed_width || '56',
            sidebarClosedHeight: settings.logo_sidebar_closed_height || '56',
            loginWidth: settings.logo_login_width || '128',
            loginHeight: settings.logo_login_height || '128',
        });
        setAppearance({
            sidebarOpenBgColor: settings.sidebar_open_bg_color || '#1a237e',
            sidebarOpenHAlign: settings.sidebar_open_horizontal_align || 'center',
            sidebarOpenVAlign: settings.sidebar_open_vertical_align || 'center',
        });
        setIntegrations({
            apiKey: settings.paccofacile_api_key || '',
            spediamoKey: settings.spediamo_api_key || '',
            senderName: settings.sender_name || '',
            senderCompany: settings.sender_company || '',
            senderAddress: settings.sender_address || '',
            senderCity: settings.sender_city || '',
            senderZip: settings.sender_zip || '',
            senderProvince: settings.sender_province || '',
            senderPhone: settings.sender_phone || '',
            senderEmail: settings.sender_email || '',
            globalWebhookUrl: settings.global_webhook_url || '',
            whatsappTemplate: settings.whatsapp_welcome_template || '',
        });
        setBlockedIps(settings.blocked_ips || []);
    }, [settings]);

    const handleIntegrationsChange = (key: keyof typeof integrations, value: string) => {
        setIntegrations(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveIntegrations = async () => {
        setIsSavingIntegrations(true);
        const settingsData = {
            paccofacile_api_key: integrations.apiKey,
            spediamo_api_key: integrations.spediamoKey,
            sender_name: integrations.senderName,
            sender_company: integrations.senderCompany,
            sender_address: integrations.senderAddress,
            sender_city: integrations.senderCity,
            sender_zip: integrations.senderZip,
            sender_province: integrations.senderProvince,
            sender_phone: integrations.senderPhone,
            sender_email: integrations.senderEmail,
            global_webhook_url: integrations.globalWebhookUrl,
            whatsapp_welcome_template: integrations.whatsappTemplate,
        };
        await onSaveIntegrations(settingsData);
        setIsSavingIntegrations(false);
    };

    const handleSaveAppearance = async () => {
        setIsSavingAppearance(true);
        const settingsData: Partial<PlatformSettings> & { logoFile?: File | null } = {
            logo_sidebar_open_width: sizes.sidebarOpenWidth,
            logo_sidebar_open_height: sizes.sidebarOpenHeight,
            logo_sidebar_closed_width: sizes.sidebarClosedWidth,
            logo_sidebar_closed_height: sizes.sidebarClosedHeight,
            logo_login_width: sizes.loginWidth,
            logo_login_height: sizes.loginHeight,
            sidebar_open_bg_color: appearance.sidebarOpenBgColor,
            sidebar_open_horizontal_align: appearance.sidebarOpenHAlign,
            sidebar_open_vertical_align: appearance.sidebarOpenVAlign,
        };

        if (logoInputMethod === 'url') {
            settingsData.platform_logo = logoUrl;
            settingsData.logoFile = null;
        } else if (logoInputMethod === 'upload') {
            settingsData.logoFile = logoFile;
        }

        await onSaveAppearance(settingsData);
        setIsSavingAppearance(false);
    };

    const handleAddIp = () => {
        setIpError('');
        const ip = newIp.trim();
        const ipv4Regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;
        if (!ipv4Regex.test(ip)) {
            setIpError('Inserisci un indirizzo IPv4 valido.');
            return;
        }
        if (blockedIps.includes(ip)) {
            setIpError('Questo IP è già presente nella lista.');
            return;
        }
        setBlockedIps(prev => [...prev, ip]);
        setNewIp('');
    };

    const handleRemoveIp = (ipToRemove: string) => {
        setBlockedIps(prev => prev.filter(ip => ip !== ipToRemove));
    };

    const handleSaveIpBlocklist = async () => {
        setIsSavingIpBlocklist(true);
        await onSaveIpBlocklist(blockedIps);
        setIsSavingIpBlocklist(false);
    };

    const hasIntegrationsChanges = () => {
        return integrations.apiKey !== (settings.paccofacile_api_key || '') ||
               integrations.spediamoKey !== (settings.spediamo_api_key || '') ||
               integrations.senderName !== (settings.sender_name || '') ||
               integrations.senderCompany !== (settings.sender_company || '') ||
               integrations.senderAddress !== (settings.sender_address || '') ||
               integrations.senderCity !== (settings.sender_city || '') ||
               integrations.senderZip !== (settings.sender_zip || '') ||
               integrations.senderProvince !== (settings.sender_province || '') ||
               integrations.senderPhone !== (settings.sender_phone || '') ||
               integrations.senderEmail !== (settings.sender_email || '') ||
               integrations.globalWebhookUrl !== (settings.global_webhook_url || '') ||
               integrations.whatsappTemplate !== (settings.whatsapp_welcome_template || '');
    };

    const tabs = [
        { key: 'ip', label: 'Blocco IP', roles: [UserRole.ADMIN, UserRole.MANAGER] },
        { key: 'appearance', label: 'Aspetto', roles: [UserRole.ADMIN] },
        { key: 'integrations', label: 'Integrazioni', roles: [UserRole.ADMIN] },
        { key: 'calculator', label: 'Calcolatore Profitto', roles: [UserRole.ADMIN] },
    ].filter(tab => tab.roles.includes(user.role));

    const logoPreviewStyle = (w: string, h: string) => ({
        width: `${w}px`,
        height: `${h}px`,
        objectFit: 'contain' as const,
    });

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-on-surface mb-6 tracking-tight">Impostazioni Piattaforma</h2>
            <div className="bg-surface rounded-2xl shadow-xl max-w-5xl mx-auto overflow-hidden border border-gray-100">
                <div className="border-b border-gray-200 bg-gray-50/50">
                    <nav className="-mb-px flex gap-8 px-8" aria-label="Tabs">
                         {tabs.map(tab => (
                             <button key={tab.key} onClick={() => setActiveTab(tab.key as ActiveTab)} className={`whitespace-nowrap py-5 px-1 border-b-4 font-bold text-sm transition-all ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{tab.label}</button>
                         ))}
                    </nav>
                </div>
                <div className="p-8">
                    {/* TAB BLOCCO IP */}
                    {activeTab === 'ip' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Blocklist Indirizzi IP</h3>
                                <p className="text-sm text-gray-500 mt-1">Gli ordini provenienti da questi indirizzi IP verranno bloccati automaticamente.</p>
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="Esempio: 1.2.3.4" className="flex-grow p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                <button onClick={handleAddIp} className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-all">Aggiungi</button>
                            </div>
                            {ipError && <p className="text-red-500 text-xs font-bold px-2">{ipError}</p>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {blockedIps.map(ip => (
                                    <div key={ip} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 font-mono text-sm">
                                        <span>{ip}</span>
                                        <button onClick={() => handleRemoveIp(ip)} className="hover:text-red-900"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {blockedIps.length === 0 && <p className="col-span-full text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed">Nessun IP bloccato.</p>}
                            </div>
                            <div className="pt-6 border-t flex justify-end">
                                <button onClick={handleSaveIpBlocklist} disabled={isSavingIpBlocklist} className="bg-primary text-white font-bold py-3 px-8 rounded-xl disabled:bg-gray-300">
                                    {isSavingIpBlocklist ? 'Salvataggio...' : 'Salva Blocklist'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB ASPETTO */}
                    {activeTab === 'appearance' && isAdmin && (
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Personalizzazione Grafica</h3>
                                <p className="text-sm text-gray-500 mt-1">Carica il logo e definisci le dimensioni per ogni sezione.</p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="p-4 border rounded-xl bg-gray-50">
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Sorgente Logo</label>
                                        <div className="flex gap-4 mb-4">
                                            <button onClick={() => setLogoInputMethod('upload')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm border transition-all ${logoInputMethod === 'upload' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'}`}>Carica File</button>
                                            <button onClick={() => setLogoInputMethod('url')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm border transition-all ${logoInputMethod === 'url' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'}`}>Indirizzo URL</button>
                                        </div>
                                        {logoInputMethod === 'upload' ? (
                                            <input type="file" accept="image/*" onChange={(e) => { if(e.target.files?.[0]) { setLogoFile(e.target.files[0]); setLogoPreview(URL.createObjectURL(e.target.files[0])); } }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                                        ) : (
                                            <input type="text" value={logoUrl} onChange={(e) => { setLogoUrl(e.target.value); setLogoPreview(e.target.value); }} placeholder="https://..." className="w-full p-2 border rounded-md text-sm" />
                                        )}
                                    </div>
                                    <LogoSizeControl title="Sidebar Aperta" width={sizes.sidebarOpenWidth} height={sizes.sidebarOpenHeight} onWidthChange={(v) => setSizes(s=>({...s, sidebarOpenWidth: v}))} onHeightChange={(v) => setSizes(s=>({...s, sidebarOpenHeight: v}))} previewContent={<div className="bg-primary p-4 rounded-md flex items-center justify-center min-w-[120px]">{logoPreview ? <img src={logoPreview} alt="Preview" style={logoPreviewStyle(sizes.sidebarOpenWidth, sizes.sidebarOpenHeight)} /> : <span className="text-white font-bold">MWS</span>}</div>} />
                                    <LogoSizeControl title="Sidebar Chiusa" width={sizes.sidebarClosedWidth} height={sizes.sidebarClosedHeight} onWidthChange={(v) => setSizes(s=>({...s, sidebarClosedWidth: v}))} onHeightChange={(v) => setSizes(s=>({...s, sidebarClosedHeight: v}))} previewContent={<div className="bg-primary p-4 rounded-md flex items-center justify-center min-w-[80px]">{logoPreview ? <img src={logoPreview} alt="Preview" style={logoPreviewStyle(sizes.sidebarClosedWidth, sizes.sidebarClosedHeight)} /> : <span className="text-white font-bold">M</span>}</div>} />
                                </div>
                                <div className="space-y-6">
                                    <LogoSizeControl title="Schermata Login" width={sizes.loginWidth} height={sizes.loginHeight} onWidthChange={(v) => setSizes(s=>({...s, loginWidth: v}))} onHeightChange={(v) => setSizes(s=>({...s, loginHeight: v}))} previewContent={<div className="bg-white border p-6 rounded-xl shadow-sm flex flex-col items-center gap-2">{logoPreview ? <img src={logoPreview} alt="Preview" style={logoPreviewStyle(sizes.loginWidth, sizes.loginHeight)} /> : <span className="text-primary font-black text-2xl">MWS</span>}<span className="text-xs text-gray-400">Piattaforma Affiliate 2.0</span></div>} />
                                    <div className="p-6 border rounded-xl bg-gray-50 space-y-4">
                                        <h4 className="font-bold text-gray-700">Colori e Allineamento Sidebar</h4>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sfondo Header Sidebar</label>
                                            <input type="color" value={appearance.sidebarOpenBgColor} onChange={(e) => setAppearance(a=>({...a, sidebarOpenBgColor: e.target.value}))} className="w-full h-10 p-0 border rounded-lg cursor-pointer overflow-hidden" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Allin. Orizzontale</label>
                                                <select value={appearance.sidebarOpenHAlign} onChange={(e) => setAppearance(a=>({...a, sidebarOpenHAlign: e.target.value as AlignmentOption}))} className="w-full p-2 border rounded-lg text-sm font-bold">
                                                    <option value="flex-start">Sinistra</option>
                                                    <option value="center">Centro</option>
                                                    <option value="flex-end">Destra</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Allin. Verticale</label>
                                                <select value={appearance.sidebarOpenVAlign} onChange={(e) => setAppearance(a=>({...a, sidebarOpenVAlign: e.target.value as AlignmentOption}))} className="w-full p-2 border rounded-lg text-sm font-bold">
                                                    <option value="flex-start">Alto</option>
                                                    <option value="center">Centro</option>
                                                    <option value="flex-end">Basso</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t flex justify-end">
                                <button onClick={handleSaveAppearance} disabled={isSavingAppearance} className="bg-primary text-white font-bold py-3 px-8 rounded-xl disabled:bg-gray-300">
                                    {isSavingAppearance ? 'Salvataggio...' : 'Salva Impostazioni Grafiche'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB INTEGRAZIONI (Già corretto prima) */}
                    {activeTab === 'integrations' && isAdmin && (
                         <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Integrazioni e API</h3>
                                <div className="mt-6 space-y-6">
                                     <div>
                                        <h4 className="font-semibold text-gray-800">Spedizioni (Corrieri)</h4>
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">API Key PaccoFacile.it</label>
                                                <input type="password" value={integrations.apiKey} onChange={(e) => handleIntegrationsChange('apiKey', e.target.value)} className="mt-1 block w-full px-3 py-3 border rounded-xl" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">API Key Spediamo.it</label>
                                                <input type="password" value={integrations.spediamoKey} onChange={(e) => handleIntegrationsChange('spediamoKey', e.target.value)} className="mt-1 block w-full px-3 py-3 border rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t">
                                        <h4 className="font-semibold text-gray-800">Dati Mittente Predefiniti</h4>
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Nome/Azienda Mittente</label>
                                                <input type="text" value={integrations.senderName} onChange={(e) => handleIntegrationsChange('senderName', e.target.value)} className="mt-1 block w-full px-3 py-3 border rounded-xl" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Indirizzo Completo</label>
                                                <input type="text" value={integrations.senderAddress} onChange={(e) => handleIntegrationsChange('senderAddress', e.target.value)} className="mt-1 block w-full px-3 py-3 border rounded-xl" />
                                            </div>
                                            <div><label className="block text-sm font-medium text-gray-700">Città</label><input type="text" value={integrations.senderCity} onChange={(e) => handleIntegrationsChange('senderCity', e.target.value)} className="mt-1 block w-full px-3 py-3 border rounded-xl" /></div>
                                            <div><label className="block text-sm font-medium text-gray-700">CAP</label><input type="text" value={integrations.senderZip} onChange={(e) => handleIntegrationsChange('senderZip', e.target.value)} className="mt-1 block w-full px-3 py-3 border rounded-xl" /></div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t">
                                        <label className="block text-sm font-bold text-gray-700">Webhook Globale (URL)</label>
                                        <p className="text-xs text-gray-400 mb-2">Tutti gli ordini di tutti i prodotti verranno inviati anche a questo indirizzo.</p>
                                        <input type="text" value={integrations.globalWebhookUrl} onChange={(e) => handleIntegrationsChange('globalWebhookUrl', e.target.value)} placeholder="https://..." className="mt-1 block w-full px-3 py-3 border rounded-xl" />
                                    </div>
                                </div>
                                <div className="pt-8 mt-4 border-t flex justify-end">
                                    <button type="button" onClick={handleSaveIntegrations} disabled={isSavingIntegrations || !hasIntegrationsChanges()} className="bg-primary text-white font-bold py-3 px-8 rounded-xl disabled:bg-gray-400 transition-all">{isSavingIntegrations ? 'Salvataggio...' : 'Salva Integrazioni'}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CALCOLATORE */}
                    {activeTab === 'calculator' && isAdmin && (
                        <div className="max-w-3xl mx-auto">
                            <ProfitCalculator products={products} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
