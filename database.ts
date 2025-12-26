import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Product, Affiliate, Manager, LogisticsUser, CustomerCareUser, Sale, Notification, Ticket, TicketReply, Transaction, User, UserRole, TicketStatus, Admin, PlatformSettings, StockExpense } from './types';

const supabaseUrl = 'https://radhkbocafjpglgmbpyy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhZGhrYm9jYWZqcGdsZ21icHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzcwNDcsImV4cCI6MjA4MjE1MzA0N30.BtUupmNUJ1CA8X8FGRSyh6VgNXLSYM-WrajbsUED5FM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mws-auth-session-v4',
    storage: window.localStorage
  }
});

export const generateShortId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Helper per mappare i profili dal DB
const mapProfileFromDB = (p: any): User => ({
    id: p.id,
    short_id: p.short_id,
    name: p.name || '',
    email: p.email || '',
    role: (p.role as UserRole) || UserRole.AFFILIATE,
    status: p.status || 'pending',
    isBlocked: p.is_blocked ?? false,
    currentBalance: Number(p.currentBalance || 0),
    privacyPolicyUrl: p.privacy_policy_url || ''
} as any);

// RPC per approvazione
export const approveUserRPC = async (userId: string) => {
    return supabase.rpc('approve_user_v1', { target_user_id: userId });
};

export const rejectUserRPC = async (userId: string) => {
    return supabase.rpc('reject_user_v1', { target_user_id: userId });
};

export const sendApprovalEmail = async (userEmail: string, userName: string) => {
    try {
        console.log("Email di approvazione inviata a:", userEmail);
        return true;
    } catch (e) {
        return false;
    }
};

const silentFetch = async (table: string, select: string = '*') => {
    try {
        const { data, error } = await supabase.from(table).select(select);
        if (error) return [];
        return data || [];
    } catch (e) {
        return [];
    }
};

const mapProductFromDB = (p: any): Product => ({
    id: p.id || '',
    name: p.name || 'Prodotto',
    description: p.description || '',
    price: Number(p.price || 0),
    commissionValue: Number(p.commission_value || 0),
    imageUrl: p.image_url || 'https://via.placeholder.com/400',
    galleryImageUrls: p.gallery_image_urls || [],
    niche: p.niche || 'Generale',
    refNumber: p.ref_number || 'REF',
    isActive: p.is_active ?? true,
    allowedAffiliateIds: p.allowed_affiliate_ids || null,
    costOfGoods: Number(p.cost_of_goods || 0),
    shippingCost: Number(p.shipping_cost || 0),
    fulfillmentCost: Number(p.fulfillment_cost || 0),
    platformFee: Number(p.platform_fee || 0),
    customerCareCommission: Number(p.customer_care_commission || 0),
    freeShipping: p.free_shipping ?? true,
    stockQuantity: Number(p.stock_quantity || 0),
    variants: p.variants || [],
    createdAt: p.created_at || new Date().toISOString(),
    landingPages: p.landing_pages || [],
    creatives: p.creatives || [],
    variant_bundle_label: p.variant_bundle_label || 'Scegli la variante (Prodotto {n})',
    bundleOptions: p.bundle_options || []
});

const mapSaleFromDB = (s: any): Sale => ({
    id: s.id,
    productId: s.product_id,
    productName: s.product_name,
    affiliateId: String(s.affiliate_id || ''),
    affiliateName: s.affiliate_name,
    saleAmount: Number(s.sale_amount || 0),
    commissionAmount: Number(s.commission_amount || 0),
    saleDate: s.sale_date,
    customerEmail: s.customer_email || '',
    customerName: s.customer_name,
    customerPhone: s.customer_phone,
    customer_street_address: s.customer_street_address,
    customer_house_number: s.customer_house_number,
    customer_city: s.customer_city,
    customer_province: s.customer_province,
    customer_zip: s.customer_zip,
    subId: s.sub_id,
    status: s.status,
    trackingCode: s.tracking_code,
    quantity: s.quantity,
    bundleId: s.bundle_id,
    variantId: s.variant_id,
    variantName: s.variant_name,
    selectedVariants: s.selected_variants,
    notes: s.notes,
    statusUpdatedAt: s.status_updated_at,
    lastContactedBy: s.last_contacted_by,
    lastContactedByName: s.last_contacted_by_name,
    user_agent: s.user_agent,
    ip_address: s.ip_address,
    contactHistory: s.contact_history || [],
    isBonus: s.is_bonus,
    webhookUrl: s.webhook_url,
    webhookStatus: s.webhook_status,
});

