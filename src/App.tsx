import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order, DateRange, OrderStatus, PaymentStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from './data/mockData';

// Common Components
import { CustomCursor } from './components/common/CustomCursor';
import { ViewSwitcher } from './components/common/ViewSwitcher';
import { Toast, ToastMessage } from './components/common/Toast';

// Store Components
import { StoreNavbar } from './components/store/StoreNavbar';
import { StoreHero } from './components/store/StoreHero';
import { StoreEditorial } from './components/store/StoreEditorial';
import { StoreCollection } from './components/store/StoreCollection';
import { ProductDetailModal } from './components/store/ProductDetailModal';
import { CartDrawer } from './components/store/CartDrawer';
import { StoreFooter } from './components/store/StoreFooter';

// Admin Components (Loaded on-demand with React.lazy for bundle optimization)
import type { AdminTab } from './components/admin/AdminLayout';
import { AdminLoginModal } from './components/admin/AdminLoginModal';

const AdminLayout = React.lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminDashboard = React.lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminProducts = React.lazy(() =>
  import('./components/admin/AdminProducts').then((m) => ({ default: m.AdminProducts }))
);
const AdminOrders = React.lazy(() =>
  import('./components/admin/AdminOrders').then((m) => ({ default: m.AdminOrders }))
);
const AdminManualSale = React.lazy(() =>
  import('./components/admin/AdminManualSale').then((m) => ({ default: m.AdminManualSale }))
);
const AdminInventory = React.lazy(() =>
  import('./components/admin/AdminInventory').then((m) => ({ default: m.AdminInventory }))
);
const AdminReports = React.lazy(() =>
  import('./components/admin/AdminReports').then((m) => ({ default: m.AdminReports }))
);

// Firebase Auth Service & Authorization
import { subscribeToAuth, logoutUser, isUserAdmin, type User } from './lib/firebase';

