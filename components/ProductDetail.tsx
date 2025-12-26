import React, { useMemo, useState } from 'react';
import { Product, UserRole, Affiliate, Sale, PlatformSettings } from '../types';
import FormGenerator from './FormGenerator';
import { PencilIcon } from './icons/PencilIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { LinkIcon } from './icons/LinkIcon';
import JSZip from 'jszip';

interface ProductDetailProps {
  product: Product;
  userRole: UserRole;
  affiliates: Affiliate[];
  sales: Sale[];
  currentAffiliate?: Affiliate;
  onBack: () => void;
  onEdit: (product: Product) => void;
  platformSettings: PlatformSettings;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, userRole, affiliates, sales, currentAffiliate, onBack, onEdit, platformSettings }) => {
  const isManagerOrAdmin = userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
  const isLogisticsOrCC = userRole === UserRole.LOGISTICS || userRole === UserRole.CUSTOMER_CARE;
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'resources'>('details');

  const directCosts = (product.costOfGoods || 0) + (product.shippingCost || 0) + (product.fulfillmentCost || 0);
  const affiliateCommission = product.commissionValue;
  const netProfit = product.price - directCosts - affiliateCommission;
  const platformOverhead = (product.platformFee || 0) + (product.customerCareCommission || 0);


  const overrides = product.affiliateCommissionOverrides;
  const hasOverrides = isManagerOrAdmin && overrides && Object.keys(overrides).length > 0;

  const affiliatePerformance = useMemo(() => {
    if (!product.approvalTolerance) return [];

    const salesForThisProduct = sales.filter(s => s.productId === product.id);
    if (salesForThisProduct.length === 0) return [];

    const salesByAffiliate: Record<string, Sale[]> = {};
    for (const sale of salesForThisProduct) {
      const key = sale.affiliateId;
      if (!salesByAffiliate[key]) {
        salesByAffiliate[key] = [];
      }
      salesByAffiliate[key].push(sale);
    }

    const requiredRate = 100 - product.approvalTolerance;

    return Object.entries(salesByAffiliate).map(([affiliateId, affiliateSales]) => {
        const affiliateInfo = affiliates.find(a => a.id === affiliateId);
        const totalLeads = affiliateSales.length;
        const approvedLeads = affiliateSales.filter(s => s.status === 'Consegnato').length;
        const approvalRate = totalLeads > 0 ? (approvedLeads / totalLeads) * 100 : 0;
        
        return {
            affiliateId,
            affiliateName: affiliateInfo ? affiliateInfo.name : 'Sconosciuto',
            totalLeads,
            approvedLeads,
            approvalRate,
            requiredRate,
            meetsTarget: approvalRate >= requiredRate,
        };
    }).sort((a,b) => b.totalLeads - a.totalLeads);

  }, [product, sales, affiliates]);

  const getFileExtension = (url: string) => {
    try {
        const path = new URL(url).pathname;
        const parts = path.split('.');
        if (parts.length > 1) {
            const ext = parts.pop();
            if (ext) return ext.split('?')[0];
        }
    } catch (e) {
        console.error("Could not parse URL for extension:", url);
    }
    return 'jpg'; // default extension
  };

  const handleDownloadAll = async () => {
    if (!product.imageUrl && (!product.galleryImageUrls || product.galleryImageUrls.length === 0)) {
        alert("Non ci sono immagini da scaricare per questo prodotto.");
        return;
    }
    
    setIsZipping(true);
    try {
        const zip = new JSZip();
        const allUrls = [product.imageUrl, ...(product.galleryImageUrls || [])].filter(Boolean);
        
        const imageFetchPromises = allUrls.map(async (url, index) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }
                const blob = await response.blob();
                const extension = getFileExtension(url);
                const filename = `${product.refNumber}_${index + 1}.${extension}`;
                zip.file(filename, blob);
            } catch (error) {
                 console.error(`Error fetching image ${url}:`, error);
            }
        });

        await Promise.all(imageFetchPromises);

        const content = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${product.refNumber}_images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Failed to create zip file", error);
        alert("Si è verificato un errore durante la creazione del file zip.");
    } finally {
        setIsZipping(false);
    }
  };

  const defaultVisibleRoles = [UserRole.ADMIN, UserRole.MANAGER];
  const canSeeStock = (product.stockVisibilityRoles && product.stockVisibilityRoles.length > 0 
      ? product.stockVisibilityRoles 
      : defaultVisibleRoles
  ).includes(userRole);

  let commissionLabel = 'Commissione Standard Affiliato';
  let commissionValue: number | undefined = product.commissionValue;

  if (userRole === UserRole.LOGISTICS) {
      commissionLabel = 'Tua Commissione (Logistica)';
      commissionValue = product.fulfillmentCost || 0;
  } else if (userRole === UserRole.CUSTOMER_CARE) {
      commissionLabel = 'Tua Commissione (C. Care)';
      commissionValue = product.customerCareCommission || 0;
  } else if (userRole === UserRole.AFFILIATE) {
      commissionLabel = 'La Tua Commissione';
  }


  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-primary hover:text-primary-dark mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-on-surface">{product.name}</h2>
        <span className={`ml-4 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {product.isActive ? 'Attivo' : 'In Pausa'}
        </span>
        {isManagerOrAdmin && (
            <button
                onClick={() => onEdit(product)}
                className="ml-auto bg-secondary text-primary font-bold py-2 px-4 rounded-lg hover:bg-secondary-light transition-colors duration-200 flex items-center gap-2"
            >
                <PencilIcon />
                Modifica Prodotto
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <div className="bg-surface rounded-xl shadow-md">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6 px-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'details'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Dettagli Prodotto
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'resources'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Risorse per Affiliati
                    </button>
                </nav>
            </div>
            <div className="p-6">
                {activeTab === 'details' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span className="font-semibold text-gray-500">Ref #:</span> {product.refNumber}</div>
                            <div><span className="font-semibold text-gray-500">Prezzo di Vendita:</span> €{product.price.toFixed(2)}</div>
                            <div><span className="font-semibold text-gray-500">Creato il:</span> {new Date(product.createdAt).toLocaleDateString()}</div>
                            <div><span className="font-semibold text-gray-500">{commissionLabel}:</span> €{(commissionValue || 0).toFixed(2)}</div>
                            <div><span className="font-semibold text-gray-500">Tolleranza Approvazione:</span> {product.approvalTolerance ?? 0}%</div>
                            <div><span className="font-semibold text-gray-500">Frequenza Approvazioni:</span> Ogni {product.approvalFrequencyDays || 7} giorni</div>
                            <div>
                                <span className="font-semibold text-gray-500">Spedizione:</span> 
                                {product.freeShipping 
                                    ? <span className="ml-1 font-bold text-green-600">Gratuita</span>
                                    : (
                                      isManagerOrAdmin 
                                        ? <span className="ml-1 font-bold text-gray-700">A pagamento (+ €{(product.shippingCharge || 0).toFixed(2)})</span>
                                        : <span className="ml-1 font-bold text-gray-700">A pagamento</span>
                                    )
                                }
                            </div>
                        </div>
                        {canSeeStock && (product.variants && product.variants.length > 0) ? (
                            <div className="mt-4">
                                <h4 className="font-semibold text-gray-500 text-sm mb-2">Varianti e Magazzino</h4>
                                <ul className="space-y-2">
                                {product.variants.map(variant => (
                                    <li key={variant.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-gray-50">
                                        <span className="font-medium text-gray-800">{variant.name}</span>
                                        <span className={`font-bold ${
                                            variant.stockQuantity <= 0 ? 'text-red-600' :
                                            variant.stockQuantity <= 10 ? 'text-yellow-600' : 'text-gray-700'
                                        }`}>
                                            {variant.stockQuantity} pz
                                        </span>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        ) : canSeeStock && (
                            <div className="mt-4 text-sm"><span className="font-semibold text-gray-500">Quantità a Magazzino:</span>
                                <span className={`ml-2 font-bold ${
                                    (product.stockQuantity ?? 0) <= 0 ? 'text-red-600' :
                                    (product.stockQuantity ?? 0) <= 10 ? 'text-yellow-600' : 'text-gray-700'
                                }`}>
                                    {(product.stockQuantity ?? 0)} pz
                                </span>
                            </div>
                        )}
                        <div 
                            className="prose prose-sm max-w-none mt-4 text-gray-600"
                            dangerouslySetInnerHTML={{ __html: product.description }} 
                        />
                        <div className="mt-4">
                            <span className="font-semibold text-gray-500 text-sm">Accesso:</span>
                            <span className="ml-2 text-sm">{product.allowedAffiliateIds === null ? 'Pubblico' : 'Solo affiliati specifici'}</span>
                        </div>
                    </div>
                )}
                {activeTab === 'resources' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Landing Pages</h4>
                            {product.landingPages && product.landingPages.length > 0 ? (
                                <ul className="space-y-2">
                                    {product.landingPages.map((link, index) => (
                                        <li key={index}>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary-dark hover:underline text-sm font-medium">
                                                <LinkIcon className="w-4 h-4" />
                                                <span>{link.label}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Nessuna landing page specificata.</p>}
                        </div>
                         <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Creatività</h4>
                            {product.creatives && product.creatives.length > 0 ? (
                                <ul className="space-y-2">
                                    {product.creatives.map((link, index) => (
                                        <li key={index}>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary-dark hover:underline text-sm font-medium">
                                                <LinkIcon className="w-4 h-4" />
                                                <span>{link.label}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Nessuna creatività specificata.</p>}
                        </div>
                    </div>
                )}
            </div>
           </div>

           {product.bundleOptions && product.bundleOptions.length > 0 && (
            <div className="bg-surface rounded-xl shadow-md p-6 mt-8">
                <h3 className="text-xl font-bold text-on-surface mb-4">Opzioni Multi-Pack</h3>
                <ul className="space-y-3">
                    {product.bundleOptions.map(bundle => {
                        if (isManagerOrAdmin) {
                          return (
                            <li key={bundle.id} className="p-3 border rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 items-center bg-gray-50">
                                <div><span className="font-semibold text-gray-500 text-sm">Quantità:</span><br/><strong className="text-base">{bundle.quantity}</strong></div>
                                <div><span className="font-semibold text-gray-500 text-sm">Prezzo:</span><br/><strong className="text-base text-green-600">€{bundle.price.toFixed(2)}</strong></div>
                                <div><span className="font-semibold text-gray-500 text-sm">Comm. Affiliato:</span><br/><strong className="text-base">€{bundle.commissionValue.toFixed(2)}</strong></div>
                                <div><span className="font-semibold text-gray-500 text-sm">Fee Piattaforma:</span><br/><strong className="text-base">€{(bundle.platformFee || 0).toFixed(2)}</strong></div>
                            </li>
                          );
                        } else if (isLogisticsOrCC) {
                           return (
                            <li key={bundle.id} className="p-3 border rounded-lg grid grid-cols-2 gap-4 items-center bg-gray-50">
                                <div><span className="font-semibold text-gray-500 text-sm">Quantità:</span><br/><strong className="text-base">{bundle.quantity}</strong></div>
                                <div><span className="font-semibold text-gray-500 text-sm">Prezzo:</span><br/><strong className="text-base text-green-600">€{bundle.price.toFixed(2)}</strong></div>
                            </li>
                           );
                        } else { // Affiliate
                          return (
                            <li key={bundle.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50">
                               <div>
                                    <span className="font-semibold text-gray-500 text-sm">Quantità:</span>
                                    <br/>
                                    <strong className="text-base">{bundle.quantity} unità</strong>
                               </div>
                               <div>
                                    <span className="font-semibold text-gray-500 text-sm">La Tua Commissione:</span>
                                    <br/>
                                    <strong className="text-base text-green-600">€{bundle.commissionValue.toFixed(2)}</strong>
                               </div>
                            </li>
                          );
                        }
                    })}
                </ul>
            </div>
           )}
        </div>
        <div className="lg:col-span-1">
             <div className="bg-surface rounded-xl shadow-md overflow-hidden relative group">
                <img src={product.imageUrl} alt={product.name} className="w-full h-64 object-cover"/>
                 <a
                    href={product.imageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Scarica immagine principale"
                    title="Scarica immagine"
                >
                    <DownloadIcon className="w-5 h-5" />
                </a>
             </div>
             {product.galleryImageUrls && product.galleryImageUrls.length > 0 && (
                 <div className="mt-8 bg-surface rounded-xl shadow-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-base font-bold text-on-surface">Galleria</h4>
                         <button
                            onClick={handleDownloadAll}
                            disabled={isZipping}
                            className="bg-secondary text-primary font-bold py-1.5 px-3 rounded-lg hover:bg-secondary-light transition-colors duration-200 flex items-center gap-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                         >
                            <DownloadIcon className="w-4 h-4" />
                            <span>{isZipping ? 'Preparando...' : 'Scarica Tutto'}</span>
                         </button>
                      </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {product.galleryImageUrls.map((url, index) => (
                             <div key={index} className="relative group">
                                <img src={url} alt={`${product.name} - immagine ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                                <a
                                    href={url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Scarica immagine ${index + 1}`}
                                    title="Scarica immagine"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                </a>
                             </div>
                         ))}
                     </div>
                 </div>
             )}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {isManagerOrAdmin && (
        <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-on-surface mb-4">Analisi Costi (per unità singola)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div><span className="font-semibold text-gray-500">Costo Acquisto:</span> €{(product.costOfGoods || 0).toFixed(2)}</div>
            <div><span className="font-semibold text-gray-500">Costo Spedizione:</span> €{(product.shippingCost || 0).toFixed(2)}</div>
            <div><span className="font-semibold text-gray-500">Costo Logistica:</span> €{(product.fulfillmentCost || 0).toFixed(2)}</div>

            <div className="md:col-span-2 pt-2 mt-2 border-t">
                <span className="font-bold text-gray-600">Costi Diretti Totali:</span>
                <span className="font-bold text-lg text-red-600 ml-2">€{directCosts.toFixed(2)}</span>
            </div>
            <div className="md:col-span-2 pt-2 mt-2 border-t">
                <span className="font-bold text-gray-600">Profitto Netto (con comm. standard):</span>
                <span className={`font-bold text-lg ml-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{netProfit.toFixed(2)}
                </span>
            </div>
                <div className="md:col-span-2 pt-2 mt-2 border-t border-dashed">
                <p className="text-xs text-gray-400">Costi piattaforma esclusi dal calcolo sopra:</p>
                <div className="flex justify-between text-sm mt-1">
                    <span>Comm. Piattaforma + C. Care:</span>
                    <span className="font-semibold text-gray-500">€{platformOverhead.toFixed(2)}</span>
                </div>
            </div>
            </div>
        </div>
        )}
        
        {hasOverrides && (
        <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-on-surface mb-4">Commissioni Personalizzate (Penalità)</h3>
            <ul className="space-y-2">
                {Object.entries(overrides!).map(([affiliateId, rate]: [string, number]) => {
                    const affiliate = affiliates.find(a => a.id === affiliateId);
                    return (
                        <li key={affiliateId} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-100">
                            <span className="text-gray-600 font-medium">{affiliate ? affiliate.name : `ID: ${affiliateId}`}</span>
                            <div className="flex items-center">
                                <span className="text-gray-400 line-through mr-3">€{product.commissionValue.toFixed(2)}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-500 mr-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                                <span className="font-bold text-red-600 text-base">€{rate.toFixed(2)}</span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
        )}

        {isManagerOrAdmin && product.approvalTolerance != null && (
        <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-on-surface mb-2">Performance Affiliati</h3>
            <p className="text-sm text-gray-500 mb-4">
                Basato su una tolleranza del <strong>{product.approvalTolerance}%</strong>. 
                Il tasso di approvazione richiesto è del <strong>{100 - (product.approvalTolerance || 0)}%</strong>.
            </p>
            {affiliatePerformance.length > 0 ? (
                <ul className="space-y-3">
                    {affiliatePerformance.map(perf => (
                        <li key={perf.affiliateId} className="border rounded-lg p-3 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-10 sm:col-span-4 font-semibold text-gray-800">{perf.affiliateName}</div>
                            <div className="col-span-12 sm:col-span-3 text-sm text-gray-600">Lead: <strong>{perf.totalLeads}</strong> (Appr: {perf.approvedLeads})</div>
                            <div className="col-span-10 sm:col-span-4 text-sm text-gray-600">Tasso Approv.: <strong className={perf.meetsTarget ? 'text-green-600' : 'text-red-600'}>{perf.approvalRate.toFixed(1)}%</strong></div>
                            <div className="col-span-2 sm:col-span-1 flex justify-end">
                                {perf.meetsTarget ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-4">Nessuna vendita registrata per questo prodotto.</p>
            )}
        </div>
        )}

        <div>
            <FormGenerator product={product} currentAffiliate={currentAffiliate} platformSettings={platformSettings} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;