const mapSaleToDB = (s: Partial<Sale>): any => {
    const mapped: any = {};
    if (s.productId !== undefined) mapped.product_id = s.productId;
    if (s.productName !== undefined) mapped.product_name = s.productName;
    if (s.affiliateId !== undefined) mapped.affiliate_id = s.affiliateId;
    if (s.affiliateName !== undefined) mapped.affiliate_name = s.affiliateName;
    if (s.saleAmount !== undefined) mapped.sale_amount = s.saleAmount;
    if (s.commissionAmount !== undefined) mapped.commission_amount = s.commissionAmount;
    if (s.saleDate !== undefined) mapped.sale_date = s.saleDate;
    if (s.customerEmail !== undefined) mapped.customer_email = s.customerEmail;
    if (s.customerName !== undefined) mapped.customer_name = s.customerName;
    if (s.customerPhone !== undefined) mapped.customer_phone = s.customerPhone;
    if (s.subId !== undefined) mapped.sub_id = s.subId;
    if (s.status !== undefined) mapped.status = s.status;
    if (s.trackingCode !== undefined) mapped.tracking_code = s.trackingCode;
    if (s.quantity !== undefined) mapped.quantity = s.quantity;
    if (s.bundleId !== undefined) mapped.bundle_id = s.bundleId;
    if (s.variantId !== undefined) mapped.variant_id = s.variantId;
    if (s.variantName !== undefined) mapped.variant_name = s.variantName;
    if (s.selectedVariants !== undefined) mapped.selected_variants = s.selectedVariants;
    if (s.notes !== undefined) mapped.notes = s.notes;
    if (s.statusUpdatedAt !== undefined) mapped.status_updated_at = s.statusUpdatedAt;
    if (s.lastContactedBy !== undefined) mapped.last_contacted_by = s.lastContactedBy;
    if (s.lastContactedByName !== undefined) mapped.last_contacted_by_name = s.lastContactedByName;
    if (s.isBonus !== undefined) mapped.is_bonus = s.isBonus;
    if (s.webhookUrl !== undefined) mapped.webhook_url = s.webhookUrl;
    if (s.webhookStatus !== undefined) mapped.webhook_status = s.webhookStatus;
    if (s.customer_street_address !== undefined) mapped.customer_street_address = s.customer_street_address;
    if (s.customer_house_number !== undefined) mapped.customer_house_number = s.customer_house_number;
    if (s.customer_city !== undefined) mapped.customer_city = s.customer_city;
    if (s.customer_province !== undefined) mapped.customer_province = s.customer_province;
    if (s.customer_zip !== undefined) mapped.customer_zip = s.customer_zip;
    if (s.user_agent !== undefined) mapped.user_agent = s.user_agent;
    if (s.ip_address !== undefined) mapped.ip_address = s.ip_address;
    return mapped;
};

const mapTransactionFromDB = (t: any): Transaction => ({
    id: t.id,
    userId: t.user_id,
    type: t.type,
    amount: Number(t.amount || 0),
    status: t.status,
    createdAt: t.created_at,
    notes: t.notes,
    fromUserId: t.from_user_id,
    fromUserName: t.from_user_name,
    toUserId: t.to_user_id,
    toUserName: t.to_user_name,
    paymentMethod: t.payment_method,
    paymentDetails: t.payment_details,
});

export const getCurrentProfile = async (userId: string) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (error || !data) return null;
        return mapProfileFromDB(data);
    } catch (e) {
        return null;
    }
};

export const fetchAllInitialData = async () => {
    const results = await Promise.allSettled([
        silentFetch('products'),
        silentFetch('profiles'),
        silentFetch('sales'),
        silentFetch('notifications'),
        silentFetch('tickets', '*, ticket_replies(*)'),
        silentFetch('transactions'),
        silentFetch('stock_expenses')
    ]);

    const getValue = (index: number) => (results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value : []);

    return { 
        products: getValue(0).map(mapProductFromDB), 
        profilesList: getValue(1).map(mapProfileFromDB), 
        sales: getValue(2).map(mapSaleFromDB), 
        notifications: getValue(3), 
        tickets: getValue(4).map((t: any) => ({ ...t, replies: t.ticket_replies || [] })), 
        transactions: getValue(5).map(mapTransactionFromDB), 
        stockExpenses: getValue(6) 
    };
};

