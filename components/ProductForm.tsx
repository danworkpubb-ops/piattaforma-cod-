
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Affiliate, BundleOption, FormFields, UserRole, ProductLink, ProductVariant } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ProductFormProps {
  product?: Product | null;
  affiliates: Affiliate[];
  niches: string[];
  onSave: (productData: Partial<Product> & { imageFile?: File | null, newImageFiles?: File[] }) => Promise<void>;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, affiliates, niches, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [commissionValue, setCommissionValue] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [niche, setNiche] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedAffiliateIds, setSelectedAffiliateIds] = useState<string[]>([]);
  
  const [costOfGoods, setCostOfGoods] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [fulfillmentCost, setFulfillmentCost] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [customerCareCommission, setCustomerCareCommission] = useState(0);
  const [approvalTolerance, setApprovalTolerance] = useState(0);
  const [approvalFrequencyDays, setApprovalFrequencyDays] = useState(7);
  const [bundles, setBundles] = useState<BundleOption[]>([]);
  const [freeShipping, setFreeShipping] = useState(true);
  
  const [productType, setProductType] = useState<'simple' | 'variant'>('simple');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [stockVisibilityRoles, setStockVisibilityRoles] = useState<UserRole[]>([UserRole.ADMIN, UserRole.MANAGER]);

  // Marketing Resources
  const [landingPages, setLandingPages] = useState<ProductLink[]>([]);
  const [creatives, setCreatives] = useState<ProductLink[]>([]);
  const [newLanding, setNewLanding] = useState({ label: '', url: '' });
  const [newCreative, setNewCreative] = useState({ label: '', url: '' });
  const [variant_bundle_label, setVariantBundleLabel] = useState('Scegli la variante (Prodotto {n})');

  // PaccoFacile fields
  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [depth, setDepth] = useState(0);

  const [commissionOverrides, setCommissionOverrides] = useState<{ [key: string]: string }>({});

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reference for contentEditable to avoid jumping cursor issue
  const descriptionEditorRef = useRef<HTMLDivElement>(null);

  const estimatedNetProfit = useMemo(() => {
    const effectiveShippingCost = freeShipping ? shippingCost : Math.max(0, shippingCost - shippingCharge);
    return price - costOfGoods - effectiveShippingCost - fulfillmentCost - platformFee - customerCareCommission - commissionValue;
  }, [price, costOfGoods, shippingCost, fulfillmentCost, platformFee, customerCareCommission, commissionValue, freeShipping, shippingCharge]);

  useEffect(() => {
    const sortedNiches = [...niches].sort((a, b) => a.localeCompare(b));
    if (product) {
      setName(product.name);
      setDescription(product.description);
      // Syncing internal HTML manually to prevent React re-renders from breaking caret position
      if (descriptionEditorRef.current) {
        descriptionEditorRef.current.innerHTML = product.description || '';
      }
      setPrice(product.price);
      setCommissionValue(product.commissionValue);
      setImageUrl(product.imageUrl);
      setImagePreview(product.imageUrl);
      setGalleryImageUrls(product.galleryImageUrls || []);
      setNewImageFiles([]);
      setImageFile(null);
      setNiche(product.niche);
      setRefNumber(product.refNumber);
      setIsActive(product.isActive);
      setIsPublic(product.allowedAffiliateIds === null);
      setSelectedAffiliateIds(product.allowedAffiliateIds || []);
      setCostOfGoods(product.costOfGoods || 0);
      setShippingCost(product.shippingCost || 0);
      setShippingCharge(product.shippingCharge || 0);
      setFulfillmentCost(product.fulfillmentCost || 0);
      setPlatformFee(product.platformFee || 0);
      setCustomerCareCommission(product.customerCareCommission || 0);
      setApprovalTolerance(product.approvalTolerance || 0);
      setApprovalFrequencyDays(product.approvalFrequencyDays || 7);
      setBundles(product.bundleOptions?.map(b => ({...b})) || []); 

      if (product.variants && product.variants.length > 0) {
        setProductType('variant');
        setVariants(product.variants.map(v => ({ ...v })));
        setStockQuantity(0);
      } else {
        setProductType('simple');
        setStockQuantity(product.stockQuantity ?? 0);
        setVariants([]);
      }

      setStockVisibilityRoles(product.stockVisibilityRoles || [UserRole.ADMIN, UserRole.MANAGER]);
      setLandingPages(product.landingPages || []);
      setCreatives(product.creatives || []);
      setVariantBundleLabel(product.variant_bundle_label || 'Scegli la variante (Prodotto {n})');

      setWeight(product.weight || 0);
      setHeight(product.height || 0);
      setWidth(product.width || 0);
      setDepth(product.depth || 0);

      const overrides: { [key: string]: string } = {};
      if (product.affiliateCommissionOverrides) {
        for (const affId in product.affiliateCommissionOverrides) {
            overrides[affId] = String(product.affiliateCommissionOverrides[affId]);
        }
      }
      setCommissionOverrides(overrides);

    } else {
        const placeholderUrl = `https://picsum.photos/seed/${Date.now()}/400/300`;
        setName('');
        setDescription('');
        if (descriptionEditorRef.current) {
            descriptionEditorRef.current.innerHTML = '';
        }
        setPrice(0);
        setCommissionValue(0);
        setImageUrl(placeholderUrl);
        setImagePreview(placeholderUrl);
        setGalleryImageUrls([]);
        setNewImageFiles([]);
        setImageFile(null);
        setNiche(sortedNiches.length > 0 ? sortedNiches[0] : '');
        setRefNumber(`MWS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
        setIsActive(true);
        setIsPublic(true);
        setSelectedAffiliateIds([]);
        setCostOfGoods(0);
        setShippingCost(0);
        setShippingCharge(0);
        setFulfillmentCost(0);
        setPlatformFee(0);
        setCustomerCareCommission(0);
        setApprovalTolerance(0);
        setApprovalFrequencyDays(7);
        setCommissionOverrides({});
        setBundles([]);
        setFreeShipping(true);
        setProductType('simple');
        setStockQuantity(0);
        setVariants([]);
        setStockVisibilityRoles([UserRole.ADMIN, UserRole.MANAGER]);
        setLandingPages([]);
        setCreatives([]);
        setVariantBundleLabel('Scegli la variante (Prodotto {n})');
        setWeight(0);
        setHeight(0);
        setWidth(0);
        setDepth(0);
    }
  }, [product, niches]);

  const handleAffiliateSelect = (affiliateId: string) => {
    setSelectedAffiliateIds(prev => 
      prev.includes(affiliateId) 
        ? prev.filter(id => id !== affiliateId)
        : [...prev, affiliateId]
    );
  };

  const handleOverrideChange = (affiliateId: string, value: string) => {
    setCommissionOverrides(prev => ({ ...prev, [affiliateId]: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImageFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (url: string) => {
    setGalleryImageUrls(prev => prev.filter(u => u !== url));
  };

  const handleAddBundle = () => {
    setBundles(prev => [...prev, {
        id: `bundle_${Date.now()}`,
        quantity: 2,
        price: 0,
        commissionValue: 0,
        platformFee: 0,
    }]);
  };

  const handleUpdateBundle = (index: number, field: keyof BundleOption, value: string) => {
      setBundles(prev => {
          const newBundles = [...prev];
          const numValue = parseFloat(value) || 0;
          if (field === 'quantity') {
              newBundles[index][field] = Math.round(numValue);
          } else {
              (newBundles[index] as any)[field] = numValue;
          }
          return newBundles;
      });
  };

  const handleRemoveBundle = (index: number) => {
      setBundles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDescriptionCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    if (descriptionEditorRef.current) {
        descriptionEditorRef.current.focus();
    }
  };

  const handleRoleToggle = (role: UserRole) => {
    setStockVisibilityRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleAddLink = (type: 'landing' | 'creative') => {
    if (type === 'landing') {
        if (newLanding.label.trim() && newLanding.url.trim()) {
            setLandingPages(prev => [...prev, newLanding]);
            setNewLanding({ label: '', url: '' });
        }
    } else {
        if (newCreative.label.trim() && newCreative.url.trim()) {
            setCreatives(prev => [...prev, newCreative]);
            setNewCreative({ label: '', url: '' });
        }
    }
  };

  const handleRemoveLink = (type: 'landing' | 'creative', index: number) => {
    if (type === 'landing') {
        setLandingPages(prev => prev.filter((_, i) => i !== index));
    } else {
        setCreatives(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddVariant = () => {
    setVariants(prev => [...prev, {
        id: `new_${Date.now()}`,
        name: '',
        stockQuantity: 0,
    }]);
  };

  const handleUpdateVariant = (index: number, field: keyof Omit<ProductVariant, 'id'>, value: string) => {
      setVariants(prev => {
          const newVariants = [...prev];
          if (field === 'name') {
              newVariants[index].name = value;
          } else if (field === 'stockQuantity') {
              const numValue = parseInt(value, 10);
              newVariants[index].stockQuantity = isNaN(numValue) ? 0 : numValue;
          }
          return newVariants;
      });
  };

  const handleRemoveVariant = (index: number) => {
      setVariants(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalOverrides: { [affiliateId: string]: number } = {};
    for (const affiliateId in commissionOverrides) {
        const rateStr = commissionOverrides[affiliateId];
        if (rateStr) { 
            const rateNum = parseFloat(rateStr);
            if (!isNaN(rateNum) && rateNum !== commissionValue) {
                finalOverrides[affiliateId] = rateNum;
            }
        }
    }

    const productData: Partial<Product> & { imageFile?: File | null, newImageFiles?: File[] } = { 
        name, 
        description, // use state which is updated via onInput
        price, commissionValue, imageUrl, niche, refNumber, isActive,
        allowedAffiliateIds: isPublic ? null : selectedAffiliateIds,
        costOfGoods, shippingCost, fulfillmentCost, platformFee, customerCareCommission,
        approvalTolerance, approvalFrequencyDays, 
        freeShipping,
        shippingCharge: freeShipping ? 0 : shippingCharge,
        affiliateCommissionOverrides: finalOverrides,
        bundleOptions: bundles,
        imageFile,
        galleryImageUrls,
        newImageFiles,
        weight, height, width, depth,
        stockQuantity: productType === 'simple' ? stockQuantity : undefined,
        variants: productType === 'variant' ? variants.filter(v => v.name.trim() !== '') : [],
        stockVisibilityRoles,
        landingPages,
        creatives,
        variant_bundle_label,
    };

    setIsSaving(true);
    try {
        if (product) {
            await onSave({ ...product, ...productData });
        } else {
            await onSave(productData);
        }
    } catch (error) {
        console.error("Save failed", error);
        alert("Salvataggio fallito. Controlla la console per i dettagli.");
    } finally {
        setIsSaving(false);
    }
  };

  const sortedNiches = [...niches].sort((a,b) => a.localeCompare(b));
  const ALL_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.AFFILIATE, UserRole.LOGISTICS, UserRole.CUSTOMER_CARE];

  return (
    <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
      <style>{`
        .toggle-checkbox:checked { right: 0; border-color: #4caf50; }
        .toggle-checkbox:checked + .toggle-label { background-color: #4caf50; }
      `}</style>
      <div className="space-y-6">
          <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Prodotto</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrizione</label>
            <div className="mt-1 border border-gray-300 rounded-md shadow-sm">
                <div className="flex items-center gap-2 p-2 border-b border-gray-300 bg-gray-50 rounded-t-md flex-wrap">
                    <button type="button" onClick={() => handleDescriptionCommand('bold')} className="font-bold w-8 h-8 rounded hover:bg-gray-200">B</button>
                    <button type="button" onClick={() => handleDescriptionCommand('underline')} className="underline w-8 h-8 rounded hover:bg-gray-200">U</button>
                    <select onChange={(e) => handleDescriptionCommand('fontName', e.target.value)} className="text-sm border-gray-300 rounded-md h-8 py-0 focus:ring-primary focus:border-primary">
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                    </select>
                    <select onChange={(e) => handleDescriptionCommand('fontSize', e.target.value)} defaultValue="3" className="text-sm border-gray-300 rounded-md h-8 py-0 focus:ring-primary focus:border-primary">
                        <option value="2">Piccolo</option>
                        <option value="3">Normale</option>
                        <option value="4">Medio</option>
                        <option value="5">Grande</option>
                        <option value="6">Molto Grande</option>
                    </select>
                    <input 
                        type="color" 
                        onChange={(e) => handleDescriptionCommand('foreColor', e.target.value)} 
                        className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer" 
                        title="Colore testo" 
                    />
                </div>
                {/* 
                  FIX: The jumping cursor was caused by dangerouslySetInnerHTML triggering on every keypress.
                  By using a ref and removing the direct prop binding, the browser manages the caret position.
                */}
                <div
                    ref={descriptionEditorRef}
                    id="description-editor"
                    contentEditable="true"
                    onInput={(e) => setDescription(e.currentTarget.innerHTML)}
                    className="min-h-[120px] w-full px-3 py-2 bg-white rounded-b-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                />
            </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Immagine Prodotto Principale</label>
              <div className="mt-1 flex items-center gap-4">
                  {imagePreview && (
                      <img src={imagePreview} alt="Anteprima prodotto" className="w-24 h-24 object-cover rounded-md" />
                  )}
                  <div className="flex-grow">
                      <input 
                          type="file" 
                          id="imageFile" 
                          accept="image/*"
                          onChange={handleImageChange}
                          className="block w-full text-sm text-gray-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-primary-dark/10 file:text-primary
                                      hover:file:bg-primary-dark/20"
                      />
                      <p className="mt-1 text-xs text-gray-500">Sostituisci l'immagine corrente. PNG, JPG, GIF.</p>
                  </div>
              </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Galleria Immagini</label>
              <div className="mt-1 p-4 border-2 border-dashed border-gray-300 rounded-md">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {galleryImageUrls.map((url) => (
                          <div key={url} className="relative group">
                              <img src={url} alt="Immagine galleria" className="w-24 h-24 object-cover rounded-md" />
                              <button type="button" onClick={() => handleRemoveExistingImage(url)} className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <TrashIcon className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                      {newImageFiles.map((file, index) => (
                           <div key={index} className="relative group">
                              <img src={URL.createObjectURL(file)} alt="Anteprima nuova immagine" className="w-24 h-24 object-cover rounded-md" />
                              <button type="button" onClick={() => handleRemoveNewImage(index)} className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <TrashIcon className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                  </div>
                   <div className="mt-4">
                       <label htmlFor="gallery-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark">
                          <PlusIcon className="w-5 h-5 mr-2"/> Aggiungi Immagini
                       </label>
                       <input id="gallery-upload" type="file" multiple accept="image/*" onChange={handleGalleryImageChange} className="sr-only"/>
                   </div>
              </div>
          </div>
          <div>
              <label htmlFor="niche" className="block text-sm font-medium text-gray-700">Nicchia di Mercato</label>
              <select 
                id="niche" 
                value={niche} 
                onChange={(e) => setNiche(e.target.value)} 
                required 
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="" disabled>Seleziona una nicchia</option>
                {sortedNiches.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
          </div>
          
          <div className="p-4 border rounded-md bg-gray-50">
              <h3 className="text-base font-medium text-gray-800 mb-4">Gestione Magazzino e Varianti</h3>
              <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                      <input id="simple-product" name="product-type" type="radio" checked={productType === 'simple'} onChange={() => setProductType('simple')} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                      <label htmlFor="simple-product" className="ml-2 block text-sm text-gray-900">Prodotto Semplice (Magazzino Unico)</label>
                  </div>
                  <div className="flex items-center">
                      <input id="variant-product" name="product-type" type="radio" checked={productType === 'variant'} onChange={() => setProductType('variant')} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                      <label htmlFor="variant-product" className="ml-2 block text-sm text-gray-900">Prodotto con Varianti</label>
                  </div>
              </div>

              {productType === 'simple' && (
                  <div>
                      <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Quantità a Magazzino</label>
                      <input type="number" id="stockQuantity" value={stockQuantity} onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)} min="0" step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                  </div>
              )}

              {productType === 'variant' && (
                  <div className="space-y-4">
                      <p className="text-sm text-gray-500">Aggiungi le varianti del prodotto. Il magazzino totale sarà la somma delle quantità di ogni variante.</p>
                      {variants.map((variant, index) => (
                          <div key={index} className="flex items-end gap-2 p-3 border rounded-md bg-white">
                              <div className="flex-grow">
                                  <label className="block text-xs font-medium text-gray-600">Nome Variante</label>
                                  <input type="text" value={variant.name} onChange={e => handleUpdateVariant(index, 'name', e.target.value)} placeholder="Es. Android, iPhone, Taglia M" className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                              </div>
                              <div className="w-28">
                                  <label className="block text-xs font-medium text-gray-600">Quantità Magazzino</label>
                                  <input type="number" value={variant.stockQuantity} onChange={e => handleUpdateVariant(index, 'stockQuantity', e.target.value)} min="0" step="1" className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                              </div>
                              <button type="button" onClick={() => handleRemoveVariant(index)} className="p-2 text-red-500 hover:text-red-700 flex-shrink-0">
                                  <TrashIcon className="w-5 h-5" />
                              </button>
                          </div>
                      ))}
                      <button type="button" onClick={handleAddVariant} className="mt-2 bg-secondary text-primary font-bold py-2 px-4 rounded-lg hover:bg-secondary-light transition-colors duration-200 flex items-center gap-2 text-sm">
                          <PlusIcon />
                          Aggiungi Variante
                      </button>
                  </div>
              )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label htmlFor="refNumber" className="block text-sm font-medium text-gray-700">Numero di Riferimento</label>
                  <input type="text" id="refNumber" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Prezzo (€)</label>
                  <input type="number" id="price" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="commissionValue" className="block text-sm font-medium text-gray-700">Commissione Affiliato (€)</label>
                  <input type="number" id="commissionValue" value={commissionValue} onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="approvalTolerance" className="block text-sm font-medium text-gray-700">Tolleranza Approvazione (%)</label>
                  <input type="number" id="approvalTolerance" value={approvalTolerance} onChange={(e) => setApprovalTolerance(parseFloat(e.target.value) || 0)} required min="0" max="100" step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                  <p className="mt-1 text-xs text-gray-500">Se 35%, l'affiliato deve avere un tasso di approvazione min. del 65%.</p>
              </div>
              <div>
                  <label htmlFor="approvalFrequency" className="block text-sm font-medium text-gray-700">Frequenza Approvazioni</label>
                  <select 
                      id="approvalFrequency" 
                      value={approvalFrequencyDays} 
                      onChange={(e) => setApprovalFrequencyDays(parseInt(e.target.value, 10))} 
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                      <option value="7">Ogni 7 giorni</option>
                      <option value="14">Ogni 14 giorni</option>
                      <option value="30">Ogni 30 giorni</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Determina ogni quanto vengono approvate le vendite.</p>
              </div>
                <div className="flex flex-wrap items-center pt-6 md:col-span-2 gap-x-8 gap-y-4">
                    <div className="flex items-center">
                        <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mr-4">Stato Prodotto</label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="isActive" id="isActive" checked={isActive} onChange={() => setIsActive(!isActive)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label htmlFor="isActive" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                        <label htmlFor="isActive" className={`text-sm font-semibold ${isActive ? 'text-green-600' : 'text-yellow-600'}`}>{isActive ? 'Attivo' : 'In Pausa'}</label>
                    </div>
                    <div className="flex items-center">
                        <label htmlFor="freeShipping" className="block text-sm font-medium text-gray-700 mr-4">Spedizione Gratuita</label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="freeShipping" id="freeShipping" checked={freeShipping} onChange={() => setFreeShipping(!freeShipping)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label htmlFor="freeShipping" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                        <label htmlFor="freeShipping" className={`text-sm font-semibold ${freeShipping ? 'text-green-600' : 'text-gray-500'}`}>{freeShipping ? 'Sì' : 'No'}</label>
                    </div>
                </div>
                {!freeShipping && (
                    <div>
                        <label htmlFor="shippingCharge" className="block text-sm font-medium text-gray-700">Costo Spedizione per il Cliente (€)</label>
                        <input type="number" id="shippingCharge" value={shippingCharge} onChange={(e) => setShippingCharge(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        <p className="mt-1 text-xs text-gray-500">Questo importo verrà aggiunto al prezzo finale per il cliente.</p>
                    </div>
                )}
          </div>

          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="text-base font-medium text-gray-800 mb-2">Visibilità Magazzino</h3>
            <p className="text-sm text-gray-500 mb-4">Seleziona quali ruoli possono vedere la quantità di prodotto disponibile.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {ALL_ROLES.map(role => (
                    <div key={role} className="flex items-center">
                        <input 
                            id={`role-${role}`} 
                            type="checkbox" 
                            checked={stockVisibilityRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" 
                        />
                        <label htmlFor={`role-${role}`} className="ml-2 block text-sm text-gray-900">{role}</label>
                    </div>
                ))}
            </div>
          </div>

           <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="text-base font-medium text-gray-800 mb-4">Dimensioni e Peso Pacco (per spedizione)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Peso (kg)</label>
                    <input type="number" id="weight" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} min="0" step="0.1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700">Altezza (cm)</label>
                    <input type="number" id="height" value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} min="0" step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-700">Larghezza (cm)</label>
                    <input type="number" id="width" value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} min="0" step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="depth" className="block text-sm font-medium text-gray-700">Profondità (cm)</label>
                    <input type="number" id="depth" value={depth} onChange={(e) => setDepth(parseFloat(e.target.value) || 0)} min="0" step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
            </div>
          </div>
          
           <div className="p-4 border rounded-md bg-gray-50">
                <h3 className="text-base font-medium text-gray-800 mb-4">Personalizzazione Formulario</h3>
                <div>
                    <label htmlFor="variant_bundle_label" className="block text-sm font-medium text-gray-700">Etichetta selezione varianti (multi-pack)</label>
                    <input 
                        type="text" 
                        id="variant_bundle_label" 
                        value={variant_bundle_label} 
                        onChange={(e) => setVariantBundleLabel(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
                    />
                    <p className="mt-1 text-xs text-gray-500">Usa <code className="bg-gray-200 px-1 rounded">{'{n}'}</code> per inserire il numero del prodotto (es. Prodotto 1).</p>
                </div>
            </div>

          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="text-base font-medium text-gray-800 mb-4">Costi del Prodotto (per unità singola)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="costOfGoods" className="block text-sm font-medium text-gray-700">Costo di Acquisto (€)</label>
                    <input type="number" id="costOfGoods" value={costOfGoods} onChange={(e) => setCostOfGoods(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                  <div>
                    <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700">Costo di Spedizione (€)</label>
                    <input type="number" id="shippingCost" value={shippingCost} onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                  <div>
                    <label htmlFor="fulfillmentCost" className="block text-sm font-medium text-gray-700">Costo Logistica (€)</label>
                    <input type="number" id="fulfillmentCost" value={fulfillmentCost} onChange={(e) => setFulfillmentCost(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                  <div>
                    <label htmlFor="platformFee" className="block text-sm font-medium text-gray-700">Commissione Piattaforma (€)</label>
                    <input type="number" id="platformFee" value={platformFee} onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="customerCareCommission" className="block text-sm font-medium text-gray-700">Commissione Customer Care (€)</label>
                    <input type="number" id="customerCareCommission" value={customerCareCommission} onChange={(e) => setCustomerCareCommission(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
            </div>
             <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">Profitto Netto Stimato (per unità):</span>
                    <span className={`text-xl font-bold ${estimatedNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{estimatedNetProfit.toFixed(2)}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">Prezzo - Tutti i costi del prodotto - Comm. Affiliato</p>
            </div>
          </div>

          <div className="p-4 border rounded-md bg-gray-50">
              <h3 className="text-base font-medium text-gray-800 mb-4">Opzioni Multi-Pack (Upsells)</h3>
              <div className="space-y-4">
                  {bundles.map((bundle, index) => {
                      const effectiveShippingCost = freeShipping ? shippingCost : Math.max(0, shippingCost - shippingCharge);
                      const bundleProfit = bundle.price - (costOfGoods * bundle.quantity) - effectiveShippingCost - fulfillmentCost - customerCareCommission - bundle.commissionValue - (bundle.platformFee || 0);
                      return (
                      <div key={index} className="p-3 border rounded-md bg-white relative">
                          <button type="button" onClick={() => handleRemoveBundle(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                              <TrashIcon className="w-5 h-5" />
                          </button>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                  <label className="block text-xs font-medium text-gray-600">Quantità</label>
                                  <input type="number" value={bundle.quantity} onChange={e => handleUpdateBundle(index, 'quantity', e.target.value)} min="2" step="1" className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                              </div>
                               <div>
                                  <label className="block text-xs font-medium text-gray-600">Prezzo Totale (€)</label>
                                  <input type="number" value={bundle.price} onChange={e => handleUpdateBundle(index, 'price', e.target.value)} min="0" step="0.01" className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-600">Comm. Affiliato (€)</label>
                                  <input type="number" value={bundle.commissionValue} onChange={e => handleUpdateBundle(index, 'commissionValue', e.target.value)} min="0" step="0.01" className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                              </div>
                               <div>
                                  <label className="block text-xs font-medium text-gray-600">Fee Piattaforma (€)</label>
                                  <input type="number" value={bundle.platformFee || 0} onChange={e => handleUpdateBundle(index, 'platformFee', e.target.value)} min="0" step="0.01" className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                              </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-700">Profitto Netto Stimato:</span>
                                  <span className={`text-base font-bold ${bundleProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      €{bundleProfit.toFixed(2)}
                                  </span>
                              </div>
                          </div>
                      </div>
                  )})}
              </div>
              <button type="button" onClick={handleAddBundle} className="mt-4 bg-secondary text-primary font-bold py-2 px-4 rounded-lg hover:bg-secondary-light transition-colors duration-200 flex items-center gap-2 text-sm">
                  <PlusIcon />
                  Aggiungi Opzione
              </button>
          </div>
          
            <div className="p-4 border rounded-md bg-gray-50 space-y-6">
                <div>
                    <h3 className="text-base font-medium text-gray-800 mb-4">Landing Pages</h3>
                    <div className="space-y-2">
                        {landingPages.map((link, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white p-2 border rounded-md">
                                <span className="flex-grow text-sm text-gray-800 truncate"><strong>{link.label}:</strong> {link.url}</span>
                                <button type="button" onClick={() => handleRemoveLink('landing', index)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-end gap-2">
                        <input type="text" value={newLanding.label} onChange={(e) => setNewLanding({...newLanding, label: e.target.value})} placeholder="Etichetta (es. Landing Video)" className="flex-grow px-2 py-1 bg-white border border-gray-300 rounded-md sm:text-sm" />
                        <input type="url" value={newLanding.url} onChange={(e) => setNewLanding({...newLanding, url: e.target.value})} placeholder="https://..." className="flex-grow px-2 py-1 bg-white border border-gray-300 rounded-md sm:text-sm" />
                        <button type="button" onClick={() => handleAddLink('landing')} className="bg-secondary text-primary font-bold p-2 rounded-lg hover:bg-secondary-light"><PlusIcon /></button>
                    </div>
                </div>
                <div>
                    <h3 className="text-base font-medium text-gray-800 mb-4">Creatività (es. Google Drive, Canvass)</h3>
                    <div className="space-y-2">
                        {creatives.map((link, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white p-2 border rounded-md">
                                <span className="flex-grow text-sm text-gray-800 truncate"><strong>{link.label}:</strong> {link.url}</span>
                                <button type="button" onClick={() => handleRemoveLink('creative', index)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-end gap-2">
                        <input type="text" value={newCreative.label} onChange={(e) => setNewCreative({...newCreative, label: e.target.value})} placeholder="Etichetta (es. Foto Prodotto)" className="flex-grow px-2 py-1 bg-white border border-gray-300 rounded-md sm:text-sm" />
                        <input type="url" value={newCreative.url} onChange={(e) => setNewCreative({...newCreative, url: e.target.value})} placeholder="https://..." className="flex-grow px-2 py-1 bg-white border border-gray-300 rounded-md sm:text-sm" />
                        <button type="button" onClick={() => handleAddLink('creative')} className="bg-secondary text-primary font-bold p-2 rounded-lg hover:bg-secondary-light"><PlusIcon /></button>
                    </div>
                </div>
            </div>

          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="text-base font-medium text-gray-800 mb-2">Commissioni Personalizzate per Affiliato</h3>
            <p className="text-sm text-gray-500 mb-4">Lascia vuoto per usare la commissione di default (€{commissionValue.toFixed(2)}). Inserisci un valore per applicare una penalità o un bonus.</p>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {affiliates.filter(a => !a.isBlocked).map(affiliate => (
                  <div key={affiliate.id} className="grid grid-cols-3 items-center gap-2">
                      <label htmlFor={`override-${affiliate.id}`} className="text-sm text-gray-700 col-span-2">{affiliate.name}</label>
                      <input 
                          type="number"
                          id={`override-${affiliate.id}`}
                          value={commissionOverrides[affiliate.id] || ''}
                          onChange={(e) => handleOverrideChange(affiliate.id, e.target.value)}
                          min="0" step="0.01"
                          placeholder={`${commissionValue.toFixed(2)}€`}
                          className="w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                  </div>
              ))}
            </div>
          </div>

          <div className="p-4 border rounded-md bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">Accesso Prodotto</label>
              <div className="flex items-center gap-4">
                  <div className="flex items-center">
                      <input id="public" name="access" type="radio" checked={isPublic} onChange={() => setIsPublic(true)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                      <label htmlFor="public" className="ml-2 block text-sm text-gray-900">Pubblico (per tutti gli affiliati)</label>
                  </div>
                  <div className="flex items-center">
                      <input id="private" name="access" type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                      <label htmlFor="private" className="ml-2 block text-sm text-gray-900">Privato (per affiliati specifici)</label>
                  </div>
              </div>
                {!isPublic && (
                  <div className="mt-4 max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                      <h4 className="text-xs font-semibold text-gray-600 mb-2">Seleziona Affiliati Autorizzati</h4>
                      {affiliates.map(affiliate => (
                          <div key={affiliate.id} className="flex items-center p-1 rounded-md hover:bg-gray-200">
                              <input 
                                  id={`aff-${affiliate.id}`} 
                                  type="checkbox" 
                                  checked={selectedAffiliateIds.includes(affiliate.id)}
                                  onChange={() => handleAffiliateSelect(affiliate.id)}
                                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" 
                              />
                              <label htmlFor={`aff-${affiliate.id}`} className="ml-2 block text-sm text-gray-900">{affiliate.name}</label>
                          </div>
                      ))}
                  </div>
                )}
          </div>
      </div>
      <div className="mt-8 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200">
              Annulla
          </button>
          <button type="submit" disabled={isSaving} className="bg-primary text-on-primary font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isSaving ? (product ? 'Salvataggio...' : 'Creazione...') : (product ? 'Salva Modifiche' : 'Crea Prodotto')}
          </button>
      </div>
    </form>
  );
};

export default ProductForm;
