
import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import Modal from './components/Modal';
import * as db from './database';
import { User, UserRole, Product, Affiliate, Sale, Manager, LogisticsUser, Notification, Transaction, Ticket, CustomerCareUser, Admin, PlatformSettings, StockExpense, TicketStatus, SaleStatus, ContactHistoryItem } from './types';

const AffiliateManager = lazy(() => import('./components/AffiliateManager'));
const ManagerList = lazy(() => import('./components/ManagerList'));
const OrderList = lazy(() => import('./components/OrderList'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const OrderDetail = lazy(() => import('./components/OrderDetail'));
const Performance = lazy(() => import('./components/Performance'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const PaymentsPage = lazy(() => import('./components/PaymentsPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const InventoryPage = lazy(() => import('./components/InventoryPage'));
const AccountingPage = lazy(() => import('./components/AccountingPage'));
const NotificationListView = lazy(() => import('./components/NotificationListView'));
const NotificationManager = lazy(() => import('./components/NotificationManager'));
const NotificationDetailView = lazy(() => import('./components/NotificationDetailView'));
const AssistancePage = lazy(() => import('./components/AssistancePage'));
const TicketDetailView = lazy(() => import('./components/TicketDetailView'));
const TicketForm = lazy(() => import('./components/TicketForm'));
const NicheManager = lazy(() => import('./components/NicheManager'));
const ProductForm = lazy(() => import('./components/ProductForm'));
const AffiliateForm = lazy(() => import('./components/AffiliateForm'));
const CustomerContactModal = lazy(() => import('./components/CustomerContactModal'));
const WhatsAppTemplateModal = lazy(() => import('./components/WhatsAppTemplateModal'));
const LogisticsOrderModal = lazy(() => import('./components/LogisticsOrderModal'));
const SpediamoModal = lazy(() => import('./components/SpediamoModal'));

const ViewLoader = () => (
    <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
);

type View = 'dashboard' | 'products' | 'product-detail' | 'affiliates' | 'orders' | 'managers' | 'performance' | 'profile' | 'notifications' | 'notification-detail' | 'pagamenti' | 'assistenza' | 'ticket-detail' | 'settings' | 'contabilita' | 'magazzino';

const VIEW_STORAGE_KEY = 'mws-current-view';

function App() {
  const [user, setUser] = useState<User | null>(null);
  
  const [view, setView] = useState<View>(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
    return (savedView as View) || 'dashboard';
  });

  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const initializedRef = useRef(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [logistics, setLogistics] = useState<LogisticsUser[]>([]);
  const [customerCareUsers, setCustomerCareUsers] = useState<CustomerCareUser[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({});
  const [stockExpenses, setStockExpenses] = useState<StockExpense[]>([]);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAffiliateFormOpen, setIsAffiliateFormOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | User | null>(null);
  const [isNicheModalOpen, setIsNicheModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Sale | null>(null);
  const [contactingOrder, setContactingOrder] = useState<Sale | null>(null);
  const [shippingOrder, setShippingOrder] = useState<Sale | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [niches, setNiches] = useState<string[]>(['Generale']);

  useEffect(() => {
    if (user) {
        localStorage.setItem(VIEW_STORAGE_KEY, view);
    }
  }, [view, user]);

  const fetchData = useCallback(async () => {
    try {
        const [data, settings] = await Promise.all([
            db.fetchAllInitialData(),
            db.getSettings()
        ]);
        
        const allProfiles = data.profilesList || [];
        
        setProducts(data.products || []);
        setAdmins(allProfiles.filter(p => p.role === UserRole.ADMIN) as Admin[]);
        setManagers(allProfiles.filter(p => p.role === UserRole.MANAGER) as Manager[]);
        setLogistics(allProfiles.filter(p => p.role === UserRole.LOGISTICS) as LogisticsUser[]);
        setCustomerCareUsers(allProfiles.filter(p => p.role === UserRole.CUSTOMER_CARE) as CustomerCareUser[]);
        
        setAffiliates(allProfiles.filter(p => 
            p.role === UserRole.AFFILIATE || 
            !p.role || 
            (p.role !== UserRole.ADMIN && p.role !== UserRole.MANAGER && p.role !== UserRole.LOGISTICS && p.role !== UserRole.CUSTOMER_CARE)
        ) as Affiliate[]);

        setSales(data.sales || []);
        setNotifications(data.notifications || []);
        setTickets(data.tickets as Ticket[] || []);
        setTransactions(data.transactions || []);
        setStockExpenses(data.stockExpenses || []);
        setPlatformSettings(settings || {});
        
        if (settings?.available_niches) {
            try { setNiches(JSON.parse(settings.available_niches)); } catch (e) { setNiches(['Generale']); }
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const startApp = async () => {
      try {
        const { data: { session } } = await db.supabase.auth.getSession();
        if (session?.user) {
          const profile = await db.getCurrentProfile(session.user.id);
          if (profile) {
            setUser(profile);
            fetchData();
          }
        } else {
          const settings = await db.getSettings();
          setPlatformSettings(settings);
        }
      } catch (e) {
        console.error("Init crash:", e);
      } finally {
        setLoading(false);
      }
    };

    startApp();
  }, [fetchData]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    fetchData();
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
        await db.signOut();
    } catch (error) {
        console.error("Errore durante il logout database:", error);
    } finally {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setView('dashboard');
        setLoading(false);
    }
  };

  const allVisibleSales = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.AFFILIATE) {
        return sales.filter(s => s.affiliateId === user.id || (user.short_id && s.affiliateId === user.short_id));
    }
    return sales;
  }, [user, sales]);

  const allUsersWithBalance = useMemo(() => [
      ...admins.map(a => ({ ...a, currentBalance: 999999 })),
      ...affiliates, ...managers, ...customerCareUsers, ...logistics
  ], [admins, affiliates, managers, customerCareUsers, logistics]);

  const fullUserObject = useMemo(() => {
    if (!user) return null;
    return allUsersWithBalance.find(u => u.id === user.id) || user;
  }, [user, allUsersWithBalance]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-background">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Login onLogin={handleLogin} platformSettings={platformSettings} />;

  return (
    <div className="bg-background min-h-screen">
      <Sidebar 
        user={user} onNavigate={setView} onLogout={handleLogout} currentView={view} 
        assistanceNotificationCount={tickets.filter(t => t.status === 'Aperto').length}
        pendingPaymentsCount={transactions.filter(t => t.type === 'Payout' && t.status === 'Pending').length}
        isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} platformSettings={platformSettings}
      />
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header
          user={user} fullUserObject={fullUserObject as any} sales={allVisibleSales} products={products}
          notifications={notifications.filter(n => n.targetRoles.includes(user.role))}
          transactions={transactions}
          onOpenCommissionDetails={() => {}}
          onMarkAsRead={async (id) => { await db.markNotificationAsRead(id, user.id); fetchData(); }}
          onMarkAllAsRead={async () => { await db.markAllNotificationsAsRead(user.id, [user.role]); fetchData(); }}
          onViewNotification={(n) => { setViewingNotification(n); setView('notification-detail'); }}
          onOpenPlatformCheck={() => {}}
        />

        <div className="p-4">
            <Suspense fallback={<ViewLoader />}>
                {view === 'dashboard' && <Dashboard user={user} products={products} affiliates={affiliates} sales={allVisibleSales} notifications={notifications} />}
                {view === 'products' && <ProductList products={products} userRole={user.role} niches={niches} onAddProduct={() => { setEditingProduct(null); setIsProductFormOpen(true); }} onEditProduct={(p) => { setEditingProduct(p); setIsProductFormOpen(true); }} onDeleteProduct={async (id) => { if(confirm('Eliminare?')){ await db.deleteProduct(id); fetchData(); }}} onViewProduct={(p) => { setViewingProduct(p); setView('product-detail'); }} onOpenNicheManager={() => setIsNicheModalOpen(true)} />}
                {view === 'product-detail' && viewingProduct && <ProductDetail product={viewingProduct} userRole={user.role} affiliates={affiliates} sales={allVisibleSales} currentAffiliate={user.role === UserRole.AFFILIATE ? (user as Affiliate) : undefined} onBack={() => setView('products')} onEdit={(p) => { setEditingProduct(p); setIsProductFormOpen(true); }} platformSettings={platformSettings} />}
                {view === 'orders' && <OrderList user={user} sales={allVisibleSales} affiliates={allUsersWithBalance as any} platformSettings={platformSettings} onViewOrder={setViewingOrder} onContactCustomer={setContactingOrder} onShipOrder={setShippingOrder} onManageOrder={()=>{}} onOpenWhatsAppTemplateEditor={() => setIsWhatsAppModalOpen(true)} onRefreshData={fetchData} 
                  onUpdateSaleStatus={async (id, s) => { 
                    const updates: any = { status: s, statusUpdatedAt: new Date().toISOString() };
                    await db.updateSale(id, updates); 
                    fetchData(); 
                  }} 
                  onUpdateSale={async (s) => { await db.updateSale(s.id, s); fetchData(); }} 
                />}
                {view === 'affiliates' && <AffiliateManager affiliates={affiliates} onAddAffiliate={() => { setEditingAffiliate(null); setIsAffiliateFormOpen(true); }} onEditAffiliate={(a) => { setEditingAffiliate(a); setIsAffiliateFormOpen(true); }} onDeleteAffiliate={async (id) => { if(confirm('Eliminare?')){ await db.deleteAffiliate(id); fetchData(); }}} onRefreshData={fetchData} />}
                {view === 'pagamenti' && <PaymentsPage 
                    user={user} 
                    products={products} 
                    fullUserObject={fullUserObject as any} 
                    allUsersWithBalance={allUsersWithBalance as any} 
                    transactions={transactions} 
                    sales={allVisibleSales} 
                    onPayoutRequest={async (uId, amt, meth, det) => { const res = await db.createPayoutRequest(uId, amt, meth, det); await fetchData(); return res; }} 
                    onTransferFunds={async(fId, tId, amt, n) => { 
                        const sender = allUsersWithBalance.find(u => u.id === fId);
                        const receiver = allUsersWithBalance.find(u => u.id === tId);
                        const res = await db.processTransfer(fId, tId, amt, sender?.name || 'Inviante', receiver?.name || 'Ricevente', n); 
                        await fetchData(); return res; 
                    }} 
                    onAdminTransferFunds={async(fId, tId, amt) => { 
                        const sender = allUsersWithBalance.find(u => u.id === fId);
                        const receiver = allUsersWithBalance.find(u => u.id === tId);
                        const res = await db.processTransfer(fId, tId, amt, sender?.name || 'Inviante', receiver?.name || 'Ricevente', 'Trasferimento Amministrativo'); 
                        await fetchData(); return res; 
                    }} 
                    onApproveTransaction={async (id) => { await db.updateTransactionStatus(id, 'Completed'); fetchData(); }} 
                    onRejectTransaction={async (id) => { await db.updateTransactionStatus(id, 'Rejected'); fetchData(); }} 
                    onAddBonus={async(tId, amt, n) => { 
                        const receiver = allUsersWithBalance.find(u => u.id === tId);
                        const res = await db.addBonus(tId, receiver?.name || 'Ricevente', amt, n); 
                        await fetchData(); return res; 
                    }} 
                />}
                {view === 'profile' && <ProfilePage user={user} fullUserObject={fullUserObject as any} onUpdateProfile={async (data) => { await db.updateAffiliate(user.id, data); fetchData(); }} onChangePassword={async()=>true} />}
                {view === 'settings' && <SettingsPage user={user} settings={platformSettings} products={products} onSaveAppearance={async (d) => { for (const k in d) await db.updateSetting(k, String((d as any)[k])); fetchData(); }} onSaveIntegrations={async (d) => { for (const k in d) await db.updateSetting(k, String((d as any)[k])); fetchData(); }} onSaveIpBlocklist={async (ips) => { await db.updateSetting('blocked_ips', JSON.stringify(ips)); fetchData(); }} />}
                {view === 'magazzino' && <InventoryPage products={products} onUpdateStock={async (id, upd) => { if ('variantId' in upd) { const p = products.find(x => x.id === id); if (p) { const nv = p.variants?.map(v => v.id === upd.variantId ? { ...v, stockQuantity: upd.stockQuantity } : v); await db.updateProduct(id, { variants: nv }); } } else { await db.updateProduct(id, { stockQuantity: upd.stockQuantity }); } fetchData(); }} />}
                {view === 'performance' && <Performance user={user} sales={allVisibleSales} products={products} affiliates={affiliates} stockExpenses={stockExpenses} onRefreshData={fetchData} />}
                {view === 'contabilita' && <AccountingPage products={products} sales={allVisibleSales} stockExpenses={stockExpenses} transactions={transactions} onAddExpense={async (e) => { await db.addStockExpense(e); fetchData(); }} onDeleteExpense={async (id) => { await db.deleteStockExpense(id); fetchData(); }} />}
                {view === 'assistenza' && <AssistancePage user={user} tickets={tickets} onOpenNewTicket={() => setIsTicketFormOpen(true)} onViewTicket={(t) => { setViewingTicket(t); setView('ticket-detail'); }} />}
                {view === 'ticket-detail' && viewingTicket && <TicketDetailView user={user} ticket={viewingTicket} onBack={() => setView('assistenza')} onAddReply={async (id, msg) => { await db.addTicketReply(id, { ticketId: id, userId: user.id, userName: user.name, message: msg }); fetchData(); }} onUpdateStatus={async (id, s) => { await db.updateTicketStatus(id, s as TicketStatus); fetchData(); }} />}
            </Suspense>
        </div>
      </main>

      <Suspense fallback={null}>
        <Modal isOpen={!!shippingOrder} onClose={() => setShippingOrder(null)} title="Gestione Spedizione" size="3xl">
            {shippingOrder && platformSettings.spediamo_api_key ? (
                <SpediamoModal 
                    sale={shippingOrder}
                    product={products.find(p => p.id === shippingOrder.productId)!}
                    settings={platformSettings}
                    onClose={() => setShippingOrder(null)}
                    onSuccess={async (tracking) => {
                        await db.updateSale(shippingOrder.id, { 
                            status: 'Spedito', 
                            trackingCode: tracking, 
                            statusUpdatedAt: new Date().toISOString() 
                        });
                        await fetchData();
                    }}
                />
            ) : shippingOrder && (
                <LogisticsOrderModal 
                    sale={shippingOrder}
                    onSave={async (id, s, t, b) => {
                        await db.updateSale(id, { status: s, trackingCode: t, isBonus: b, statusUpdatedAt: new Date().toISOString() });
                        await fetchData();
                        setShippingOrder(null);
                    }}
                    onClose={() => setShippingOrder(null)}
                />
            )}
        </Modal>
        {/* Altri Modali qui... */}
      </Suspense>
    </div>
  );
}

export default App;