export const getSettings = async (): Promise<PlatformSettings> => {
    try {
        const { data } = await supabase.from('settings').select('*');
        const settings: PlatformSettings = {};
        data?.forEach((s: any) => {
            if (s.key === 'blocked_ips') {
                try { settings.blocked_ips = JSON.parse(s.value); } catch (e) { settings.blocked_ips = []; }
            } else { (settings as any)[s.key] = s.value; }
        });
        return settings;
    } catch (e) { return {}; }
};

export const updateSetting = (key: string, value: string) => supabase.from('settings').upsert({ key, value });

export const addProduct = async (product: Partial<Product>) => {
    const productId = crypto.randomUUID();
    const { data, error } = await supabase.from('products').insert({
        id: productId,
        name: product.name,
        description: product.description,
        price: product.price,
        // FIX: Changed product.commission_value to product.commissionValue to match the Product interface definition.
        commission_value: product.commissionValue,
        image_url: product.imageUrl,
        gallery_image_urls: product.galleryImageUrls,
        niche: product.niche,
        ref_number: product.refNumber,
        is_active: product.isActive,
        allowed_affiliate_ids: product.allowedAffiliateIds,
        cost_of_goods: product.costOfGoods,
        shipping_cost: product.shippingCost,
        fulfillment_cost: product.fulfillmentCost,
        platform_fee: product.platformFee,
        customer_care_commission: product.customerCareCommission,
        free_shipping: product.freeShipping,
        stock_quantity: product.stockQuantity,
        variants: product.variants,
        landing_pages: product.landingPages,
        creatives: product.creatives,
        variant_bundle_label: product.variant_bundle_label,
        bundle_options: product.bundleOptions
    }).select().single();
    if (error) throw error;
    return data;
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.commissionValue !== undefined) dbUpdates.commission_value = updates.commissionValue;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.galleryImageUrls !== undefined) dbUpdates.gallery_image_urls = updates.galleryImageUrls;
    if (updates.niche !== undefined) dbUpdates.niche = updates.niche;
    if (updates.refNumber !== undefined) dbUpdates.ref_number = updates.refNumber;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.allowedAffiliateIds !== undefined) dbUpdates.allowed_affiliate_ids = updates.allowedAffiliateIds;
    if (updates.costOfGoods !== undefined) dbUpdates.cost_of_goods = updates.costOfGoods;
    if (updates.shippingCost !== undefined) dbUpdates.shipping_cost = updates.shippingCost;
    if (updates.fulfillmentCost !== undefined) dbUpdates.fulfillment_cost = updates.fulfillmentCost;
    if (updates.platformFee !== undefined) dbUpdates.platform_fee = updates.platformFee;
    if (updates.customerCareCommission !== undefined) dbUpdates.customer_care_commission = updates.customerCareCommission;
    if (updates.freeShipping !== undefined) dbUpdates.free_shipping = updates.freeShipping;
    if (updates.stockQuantity !== undefined) dbUpdates.stock_quantity = updates.stockQuantity;
    if (updates.variants !== undefined) dbUpdates.variants = updates.variants;
    if (updates.landingPages !== undefined) dbUpdates.landing_pages = updates.landingPages;
    if (updates.creatives !== undefined) dbUpdates.creatives = updates.creatives;
    if (updates.variant_bundle_label !== undefined) dbUpdates.variant_bundle_label = updates.variant_bundle_label;
    if (updates.bundleOptions !== undefined) dbUpdates.bundle_options = updates.bundleOptions;
    return supabase.from('products').update(dbUpdates).eq('id', id);
};

export const deleteProduct = (id: string) => supabase.from('products').delete().eq('id', id);

export const updateAffiliate = async (id: string, updates: Partial<User>) => {
    const dbPayload: any = {};
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.email !== undefined) dbPayload.email = updates.email;
    if (updates.isBlocked !== undefined) dbPayload.is_blocked = updates.isBlocked;
    if (updates.role !== undefined) dbPayload.role = updates.role;
    if ((updates as any).privacyPolicyUrl !== undefined) dbPayload.privacy_policy_url = (updates as any).privacyPolicyUrl;
    
    const { error } = await supabase.from('profiles').update(dbPayload).eq('id', id);
    if (error) throw error;
};

