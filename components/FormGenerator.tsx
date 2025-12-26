
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Affiliate, FormFields, Sale, PlatformSettings, FormFieldConfig } from '../types';
import { DesktopIcon } from './icons/DesktopIcon';
import { TabletIcon } from './icons/TabletIcon';
import { MobileIcon } from './icons/MobileIcon';

interface FormGeneratorProps {
    product: Product;
    currentAffiliate?: Affiliate;
    platformSettings: PlatformSettings;
}

const FormGenerator: React.FC<FormGeneratorProps> = ({ product, currentAffiliate, platformSettings }) => {
    const [formTitle, setFormTitle] = useState(`Completa il tuo ordine`);
    const [thankYouUrl, setThankYouUrl] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [subId, setSubId] = useState('');
    const [buttonText, setButtonText] = useState('Acquista Ora');
    const [variant_bundle_label, setVariantBundleLabel] = useState(product.variant_bundle_label || 'Scegli la variante (Prodotto {n})');
    const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [formFields, setFormFields] = useState<FormFields>({
        name: { visible: true, required: true, width: 100, placeholder: 'Mario Rossi' },
        street_address: { visible: true, required: true, width: 100, placeholder: 'Via Roma' },
        house_number: { visible: true, required: true, width: 50, placeholder: '12/A' },
        city: { visible: true, required: true, width: 50, placeholder: 'Milano' },
        province: { visible: true, required: true, width: 50, placeholder: 'MI' },
        zip: { visible: true, required: true, width: 50, placeholder: '20121' } as any, 
        phone: { visible: true, required: true, width: 100, placeholder: '3331234567' },
        email: { visible: true, required: true, width: 100, placeholder: 'mario.rossi@email.com' },
    });
    
    useEffect(() => {
        setFormFields({
            name: { visible: true, required: true, width: 100, placeholder: 'Mario Rossi' },
            street_address: { visible: true, required: true, width: 100, placeholder: 'Via Roma' },
            house_number: { visible: true, required: true, width: 50, placeholder: '12/A' },
            city: { visible: true, required: true, width: 50, placeholder: 'Milano' },
            province: { visible: true, required: true, width: 50, placeholder: 'MI' },
            zip: { visible: true, required: true, width: 50, placeholder: '20121' },
            phone: { visible: true, required: true, width: 100, placeholder: '3331234567' },
            email: { visible: true, required: true, width: 100, placeholder: 'mario.rossi@email.com' },
        });
    }, []);

    const [formColors, setFormColors] = useState({
        titleColor: '#333333',
        labelColor: '#666666',
        buttonBgColor: '#1a237e',
        buttonTextColor: '#ffffff',
    });
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [showBundles, setShowBundles] = useState(true);
    const [showShippingText, setShowShippingText] = useState(true);

    useEffect(() => {
        setVariantBundleLabel(product.variant_bundle_label || 'Scegli la variante (Prodotto {n})');
    }, [product.variant_bundle_label]);

     const handleFormFieldChange = (
        field: keyof FormFields,
        prop: keyof FormFieldConfig,
        value: boolean | number | string
    ) => {
        setFormFields(prev => ({
            ...prev,
            [field]: { ...prev[field], [prop]: value }
        }));
    };
    
    const handleColorChange = (key: keyof typeof formColors, value: string) => {
        setFormColors(prev => ({...prev, [key]: value}));
    };

    const canToggleShippingText = !product.freeShipping && product.bundleOptions && product.bundleOptions.length > 0;
    const stockQuantity = product.variants && product.variants.length > 0 
        ? product.variants.reduce((sum, v) => sum + v.stockQuantity, 0)
        : (product.stockQuantity ?? 0);

    const generatedHtml = useMemo(() => {
        const escapedButtonText = buttonText.replace(/'/g, "\\'");
        const hasBundles = product.bundleOptions && product.bundleOptions.length > 0;
        const hasVariants = product.variants && product.variants.length > 0;
        const isShippingPaid = !product.freeShipping && (product.shippingCharge || 0) > 0;
        const shippingText = (isShippingPaid && showShippingText) ? `<span style="font-size: 12px; color: #555;"> + Sped.</span>` : '';

        const affiliateIdentifier = currentAffiliate 
            ? (currentAffiliate.short_id || currentAffiliate.id) 
            : '[IL_TUO_ID_AFFILIATO]';

        const generateOfferOptions = () => {
                let optionsHtml = '';
                
                const isSingleOutOfStock = stockQuantity < 1;
                const mostChosenAvailable = hasBundles && product.bundleOptions && product.bundleOptions.length > 0 && stockQuantity >= product.bundleOptions![0].quantity;
                const singleProductCheckedAttr = !isSingleOutOfStock && !mostChosenAvailable ? 'checked' : '';
                
                optionsHtml += `
    <label style="display: block; padding: 12px; cursor: ${isSingleOutOfStock ? 'not-allowed' : 'pointer'}; border: 1px solid #ddd; border-radius: 5px; background-color: ${isSingleOutOfStock ? '#f0f0f0' : '#f9f9f9'}; opacity: ${isSingleOutOfStock ? '0.6' : '1'};">
        <input type="radio" name="offerSelection" value="single_product"
               data-quantity="1"
               ${isSingleOutOfStock ? 'disabled' : ''} ${singleProductCheckedAttr} style="margin-right: 8px; vertical-align: middle;">
        <span style="font-weight: bold;">Offerta 1x</span> - <span style="font-weight: bold; color: ${formColors.buttonBgColor};">€${product.price.toFixed(2)}</span>${shippingText}
        ${isSingleOutOfStock ? '<span style="font-size: 11px; color: #d9534f; margin-left: 8px; font-weight: bold;">(Esaurito)</span>' : ''}
    </label>`;

                product.bundleOptions?.forEach((bundle, index) => {
                    const singlePriceTotal = product.price * bundle.quantity;
                    const saving = singlePriceTotal - bundle.price;
                    const savingHtml = saving > 0 
                        ? `<span style="font-size: 11px; color: #28a745; margin-left: 8px; font-weight: bold;">(Risparmi €${saving.toFixed(2)})</span>` 
                        : '';

                    const isMostChosen = index === 0;
                    const isOutOfStock = stockQuantity < bundle.quantity;
                    const bundleCheckedAttr = isMostChosen && !isOutOfStock ? 'checked' : '';

                    const labelStyle = `
                        display: block; 
                        padding: 12px; 
                        cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'}; 
                        border-radius: 5px;
                        opacity: ${isOutOfStock ? '0.6' : '1'};
                        position: relative;
                        overflow: hidden;
                        border: ${isMostChosen ? `2px solid ${formColors.buttonBgColor}` : '1px solid #ddd'};
                        background-color: ${isOutOfStock ? '#f0f0f0' : (isMostChosen ? '#fff8e1' : '#f9f9f9')};
                    `;
                    
                    const badgeHtml = isMostChosen
                        ? `<div style="position: absolute; top: 0; right: 0; background-color: ${formColors.buttonBgColor}; color: ${formColors.buttonTextColor}; font-size: 10px; font-weight: bold; padding: 2px 8px; border-bottom-left-radius: 5px; line-height: 1.5;">LA PIÙ SCELTA</div>`
                        : '';

                    optionsHtml += `
    <label style="${labelStyle.replace(/\s\s+/g, ' ')}">
        ${badgeHtml}
        <input type="radio" name="offerSelection" value="${bundle.id}"
               data-quantity="${bundle.quantity}"
               ${isOutOfStock ? 'disabled' : ''}
               ${bundleCheckedAttr}
               style="margin-right: 8px; vertical-align: middle;">
        <span style="font-weight: bold;">Offerta ${bundle.quantity}x</span> - <span style="font-weight: bold; color: ${formColors.buttonBgColor};">€${bundle.price.toFixed(2)}</span>${shippingText}
        ${savingHtml}
        ${isOutOfStock ? '<span style="font-size: 11px; color: #d9534f; margin-left: 8px; font-weight: bold;">(Esaurito)</span>' : ''}
    </label>`;
                });
                return optionsHtml;
        };
    
        const offerSelectorHtml = hasBundles && showBundles
        ? `<div id="offer-selector" style="display: flex; flex-direction: column; gap: 8px;">
        ${generateOfferOptions()}
    </div>`
        : '';

        const variantSelectorHtml = hasVariants ? `
<div id="single-variant-selector-container" style="margin-top: 15px;">
  <label for="variantSelection" style="display: block; margin-bottom: 5px; color: ${formColors.labelColor};">Seleziona Variante</label>
  <select id="variantSelection" name="variantSelection" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
    ${product.variants!.map(v => `<option value="${v.id}" ${v.stockQuantity <= 0 ? 'disabled' : ''}>${v.name}${v.stockQuantity <= 0 ? ' (Esaurito)' : ''}</option>`).join('')}
  </select>
</div>
<div id="bundle-variant-selectors" style="display: none; margin-top: 15px; space-y: 10px;"></div>
` : '';
        
        const fieldMetadata: Record<keyof FormFields, {
            label: string;
            type: string;
            name: string;
            placeholder?: string;
            attributes?: string;
        }> = {
            name: { label: 'Nome e Cognome', type: 'text', name: 'customerName' },
            street_address: { label: 'Indirizzo', type: 'text', name: 'customer_street_address' },
            house_number: { label: 'Numero Civico', type: 'text', name: 'customer_house_number' },
            city: { label: 'Città', type: 'text', name: 'customer_city' },
            province: { label: 'Provincia (sigla)', type: 'text', name: 'customer_province', attributes: 'maxlength="2"' },
            zip: { label: 'CAP', type: 'text', name: 'customer_zip' },
            phone: { label: 'Numero di Telefono', type: 'tel', name: 'customerPhone', attributes: 'inputmode="numeric" pattern="[0-9]*" title="Inserisci solo cifre numeriche."' },
            email: { label: 'La tua Email', type: 'email', name: 'customerEmail' },
        };

        const generateCustomerFields = () => {
            let fieldsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 15px; row-gap: 15px;">';
            const fieldStyles = "width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;";
            
            for (const key of Object.keys(fieldMetadata) as (keyof FormFields)[]) {
                const config = formFields[key];
                if (!config || !config.visible) continue;

                const meta = fieldMetadata[key];
                const requiredAttr = config.required ? 'required' : '';
                const placeholderAttr = config.placeholder ? `placeholder="${config.placeholder}"` : (meta.placeholder ? `placeholder="${meta.placeholder}"` : '');
                const otherAttrs = meta.attributes || '';
                const divWidthStyle = `flex: 1 1 calc(${config.width}% - 15px); min-width: ${config.width < 100 ? '120px' : '100%'};`;
                
                fieldsHtml += `
                    <div style="${divWidthStyle}">
                        <label for="${meta.name}" style="display: block; margin-bottom: 5px; color: ${formColors.labelColor};">${meta.label}${config.required ? '<span style="color: #d9534f; margin-left: 2px;">*</span>' : ''}</label>
                        <input type="${meta.type}" id="${meta.name}" name="${meta.name}" ${requiredAttr} style="${fieldStyles}" ${placeholderAttr} ${otherAttrs}>
                    </div>`;
            }

            fieldsHtml += '</div>';
            return fieldsHtml;
        };

        const privacyLinkHtml = privacyPolicyUrl
          ? ` secondo la <a href="${privacyPolicyUrl}" target="_blank" rel="noopener noreferrer" style="color: ${formColors.buttonBgColor}; text-decoration: underline;">Privacy Policy</a>`
          : '';

        const bundleLogicScript = `
<script>
(function() {
    var form = document.currentScript.closest('form');
    if (!form) return;
    
    var variantBundleLabel = '${variant_bundle_label.replace(/'/g, "\\'")}';

    var offerRadios = form.querySelectorAll('input[name="offerSelection"]');
    var bundleIdInput = form.querySelector('input[name="bundleId"]');
    var quantityInput = form.querySelector('input[name="quantity"]');
    var singleVariantContainer = form.querySelector('#single-variant-selector-container');
    var bundleSelectorsContainer = form.querySelector('#bundle-variant-selectors');
    var variantIdInput = form.querySelector('input[name="variantId"]');
    var variantNameInput = form.querySelector('input[name="variantName"]');
    var submitButton = form.querySelector('#mws-submit-button');
    var stockQuantity = ${stockQuantity};
    var productVariants = ${JSON.stringify(product.variants || [])};
    var hasVariants = productVariants.length > 0;
    var initialButtonText = '${escapedButtonText}';
    
    function updateFormState() {
        var selectedRadio = form.querySelector('input[name="offerSelection"]:checked');
        if (!selectedRadio) {
            submitButton.disabled = true;
            submitButton.innerText = 'Offerta non disponibile';
            if(bundleIdInput) bundleIdInput.value = '';
            if(quantityInput) quantityInput.value = '1';
            return;
        }

        var bundleId = selectedRadio.value === 'single_product' ? '' : selectedRadio.value;
        var quantity = parseInt(selectedRadio.dataset.quantity || '1', 10);
        
        if (bundleIdInput) { bundleIdInput.value = bundleId; }
        if (quantityInput) { quantityInput.value = quantity; }
        
        if (hasVariants) {
            if (quantity > 1) {
                if (singleVariantContainer) singleVariantContainer.style.display = 'none';
                if (bundleSelectorsContainer) {
                    var optionsHtml = productVariants.map(function(v) {
                        return '<option value="' + v.id + '"' + (v.stockQuantity <= 0 ? ' disabled' : '') + '>' + v.name + (v.stockQuantity <= 0 ? ' (Esaurito)' : '') + '</option>';
                    }).join('');
                    
                    var selectorsHtml = '';
                    for (var i = 0; i < quantity; i++) {
                        selectorsHtml +=
                            '<div style="margin-bottom: 10px;">' +
                                '<label for="bundleVariantSelection_' + i + '" style="display: block; margin-bottom: 5px; font-size: 12px; color: ' + '${formColors.labelColor}' + ';">' + variantBundleLabel.replace('{n}', i + 1) + '</label>' +
                                '<select id="bundleVariantSelection_' + i + '" name="bundleVariantSelection" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">' +
                                    optionsHtml +
                                </select>' +
                            '</div>';
                    }
                    bundleSelectorsContainer.innerHTML = selectorsHtml;
                    bundleSelectorsContainer.style.display = 'block';
                }
            } else {
                if (singleVariantContainer) singleVariantContainer.style.display = 'block';
                if (bundleSelectorsContainer) {
                    bundleSelectorsContainer.style.display = 'none';
                    bundleSelectorsContainer.innerHTML = '';
                }
            }
        }

        var isOutOfStock = stockQuantity < quantity;
        
        if (isOutOfStock) {
            submitButton.disabled = true;
            submitButton.innerText = 'Esaurito';
        } else {
            submitButton.disabled = false;
            submitButton.innerText = initialButtonText;
            if (hasVariants && quantity === 1) {
                var singleVariantSelector = form.querySelector('#variantSelection');
                var selectedVariant = productVariants.find(function(v) { return v.id === singleVariantSelector.value; });
                if (selectedVariant && selectedVariant.stockQuantity < 1) {
                    submitButton.disabled = true;
                    submitButton.innerText = 'Variante Esaurita';
                }
            }
        }
    }

    if (offerRadios.length > 0) {
        offerRadios.forEach(function(radio) {
            radio.addEventListener('change', updateFormState);
        });
    }
    
    if (hasVariants) {
        var singleVariantSelector = form.querySelector('#variantSelection');
        if (singleVariantSelector) {
            singleVariantSelector.addEventListener('change', function(e) {
                var selectedOption = e.target.options[e.target.selectedIndex];
                if (variantIdInput) variantIdInput.value = selectedOption.value;
                if (variantNameInput) variantNameInput.value = selectedOption.text.split(' (')[0];
                updateFormState();
            });
            if (singleVariantSelector.options.length > 0) {
                singleVariantSelector.dispatchEvent(new Event('change'));
            }
        }
    }
    
    updateFormState();
})();
</script>`;

        const formHtml = `
<form style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 400px; font-family: sans-serif; margin: 0 auto;" id="mws-order-form">
  <input type="hidden" name="productId" value="${product.id}">
  <input type="hidden" name="bundleId" value="">
  <input type="hidden" name="quantity" value="1">
  <input type="hidden" name="variantId" value="">
  <input type="hidden" name="variantName" value="">
  <input type="hidden" name="refNumber" value="${product.refNumber}">
  <input type="hidden" name="affiliateId" value="${affiliateIdentifier}">
  <input type="hidden" name="subId" value="${subId}">
  <input type="hidden" name="redirectUrl" value="${thankYouUrl}">
  <input type="hidden" name="webhookUrl" value="${webhookUrl}">
  <input type="hidden" name="globalWebhookUrl" value="${platformSettings.global_webhook_url || ''}">
  <h3 style="margin-top: 0; color: ${formColors.titleColor};">${formTitle}</h3>
  
  <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #f7f7f7;">
    <h4 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1em; color: ${formColors.titleColor};">1. Scegli la tua Offerta</h4>
    ${offerSelectorHtml}
    ${variantSelectorHtml}
  </div>
  
  <h4 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1em; color: ${formColors.titleColor};">2. Completa i tuoi dati</h4>
  ${generateCustomerFields()}

  <div style="margin-bottom: 15px; font-size: 12px; color: ${formColors.labelColor}; margin-top: 15px;">
    <label for="privacy_consent" style="display: flex; align-items: center; cursor: pointer;">
      <input type="checkbox" id="privacy_consent" name="privacyConsent" required checked style="margin-right: 8px;">
      Acconsento al trattamento dei dati personali${privacyLinkHtml}.
    </label>
  </div>
  <div id="mws-submit-error" style="color: red; font-size: 12px; text-align: center; min-height: 16px; margin-bottom: 10px;"></div>
  <button type="submit" id="mws-submit-button" style="width: 100%; padding: 10px; background-color: ${formColors.buttonBgColor}; color: ${formColors.buttonTextColor}; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; transition: background-color 0.2s;">
    ${buttonText}
  </button>
  ${bundleLogicScript}
</form>`;

    const submissionScript = `
<script type="module">
(async function() {
  const form = document.getElementById('mws-order-form');
  const submitButton = document.getElementById('mws-submit-button');
  const errorDiv = document.getElementById('mws-submit-error');
  
  if (!form || !submitButton || !errorDiv) return;

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabaseUrl = 'https://radhkbocafjpglgmbpyy.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhZGhrYm9jYWZqcGdsZ21icHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzcwNDcsImV4cCI6MjA4MjE1MzA0N30.BtUupmNUJ1CA8X8FGRSyh6VgNXLSYM-WrajbsUED5FM';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const generateId = () => \`S-\${Date.now()}-\${Math.random().toString(36).substring(2, 8).toUpperCase()}\`;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.innerText = 'Invio in corso...';
    errorDiv.innerText = '';
    
    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const affIdToLookup = data.affiliateId;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const userAgent = navigator.userAgent;

      // --- OTTIMIZZAZIONE 1: FETCH PARALLELA IP E PROFILO ---
      const fetchIp = async () => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 1500); // Timeout 1.5s per l'IP
          try {
              const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
              clearTimeout(id);
              if (res.ok) return (await res.json()).ip;
          } catch(e) {}
          return 'not_captured';
      };

      const fetchProfile = async () => {
          try {
              const query = uuidRegex.test(affIdToLookup) 
                  ? supabase.from('profiles').select('id, name').eq('id', affIdToLookup).maybeSingle()
                  : supabase.from('profiles').select('id, name').eq('short_id', affIdToLookup).maybeSingle();
              const { data: p } = await query;
              return p ? { id: p.id, name: p.name } : { id: affIdToLookup, name: 'Partner Attribuito' };
          } catch(e) { return { id: affIdToLookup, name: 'Partner Attribuito' }; }
      };

      const [ipAddress, profile] = await Promise.all([fetchIp(), fetchProfile()]);
      
      const blocked_ips = ${JSON.stringify(platformSettings.blocked_ips || [])};
      if (blocked_ips.includes(ipAddress)) {
          errorDiv.innerText = 'Impossibile completare l\\'ordine in questo momento.';
          submitButton.disabled = false;
          submitButton.innerText = '${escapedButtonText}';
          return;
      }

      const product = ${JSON.stringify({
        name: product.name,
        price: product.price,
        commissionValue: product.commissionValue,
        freeShipping: product.freeShipping ?? true,
        shippingCharge: product.shippingCharge || 0,
        bundleOptions: product.bundleOptions || [],
      })};

      const quantity = Number(data.quantity);
      let saleAmount = product.price;
      let commissionAmount = product.commissionValue;

      if (data.bundleId && product.bundleOptions) {
          const b = product.bundleOptions.find(x => x.id === data.bundleId);
          if (b) { saleAmount = b.price; commissionAmount = b.commissionValue; }
      }
      if (!product.freeShipping && product.shippingCharge > 0) saleAmount += product.shippingCharge;

      const salePayload = {
        id: generateId(),
        product_id: data.productId,
        product_name: product.name,
        affiliate_id: profile.id,
        affiliate_name: profile.name,
        sale_amount: Number(saleAmount),
        commission_amount: Number(commissionAmount),
        quantity: quantity,
        bundle_id: data.bundleId || null,
        sale_date: new Date().toISOString(),
        status: data.customerName?.toLowerCase().includes('test') ? 'Test' : 'In attesa',
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        customer_street_address: data.customer_street_address,
        customer_house_number: data.customer_house_number,
        customer_city: data.customer_city,
        customer_province: data.customer_province,
        customer_zip: data.customer_zip,
        sub_id: data.subId || null,
        webhook_url: [data.webhookUrl, data.globalWebhookUrl].filter(Boolean).join(', ') || null,
        user_agent: userAgent,
        ip_address: ipAddress,
      };

      if (quantity > 1) {
          const sels = form.querySelectorAll('select[name="bundleVariantSelection"]');
          salePayload.selected_variants = Array.from(sels).map(s => ({
              variantId: s.value,
              variantName: s.options[s.selectedIndex].text.split(' (')[0]
          }));
      } else {
          salePayload.variant_id = data.variantId;
          salePayload.variant_name = data.variantName;
      }

      // --- OTTIMIZZAZIONE 2: INSERT ORDINE ---
      const { error: saleError } = await supabase.from('sales').insert(salePayload);
      if (saleError) throw saleError;

      // --- OTTIMIZZAZIONE 3: WEBHOOK E STOCK IN PARALLELO (POST-INSERT) ---
      const webhookUrls = [data.webhookUrl, data.globalWebhookUrl].filter(Boolean);
      
      const postOrderTasks = [];
      
      // Aggiungi task webhooks
      webhookUrls.forEach(url => {
          postOrderTasks.push(fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(salePayload)
          }).catch(() => {})); // Silenzia errori webhook per non bloccare
      });

      // Aggiungi task aggiornamento stock
      const updateStockTask = (async () => {
          try {
              const { data: pData } = await supabase.from('products').select('stock_quantity, variants').eq('id', data.productId).single();
              if (!pData) return;
              let upd = {};
              if (salePayload.selected_variants) {
                  const v = [...(pData.variants || [])];
                  salePayload.selected_variants.forEach(sv => {
                      const target = v.find(x => x.id === sv.variantId);
                      if (target) target.stockQuantity--;
                  });
                  upd = { variants: v };
              } else if (salePayload.variant_id) {
                  upd = { variants: (pData.variants || []).map(x => x.id === salePayload.variant_id ? { ...x, stockQuantity: x.stockQuantity - quantity } : x) };
              } else {
                  upd = { stock_quantity: (pData.stock_quantity || 0) - quantity };
              }
              await supabase.from('products').update(upd).eq('id', data.productId);
          } catch(e) {}
      })();
      postOrderTasks.push(updateStockTask);

      // Aspetta che tutti i task critici finiscano in parallelo
      await Promise.allSettled(postOrderTasks);
      
      window.location.href = data.redirectUrl || '/';
      
    } catch (error) {
      errorDiv.innerText = 'Errore di sistema. Riprova tra poco.';
      submitButton.disabled = false;
      submitButton.innerText = '${escapedButtonText}';
    }
  });
})();
</script>`;
        
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:1rem;font-family:sans-serif;background-color:#f8f9fa;}</style></head><body>${formHtml}${submissionScript}</body></html>`;

    }, [product, formTitle, thankYouUrl, webhookUrl, subId, buttonText, variant_bundle_label, privacyPolicyUrl, formFields, formColors, currentAffiliate, showBundles, showShippingText, platformSettings, stockQuantity]);

    const codeToCopy = useMemo(() => {
        const bodyContentRegex = /<body>([\s\S]*)<\/body>/;
        const match = generatedHtml.match(bodyContentRegex);
        return match ? `<!-- Incolla questo codice nel tuo sito web -->\n${match[1].trim()}` : '';
    }, [generatedHtml]);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const deviceWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    };

    const formFieldControls: { key: keyof FormFields, label: string }[] = [
        { key: 'name', label: 'Nome e Cognome' },
        { key: 'street_address', label: 'Indirizzo' },
        { key: 'house_number', label: 'Numero Civico' },
        { key: 'city', label: 'Città' },
        { key: 'province', label: 'Provincia' },
        { key: 'zip', label: 'CAP' },
        { key: 'phone', label: 'Telefono' },
        { key: 'email', label: 'Email' },
    ];

    return (
        <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-on-surface mb-4">Generatore Form HTML</h3>
            <p className="text-sm text-gray-600 mb-6">Personalizza e copia il codice del form da inserire nel tuo sito per vendere questo prodotto.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="formTitle" className="block text-sm font-medium text-gray-700">Titolo del Formulario</label>
                            <input type="text" id="formTitle" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="thankYouUrl" className="block text-sm font-medium text-gray-700">Pagina di Ringraziamento (URL)</label>
                            <input type="text" id="thankYouUrl" value={thankYouUrl} onChange={(e) => setThankYouUrl(e.target.value)} placeholder="https://iltuosito.com/grazie" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">Webhook (URL) - Opzionale</label>
                            <input type="text" id="webhookUrl" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://iltuosito.com/api/webhook" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="subId" className="block text-sm font-medium text-gray-700">Sub ID (es. 'facebook', 'tiktok') - Opzionale</label>
                            <input type="text" id="subId" value={subId} onChange={(e) => setSubId(e.target.value)} placeholder="facebook" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700">Testo del Pulsante</label>
                            <input type="text" id="buttonText" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="variant_bundle_label" className="block text-sm font-medium text-gray-700">Etichetta selezione varianti (multi-pack)</label>
                            <input type="text" id="variant_bundle_label" value={variant_bundle_label} onChange={(e) => setVariantBundleLabel(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            <p className="mt-1 text-xs text-gray-500">Usa <code className="bg-gray-200 px-1 rounded">{'{n}'}</code> per inserire il numero del prodotto (es. Prodotto 1).</p>
                        </div>
                        <div>
                            <label htmlFor="privacyPolicyUrl" className="block text-sm font-medium text-gray-700">URL Privacy Policy (Opzionale)</label>
                            <input type="url" id="privacyPolicyUrl" value={privacyPolicyUrl} onChange={(e) => setPrivacyPolicyUrl(e.target.value)} placeholder="https://tuosito.com/privacy" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>

                        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
                            <h3 className="text-base font-medium text-gray-800">Stile Formulario</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="titleColor" className="block text-sm font-medium text-gray-700">Colore Titolo</label>
                                    <input type="color" id="titleColor" value={formColors.titleColor} onChange={(e) => handleColorChange('titleColor', e.target.value)} className="mt-1 w-full h-8 p-0 border border-gray-300 rounded-md cursor-pointer" />
                                </div>
                                <div>
                                    <label htmlFor="labelColor" className="block text-sm font-medium text-gray-700">Colore Etichette</label>
                                    <input type="color" id="labelColor" value={formColors.labelColor} onChange={(e) => handleColorChange('labelColor', e.target.value)} className="mt-1 w-full h-8 p-0 border border-gray-300 rounded-md cursor-pointer" />
                                </div>
                                <div>
                                    <label htmlFor="buttonBgColor" className="block text-sm font-medium text-gray-700">Sfondo Pulsante</label>
                                    <input type="color" id="buttonBgColor" value={formColors.buttonBgColor} onChange={(e) => handleColorChange('buttonBgColor', e.target.value)} className="mt-1 w-full h-8 p-0 border border-gray-300 rounded-md cursor-pointer" />
                                </div>
                                <div>
                                    <label htmlFor="buttonTextColor" className="block text-sm font-medium text-gray-700">Testo Pulsante</label>
                                    <input type="color" id="buttonTextColor" value={formColors.buttonTextColor} onChange={(e) => handleColorChange('buttonTextColor', e.target.value)} className="mt-1 w-full h-8 p-0 border border-gray-300 rounded-md cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
                            <div>
                                <h3 className="text-base font-medium text-gray-800 mb-2">Campi del Formulario d'Ordine</h3>
                                <p className="text-sm text-gray-500 mb-4">Seleziona quali informazioni richiedere, se sono obbligatorie e la larghezza del campo.</p>
                                
                                <div className="space-y-3">
                                    {formFieldControls.map(({ key, label }) => (
                                        <div key={String(key)} className="p-3 border rounded-md bg-white shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-gray-800">{label}</span>
                                                <div className="flex items-center gap-4">
                                                    <label htmlFor={`visible-${String(key)}`} className="flex items-center text-sm text-gray-600 cursor-pointer">
                                                        <input id={`visible-${String(key)}`} type="checkbox" checked={formFields[key]?.visible} onChange={(e) => handleFormFieldChange(key, 'visible', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                                        <span className="ml-2">Visibile</span>
                                                    </label>
                                                     <label htmlFor={`required-${String(key)}`} className="flex items-center text-sm text-gray-600 cursor-pointer">
                                                        <input id={`required-${String(key)}`} type="checkbox" checked={formFields[key]?.required} onChange={(e) => handleFormFieldChange(key, 'required', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" disabled={!formFields[key]?.visible} />
                                                        <span className="ml-2">Obbligatorio</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                                <div>
                                                    <label htmlFor={`width-${String(key)}`} className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
                                                        <span>Larghezza</span>
                                                        <span className="font-semibold">{formFields[key]?.width}%</span>
                                                    </label>
                                                     <input id={`width-${String(key)}`} type="range" min="20" max="100" step="10" value={formFields[key]?.width} onChange={(e) => handleFormFieldChange(key, 'width', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-100" disabled={!formFields[key]?.visible} />
                                                </div>
                                                <div>
                                                     <label htmlFor={`placeholder-${String(key)}`} className="block text-xs font-medium text-gray-500 mb-1">Testo di esempio</label>
                                                    <input id={`placeholder-${String(key)}`} type="text" value={formFields[key]?.placeholder || ''} onChange={(e) => handleFormFieldChange(key, 'placeholder', e.target.value)} placeholder="Esempio..." className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100" disabled={!formFields[key]?.visible} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {product.bundleOptions && product.bundleOptions.length > 0 && (
                                <div className="flex items-center pt-4 border-t">
                                    <input
                                        id="show-bundles-toggle"
                                        type="checkbox"
                                        checked={showBundles}
                                        onChange={() => setShowBundles(prev => !prev)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="show-bundles-toggle" className="ml-3 block text-sm font-medium text-gray-900">
                                        Mostra Opzioni Multi-Pack nel form
                                    </label>
                                </div>
                            )}
                             {canToggleShippingText && (
                                <div className="flex items-center pt-4 border-t">
                                    <input
                                        id="show-shipping-text-toggle"
                                        type="checkbox"
                                        checked={showShippingText}
                                        onChange={() => setShowShippingText(prev => !prev)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="show-shipping-text-toggle" className="ml-3 block text-sm font-medium text-gray-900">
                                        Mostra "+ Sped." accanto al prezzo nel form
                                    </label>
                                </div>
                             )}
                        </div>
                    </div>
                     <div className="mt-6 relative">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Codice da Copiare</h4>
                        <pre className="bg-gray-800 text-white p-4 rounded-md text-xs overflow-x-auto max-h-64"><code>{codeToCopy}</code></pre>
                        <button onClick={handleCopy} className="absolute top-10 right-2 bg-gray-600 text-white px-3 py-1 text-xs rounded hover:bg-gray-500">{copied ? 'Copiato!' : 'Copia'}</button>
                    </div>
                </div>

                <div className="relative">
                    <div className="sticky top-8">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Anteprima Form</h4>
                        <div className="flex justify-center gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                            {(['desktop', 'tablet', 'mobile'] as const).map(device => (
                                <button
                                    key={device}
                                    onClick={() => setPreviewDevice(device)}
                                    className={`p-2 rounded-md transition-colors ${previewDevice === device ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-white'}`}
                                    aria-label={`Visualizza anteprima ${device}`}
                                >
                                    {device === 'desktop' && <DesktopIcon className="w-5 h-5" />}
                                    {device === 'tablet' && <TabletIcon className="w-5 h-5" />}
                                    {device === 'mobile' && <MobileIcon className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                        <div className="w-full bg-gray-200 p-2 sm:p-4 rounded-lg flex justify-center items-center">
                            <div 
                                className="border rounded-xl shadow-lg overflow-hidden bg-white transition-all duration-300 ease-in-out mx-auto"
                                style={{ width: deviceWidths[previewDevice], height: '640px' }}
                            >
                                <iframe
                                    srcDoc={generatedHtml}
                                    title="Anteprima Formulario"
                                    className="w-full h-full border-0"
                                    sandbox="allow-forms allow-scripts allow-same-origin"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormGenerator;