export const App: React.FC = () => {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<DateRange>('month');

  // Firebase Authentication state for Admin
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Data state
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('adara_products_v2');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('adara_orders_v2');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('adara_cart_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist Data Changes
  useEffect(() => {
    localStorage.setItem('adara_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('adara_orders_v2', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('adara_cart_v2', JSON.stringify(cart));
  }, [cart]);

  // Observe Firebase Authentication session changes with strict UID authorization
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        if (isUserAdmin(user)) {
          setCurrentUser(user);
          setIsAdminLoggedIn(true);
        } else {
          // Usuario autenticado pero NO autorizado en la lista de UIDs permitidos
          setCurrentUser(null);
          setIsAdminLoggedIn(false);
          logoutUser().catch(() => {});
          showToast('warning', 'Acceso Denegado', 'Esta cuenta no posee autorización administrativa.');
          if (currentView === 'admin') {
            setCurrentView('store');
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdminLoggedIn(false);
        if (currentView === 'admin') {
          setCurrentView('store');
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [currentView]);

  // Toast Helper
  const showToast = (type: 'success' | 'warning' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast('success', 'Añadido a tu bolsa', `${product.name} (x${quantity}) agregado a la selección.`);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('info', 'Fragancia eliminada de la bolsa');
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Admin Switcher Handler (Protected against unauthenticated and unauthorized access)
  const handleSwitchView = (view: 'store' | 'admin') => {
    if (view === 'admin') {
      if (!currentUser || !isUserAdmin(currentUser)) {
        setIsLoginModalOpen(true);
        return;
      }
    }
    setCurrentView(view);
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setCurrentView('admin');
    showToast('success', 'Sesión autenticada', 'Acceso concedido al panel de control ADARA.');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setIsAdminLoggedIn(false);
      setCurrentView('store');
      showToast('info', 'Sesión finalizada', 'Has cerrado la sesión administrativa de forma segura.');
    } catch {
      showToast('warning', 'Error al cerrar sesión', 'No fue posible completar el cierre de sesión.');
    }
  };

  // Product CRUD Handlers
  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === updatedProduct.id);
      if (exists) {
        return prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      }
      return [updatedProduct, ...prev];
    });
    showToast('success', 'Catálogo actualizado', `${updatedProduct.name} guardado correctamente.`);
  };

  const handleToggleProductStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === 'active' ? 'paused' : 'active';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
    showToast('info', 'Estado modificado');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('warning', 'Fragancia eliminada del catálogo');
  };

  // Stock Adjustment Handler
  const handleAdjustStock = (productId: string, delta: number, reason: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + delta);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    showToast('success', 'Inventario actualizado', `Movimiento registrado: ${reason}`);
  };

  // Order Handlers
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, orderStatus: status } : ord))
    );
    showToast('success', 'Estado de orden actualizado');
  };

  const handleUpdatePaymentStatus = (orderId: string, status: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, paymentStatus: status } : ord))
    );
    showToast('success', 'Estado de pago actualizado');
  };

  // Manual Sale Completion Handler
  const handleCompleteManualSale = (newOrder: Order) => {
    // 1. Add order
    setOrders((prev) => [newOrder, ...prev]);

    // 2. Decrement inventory
    setProducts((prev) =>
      prev.map((prod) => {
        const itemSold = newOrder.items.find((i) => i.productId === prod.id);
        if (itemSold) {
          return { ...prod, stock: Math.max(0, prod.stock - itemSold.quantity) };
        }
        return prod;
      })
    );

    showToast(
      'success',
      'Venta Manual Confirmada',
      `Orden ${newOrder.reference} registrada para ${newOrder.customerName}.`
    );
  };

  return (
    <div className="adara-app-container" style={{ minHeight: '100vh', backgroundColor: 'var(--color-obsidian)' }}>
      {/* Custom Luxury Interactive Cursor */}
      <CustomCursor />

      {/* Floating Interface Switcher */}
      <ViewSwitcher currentView={currentView} onSwitch={handleSwitchView} />

      {/* Toast Feedback */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Admin Login Gate Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Render Public Store or Admin Dashboard (Secured: requires authorized admin) */}
      {currentView === 'store' || !currentUser || !isUserAdmin(currentUser) ? (
        <main>
          {/* Public Store Navbar */}
          <StoreNavbar
            cartCount={cart.reduce((acc, it) => acc + it.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onSearchChange={setSearchQuery}
            searchQuery={searchQuery}
          />

          {/* Hero Section */}
          <StoreHero />

          {/* Editorial Universe Section */}
          <StoreEditorial />

          {/* Collection Section */}
          <StoreCollection
            products={products.filter((p) => p.status !== 'paused')}
            searchQuery={searchQuery}
            onSelectProduct={setSelectedProduct}
            onAddToCart={(product) => handleAddToCart(product, 1)}
          />

          {/* Footer */}
          <StoreFooter onOpenAdmin={() => handleSwitchView('admin')} />

          {/* Product Detail Modal */}
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />

          {/* Cart Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
          />
        </main>
      ) : (
        /* Admin Control Room (Secured: requires authenticated & authorized currentUser) */
        <React.Suspense
          fallback={
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#090908',
                color: 'var(--color-ivory)',
                gap: '16px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid rgba(198, 161, 91, 0.2)',
                  borderTopColor: 'var(--color-gold)',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--color-gold)'
                }}
              >
                Cargando ADARA Control...
              </span>
            </div>
          }
        >
          <AdminLayout
            currentTab={adminTab}
            onTabChange={setAdminTab}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            onSwitchToStore={() => setCurrentView('store')}
            onLogout={handleLogout}
            adminEmail={currentUser?.email}
          >
            {adminTab === 'dashboard' && (
              <AdminDashboard
                orders={orders}
                products={products}
                selectedPeriod={selectedPeriod}
                onNavigateTab={setAdminTab}
              />
            )}

            {adminTab === 'products' && (
              <AdminProducts
                products={products}
                onSaveProduct={handleSaveProduct}
                onToggleStatus={handleToggleProductStatus}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {adminTab === 'orders' && (
              <AdminOrders
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
              />
            )}

            {adminTab === 'manual-sale' && (
              <AdminManualSale
                products={products.filter((p) => p.status === 'active')}
                onCompleteSale={handleCompleteManualSale}
              />
            )}

            {adminTab === 'inventory' && (
              <AdminInventory
                products={products}
                onAdjustStock={handleAdjustStock}
              />
            )}

            {adminTab === 'reports' && (
              <AdminReports selectedPeriod={selectedPeriod} />
            )}
          </AdminLayout>
        </React.Suspense>
      )}
    </div>
  );
};