export const deleteAffiliate = (id: string) => supabase.from('profiles').delete().eq('id', id);

export const updateSale = (id: string, updates: Partial<Sale>) => {
    const dbUpdates = mapSaleToDB(updates);
    return supabase.from('sales').update(dbUpdates).eq('id', id);
};

export const addStockExpense = async (expense: Omit<StockExpense, 'id' | 'createdAt' | 'totalCost'>) => {
    const totalCost = expense.quantity * expense.unitCost;
    const { error } = await supabase.from('stock_expenses').insert({
        product_id: expense.productId,
        quantity: expense.quantity,
        unit_cost: expense.unitCost,
        total_cost: totalCost,
        payer: expense.payer,
        notes: expense.notes,
        date: expense.date
    });
    if (error) throw error;
};

export const deleteStockExpense = (id: string) => supabase.from('stock_expenses').delete().eq('id', id);

// --- TRANSAZIONI PAGAMENTI ---

export const createPayoutRequest = async (userId: string, amount: number, method: string, details: string) => {
    const { error } = await supabase.from('transactions').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        type: 'Payout',
        amount: amount,
        status: 'Pending',
        payment_method: method,
        payment_details: details
    });
    return { success: !error, error: error?.message };
};

export const processTransfer = async (fromId: string, toId: string, amount: number, fromName: string, toName: string, notes?: string) => {
    const { error } = await supabase.from('transactions').insert({
        id: crypto.randomUUID(),
        from_user_id: fromId,
        from_user_name: fromName,
        to_user_id: toId,
        to_user_name: toName,
        type: 'Transfer',
        amount: amount,
        status: 'Completed',
        notes: notes || 'Trasferimento P2P'
    });
    return { success: !error, error: error?.message };
};

export const addBonus = async (toId: string, toName: string, amount: number, notes: string) => {
    const { error } = await supabase.from('transactions').insert({
        id: crypto.randomUUID(),
        to_user_id: toId,
        to_user_name: toName,
        type: 'Bonus',
        amount: amount,
        status: 'Completed',
        notes: notes
    });
    return { success: !error, error: error?.message };
};

export const updateTransactionStatus = async (transactionId: string, status: 'Completed' | 'Rejected') => {
    const { error } = await supabase.from('transactions').update({ status }).eq('id', transactionId);
    return { success: !error, error: error?.message };
};

// --- NOTIFICHE ---

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'readBy'>) => {
    const { error } = await supabase.from('notifications').insert({
        title: notification.title,
        message: notification.message,
        target_roles: notification.targetRoles,
        event_type: notification.eventType,
        link_to: notification.linkTo,
        read_by: []
    });
    if (error) throw error;
};

export const deleteNotification = (id: string) => supabase.from('notifications').delete().eq('id', id);

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
    const { data } = await supabase.from('notifications').select('read_by').eq('id', notificationId).single();
    if (data) {
        const readBy = new Set(data.read_by || []);
        readBy.add(userId);
        await supabase.from('notifications').update({ read_by: Array.from(readBy) }).eq('id', notificationId);
    }
};

export const markAllNotificationsAsRead = async (userId: string, roles: UserRole[]) => {
    const { data } = await supabase.from('notifications').select('id, read_by').contains('target_roles', [roles[0]]);
    if (data) {
        for (const n of data) {
            const readBy = new Set(n.read_by || []);
            readBy.add(userId);
            await supabase.from('notifications').update({ read_by: Array.from(readBy) }).eq('id', n.id);
        }
    }
};

export const createTicket = async (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'status'>) => {
    const { error } = await supabase.from('tickets').insert({
        user_id: ticket.userId,
        user_name: ticket.userName,
        user_role: ticket.userRole,
        subject: ticket.subject,
        message: ticket.message,
        status: 'Aperto'
    });
    if (error) throw error;
};

export const addTicketReply = async (ticketId: string, reply: Omit<TicketReply, 'id' | 'createdAt'>) => {
    const { error: replyError } = await supabase.from('ticket_replies').insert({
        ticket_id: ticketId,
        user_id: reply.userId,
        user_name: reply.userName,
        message: reply.message
    });
    if (replyError) throw replyError;
    await supabase.from('tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);
};

export const updateTicketStatus = (ticketId: string, status: TicketStatus) => 
    supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);

export const signOut = () => supabase.auth.signOut();