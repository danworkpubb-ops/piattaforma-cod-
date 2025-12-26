
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AFFILIATE = 'AFFILIATE',
  LOGISTICS = 'LOGISTICS',
  CUSTOMER_CARE = 'CUSTOMER_CARE',
}

export type UserStatus = 'pending' | 'active' | 'blocked';

export interface User {
  id: string;
  short_id?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isBlocked?: boolean;
  notifications?: Notification[];
  password?: string;
  currentBalance?: number;
}

export interface BundleOption { id: string; quantity: number; price: number; commissionValue: number; platformFee?: number; }
export interface Product {
  id: string; name: string; description: string; price: number; commissionValue: number; imageUrl: string; galleryImageUrls?: string[];
  createdAt: string; refNumber: string; isActive: boolean; niche: string; allowedAffiliateIds: string[] | null;
  costOfGoods?: number; shippingCost?: number; shippingCharge?: number; fulfillmentCost?: number; platformFee?: number;
  customerCareCommission?: number; freeShipping?: boolean; affiliateCommissionOverrides?: { [affiliateId: string]: number };
  approvalTolerance?: number; bundleOptions?: BundleOption[]; approvalFrequencyDays?: number;
  weight?: number; height?: number; width?: number; depth?: number; stockQuantity?: number;
  variants?: ProductVariant[]; stockVisibilityRoles?: UserRole[] | null; landingPages?: ProductLink[]; creatives?: ProductLink[]; variant_bundle_label?: string;
}
export interface ProductLink { label: string; url: string; }
export interface ProductVariant { id: string; name: string; stockQuantity: number; }
export interface Affiliate extends User { role: UserRole.AFFILIATE; totalSales: number; totalCommissions: number; currentBalance: number; uniqueLink: string; privacyPolicyUrl?: string; }
export interface Manager extends User { role: UserRole.MANAGER; currentBalance: number; }
export interface LogisticsUser extends User { role: UserRole.LOGISTICS; }
export interface CustomerCareUser extends User { role: UserRole.CUSTOMER_CARE; currentBalance: number; }
export interface Admin extends User { role: UserRole.ADMIN; }

export type SaleStatus = 'In attesa' | 'Contattato' | 'Confermato' | 'Annullato' | 'Cancellato' | 'Spedito' | 'Svincolato' | 'Consegnato' | 'Duplicato' | 'Non raggiungibile' | 'Non ritirato' | 'Test' | 'Giacenza';
export interface Sale {
  id: string; productId: string; productName: string; affiliateId: string; affiliateName: string; saleAmount: number; commissionAmount: number;
  saleDate: string; customerEmail: string; customerName?: string; customerPhone?: string; customer_street_address?: string; customer_house_number?: string;
  customer_city?: string; customer_province?: string; customer_zip?: string; subId: string | null; status: SaleStatus; trackingCode?: string;
  quantity?: number; bundleId?: string; variantId?: string; variantName?: string; selectedVariants?: { variantId: string; variantName: string; }[];
  notes?: string; statusUpdatedAt?: string; lastContactedBy?: string; lastContactedByName?: string; user_agent?: string; ip_address?: string;
  contactHistory?: any[]; isBonus?: boolean;
  webhookUrl?: string;
  webhookStatus?: string;
}

export interface Notification { id: string; title: string; message: string; createdAt: string; targetRoles: UserRole[]; readBy: string[]; eventType?: string; linkTo?: string; }
export interface Transaction { id: string; userId: string; type: string; amount: number; status: string; createdAt: string; notes?: string; fromUserId?: string; fromUserName?: string; toUserId?: string; toUserName?: string; paymentMethod?: string; paymentDetails?: string; }

export type TicketStatus = 'Aperto' | 'In Lavorazione' | 'Chiuso';
export interface Ticket { id: string; userId: string; userName: string; userRole: UserRole; subject: string; message: string; status: TicketStatus; createdAt: string; updatedAt: string; replies: any[]; }
export interface TicketReply { id: string; ticketId: string; userId: string; userName: string; message: string; createdAt: string; }

export type ContactAction = 'welcome_message' | 'giacenza_redelivery' | 'giacenza_pickup' | 'giacenza_find_depot';
export interface ContactHistoryItem {
    id: string;
    userId: string;
    userName: string;
    timestamp: string;
    action: ContactAction;
    message: string;
}

export interface FormFieldConfig { visible: boolean; required: boolean; width: number; placeholder: string; }
export interface FormFields {
    name: FormFieldConfig;
    street_address: FormFieldConfig;
    house_number: FormFieldConfig;
    city: FormFieldConfig;
    province: FormFieldConfig;
    zip: FormFieldConfig;
    phone: FormFieldConfig;
    email: FormFieldConfig;
}

export interface StockExpense { id: string; productId: string; quantity: number; unitCost: number; totalCost: number; payer: 'PLATFORM' | 'LOGISTICS'; notes?: string; date: string; createdAt: string; }
export interface PlatformSettings { 
    platform_logo?: string; 
    logo_sidebar_open_width?: string; 
    logo_sidebar_open_height?: string; 
    logo_sidebar_closed_width?: string; 
    logo_sidebar_closed_height?: string; 
    logo_login_width?: string; 
    logo_login_height?: string; 
    sidebar_open_bg_color?: string; 
    sidebar_open_horizontal_align?: any; 
    sidebar_open_vertical_align?: any; 
    paccofacile_api_key?: string; 
    spediamo_api_key?: string; // Nuova chiave API
    sender_name?: string; 
    sender_company?: string; 
    sender_address?: string; 
    sender_city?: string; 
    sender_zip?: string; 
    sender_province?: string; 
    sender_phone?: string; 
    sender_email?: string; 
    global_webhook_url?: string; 
    blocked_ips?: string[]; 
    whatsapp_welcome_template?: string; 
    available_niches?: string; 
}
