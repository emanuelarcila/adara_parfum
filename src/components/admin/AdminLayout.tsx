import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  PlusCircle,
  Warehouse,
  BarChart3,
  Store,
  Bell,
  Calendar,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { DateRange, Product, Order } from '../../types';
import { AdminNotificationsCenter } from './AdminNotificationsCenter';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'manual-sale'
  | 'inventory'
  | 'reports';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  selectedPeriod: DateRange;
  onPeriodChange: (period: DateRange) => void;
  onSwitchToStore: () => void;
  onLogout?: () => void;
  adminEmail?: string | null;
  products?: Product[];
  orders?: Order[];
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  selectedPeriod,
  onPeriodChange,
  onSwitchToStore,
  onLogout,
  adminEmail,
  products,
  orders,
  children
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Vista General', icon: LayoutDashboard },
    { id: 'products', label: 'Catálogo & Precios', icon: Package },
    { id: 'orders', label: 'Gestión de Pedidos', icon: ShoppingBag },
    { id: 'manual-sale', label: 'Registrar Venta Manual', icon: PlusCircle, highlight: true },
    { id: 'inventory', label: 'Inventario & Stock', icon: Warehouse },
    { id: 'reports', label: 'Informes Comerciales', icon: BarChart3 }
  ];

  const periodOptions: { id: DateRange; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mes' },
    { id: 'quarter', label: 'Trimestre' },
    { id: 'year', label: 'Año 2026' }
  ];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#090908',
        color: 'var(--color-ivory)'
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0e0e0c',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40
        }}
      >
        {/* Sidebar Brand Header */}
        <div
          style={{
            padding: '28px 24px',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(198, 161, 91, 0.15)',
                border: '1px solid var(--color-border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold)',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              A
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  color: 'var(--color-ivory)',
                  lineHeight: 1
                }}
              >
                ADARA
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '8px',
                  letterSpacing: '0.3em',
                  color: 'var(--color-gold)',
                  textTransform: 'uppercase',
                  marginTop: '2px'
                }}
              >
                CONTROL ROOM
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
          aria-label="Menú administrativo"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id as AdminTab)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: active
                    ? '1px solid rgba(198, 161, 91, 0.4)'
                    : item.highlight
                    ? '1px dashed rgba(198, 161, 91, 0.3)'
                    : '1px solid transparent',
                  backgroundColor: active
                    ? 'rgba(198, 161, 91, 0.14)'
                    : item.highlight
                    ? 'rgba(198, 161, 91, 0.05)'
                    : 'transparent',
                  color: active
                    ? 'var(--color-gold)'
                    : item.highlight
                    ? 'var(--color-gold-light)'
                    : 'var(--color-text-secondary)',
                  fontSize: '12px',
                  fontWeight: active || item.highlight ? 600 : 500,
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = 'var(--color-ivory)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = item.highlight
                      ? 'rgba(198, 161, 91, 0.05)'
                      : 'transparent';
                    e.currentTarget.style.color = item.highlight
                      ? 'var(--color-gold-light)'
                      : 'var(--color-text-secondary)';
                  }
                }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.highlight && (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(198, 161, 91, 0.2)',
                      color: 'var(--color-gold)'
                    }}
                  >
                    NUEVA
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions: Switcher & User */}
        <div
          style={{
            padding: '20px 16px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onSwitchToStore}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-ivory)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <Store size={14} color="var(--color-gold)" />
            <span>Ir a Tienda Pública</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(17, 17, 15, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gold-deep)',
                color: 'var(--color-obsidian)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {adminEmail ? adminEmail.slice(0, 2).toUpperCase() : 'EA'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  margin: 0,
                  color: 'var(--color-ivory)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={adminEmail || 'Emanuel Arcila'}
              >
                {adminEmail || 'Emanuel Arcila'}
              </p>
              <span style={{ fontSize: '9px', color: 'var(--color-gold)', letterSpacing: '0.04em', display: 'block' }}>
                ADMIN AUTENTICADO
              </span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Cerrar sesión de Firebase"
                aria-label="Cerrar sesión"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-danger)';
                  e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Administrative Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '70px',
            backgroundColor: '#0c0c0a',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}
        >
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-tertiary)' }}>ADARA Admin</span>
            <ChevronRight size={14} color="var(--color-text-tertiary)" />
            <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
              {menuItems.find((i) => i.id === currentTab)?.label}
            </span>
          </div>

          {/* Right Controls: Period Selector & Quick Sale Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Period Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(23, 23, 20, 0.8)',
                padding: '4px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)'
              }}
            >
              <Calendar size={14} color="var(--color-gold)" style={{ margin: '0 6px' }} />
              {periodOptions.map((opt) => {
                const isSelected = selectedPeriod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onPeriodChange(opt.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--color-gold)' : 'transparent',
                      color: isSelected ? 'var(--color-obsidian)' : 'var(--color-text-secondary)',
                      fontSize: '11px',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Notification Center */}
            <AdminNotificationsCenter
              products={products || []}
              orders={orders || []}
              onNavigateTab={onTabChange}
            />

            {/* Fast Sale CTA */}
            {currentTab !== 'manual-sale' && (
              <button
                type="button"
                onClick={() => onTabChange('manual-sale')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-gold)',
                  color: 'var(--color-obsidian)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                <PlusCircle size={14} />
                <span>Registrar Venta</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Body */}
        <main style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
