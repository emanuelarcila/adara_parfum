import React, { useState } from 'react';
import { DateRange, Order, Product } from '../../types';
import { SALES_PERIOD_DATA, MONTHLY_SALES_CHART, formatCOP } from '../../data/mockData';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { AdminTab } from './AdminLayout';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  selectedPeriod: DateRange;
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  selectedPeriod,
  onNavigateTab
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const periodStats =
    SALES_PERIOD_DATA[selectedPeriod as keyof typeof SALES_PERIOD_DATA] ||
    SALES_PERIOD_DATA.month;

  const lowStockProducts = products.filter((p) => p.stock <= (p.threshold ?? 3));

  // SVG Chart calculation helpers
  const chartHeight = 220;
  const chartWidth = 680;
  const maxSales = 40000000;

  const pointsCurrent = MONTHLY_SALES_CHART.map((d, i) => {
    const x = (i / (MONTHLY_SALES_CHART.length - 1)) * (chartWidth - 80) + 40;
    const y = chartHeight - (d.current / maxSales) * (chartHeight - 40) - 20;
    return { x, y, data: d };
  });

  const pointsPrevious = MONTHLY_SALES_CHART.map((d, i) => {
    const x = (i / (MONTHLY_SALES_CHART.length - 1)) * (chartWidth - 80) + 40;
    const y = chartHeight - (d.previous / maxSales) * (chartHeight - 40) - 20;
    return { x, y, data: d };
  });

  const pathCurrent = pointsCurrent.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );
  const pathPrevious = pointsPrevious.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Demo Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: '6px',
          backgroundColor: 'rgba(198, 161, 91, 0.08)',
          border: '1px solid rgba(198, 161, 91, 0.25)',
          fontSize: '12px',
          color: 'var(--color-gold)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} />
          <span>
            <strong>Modo Demostración Activo:</strong> Las métricas y órdenes reflejan datos de prueba para evaluación de experiencia administrativa.
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          Cifras en Pesos Colombianos (COP)
        </span>
      </div>

      {/* KPI Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Card 1: Ventas Confirmadas */}
        <div
          className="liquid-glass-card"
          style={{ padding: '22px', borderRadius: '6px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Ventas Confirmadas
            </span>
            <div style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(198, 161, 91, 0.12)', color: 'var(--color-gold)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--color-ivory)', marginBottom: '8px' }}>
            {formatCOP(periodStats.totalCOP)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{periodStats.comparison}</span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>vs período anterior</span>
          </div>
        </div>

        {/* Card 2: Pedidos Recibidos */}
        <div
          className="liquid-glass-card"
          style={{ padding: '22px', borderRadius: '6px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Pedidos Recibidos
            </span>
            <div style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(96, 165, 250, 0.12)', color: 'var(--color-info)' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--color-ivory)', marginBottom: '8px' }}>
            {periodStats.ordersCount} pedidos
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Ticket promedio: {formatCOP(Math.round(periodStats.totalCOP / periodStats.ordersCount))}
          </div>
        </div>

        {/* Card 3: Unidades Vendidas */}
        <div
          className="liquid-glass-card"
          style={{ padding: '22px', borderRadius: '6px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Frascos Despachados
            </span>
            <div style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(74, 222, 128, 0.12)', color: 'var(--color-success)' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--color-ivory)', marginBottom: '8px' }}>
            {periodStats.unitsSold} uds
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Extractos de 100 ml
          </div>
        </div>

        {/* Card 4: Alertas de Stock */}
        <div
          className="liquid-glass-card"
          style={{
            padding: '22px',
            borderRadius: '6px',
            border: lowStockProducts.length > 0 ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid var(--color-border)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Alerta de Stock
            </span>
            <div style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(251, 191, 36, 0.12)', color: 'var(--color-warning)' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: lowStockProducts.length > 0 ? 'var(--color-warning)' : 'var(--color-ivory)', marginBottom: '8px' }}>
            {lowStockProducts.length} referencias
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '11px',
              padding: 0,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Ver inventario crítico</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Middle Grid: Sales Performance Chart & Top Fragrances */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 1.8fr) minmax(280px, 1.2fr)',
          gap: '24px'
        }}
        className="dashboard-charts-grid"
      >
        {/* Sales Chart */}
        <div
          className="liquid-glass-card"
          style={{ padding: '28px', borderRadius: '6px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--color-ivory)' }}>
                Rendimiento de Ventas Mensuales
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                Comparativo histórico en COP (Millones)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-gold)' }} />
                <span style={{ color: 'var(--color-ivory)' }}>2026 (Actual)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-border)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>2025 (Anterior)</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', minWidth: '460px' }}
            >
              {/* Grid Lines */}
              {[0, 10, 20, 30, 40].map((val) => {
                const y = chartHeight - (val * 1000000 / maxSales) * (chartHeight - 40) - 20;
                return (
                  <g key={val}>
                    <line
                      x1="40"
                      y1={y}
                      x2={chartWidth - 20}
                      y2={y}
                      stroke="rgba(56, 48, 36, 0.35)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="32"
                      y={y + 4}
                      fill="var(--color-text-tertiary)"
                      fontSize="9"
                      textAnchor="end"
                    >
                      ${val}M
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient for current */}
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d={`${pathCurrent} L ${pointsCurrent[pointsCurrent.length - 1].x} ${chartHeight - 20} L ${pointsCurrent[0].x} ${chartHeight - 20} Z`}
                fill="url(#goldGradient)"
              />

              {/* Line Previous */}
              <path
                d={pathPrevious}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="2"
                strokeDasharray="3 3"
              />

              {/* Line Current */}
              <path
                d={pathCurrent}
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="2.5"
              />

              {/* Interactive Points */}
              {pointsCurrent.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredMonth === idx ? 6 : 4}
                    fill="var(--color-obsidian)"
                    stroke="var(--color-gold)"
                    strokeWidth={hoveredMonth === idx ? 3 : 2}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={() => setHoveredMonth(idx)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  />
                  {/* Month Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 4}
                    fill={hoveredMonth === idx ? 'var(--color-gold)' : 'var(--color-text-secondary)'}
                    fontSize="10"
                    textAnchor="middle"
                    fontWeight={hoveredMonth === idx ? 700 : 500}
                  >
                    {pt.data.month.split(' ')[0]}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Tooltip info when hovering month */}
          {hoveredMonth !== null && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 14px',
                borderRadius: '4px',
                backgroundColor: 'rgba(11, 11, 10, 0.8)',
                border: '1px solid var(--color-border-gold)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}
            >
              <span>{MONTHLY_SALES_CHART[hoveredMonth].month}</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                Actual: {formatCOP(MONTHLY_SALES_CHART[hoveredMonth].current)}
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Previo: {formatCOP(MONTHLY_SALES_CHART[hoveredMonth].previous)}
              </span>
            </div>
          )}
        </div>

        {/* Top Fragrances Progress */}
        <div
          className="liquid-glass-card"
          style={{ padding: '28px', borderRadius: '6px', display: 'flex', flexDirection: 'column' }}
        >
          <h3 style={{ fontSize: '18px', margin: '0 0 4px', color: 'var(--color-ivory)' }}>
            Fragancias Más Vendidas
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
            Participación sobre ingresos totales
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {[
              { name: 'Oud Royal', percent: 42, revenue: 14490000 },
              { name: 'Rose Noire', percent: 28, revenue: 9660000 },
              { name: 'Ambre Impérial', percent: 18, revenue: 6210000 },
              { name: 'Santal Blanc', percent: 12, revenue: 4140000 }
            ].map((frag, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>{frag.name}</span>
                  <span style={{ color: 'var(--color-gold)' }}>{formatCOP(frag.revenue)} ({frag.percent}%)</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    backgroundColor: 'rgba(56, 48, 36, 0.4)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${frag.percent}%`,
                      backgroundColor: idx === 0 ? 'var(--color-gold)' : idx === 1 ? 'var(--color-gold-deep)' : 'var(--color-border)',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders Snippet */}
      <div
        className="liquid-glass-card"
        style={{ padding: '28px', borderRadius: '6px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--color-ivory)' }}>
              Últimos Pedidos Registrados
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              Transacciones en vivo a través de la tienda web, WhatsApp y boutique
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Ver todos los pedidos</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Orders Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Referencia</th>
                <th style={{ padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Cliente</th>
                <th style={{ padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Canal</th>
                <th style={{ padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Productos</th>
                <th style={{ padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Total COP</th>
                <th style={{ padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 4).map((ord) => (
                <tr key={ord.id} style={{ borderBottom: '1px solid rgba(56, 48, 36, 0.4)' }}>
                  <td style={{ padding: '14px', fontFamily: 'monospace', color: 'var(--color-gold)', fontWeight: 600 }}>
                    {ord.reference}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>{ord.customerName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{ord.customerCity}</div>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--color-text-secondary)' }}>
                    {ord.channel}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--color-ivory)' }}>
                    {ord.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 600, color: 'var(--color-ivory)' }}>
                    {formatCOP(ord.totalCOP)}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        backgroundColor:
                          ord.orderStatus === 'delivered'
                            ? 'rgba(74, 222, 128, 0.15)'
                            : ord.orderStatus === 'shipped'
                            ? 'rgba(96, 165, 250, 0.15)'
                            : 'rgba(251, 191, 36, 0.15)',
                        color:
                          ord.orderStatus === 'delivered'
                            ? 'var(--color-success)'
                            : ord.orderStatus === 'shipped'
                            ? 'var(--color-info)'
                            : 'var(--color-warning)'
                      }}
                    >
                      {ord.orderStatus === 'delivered'
                        ? 'Entregado'
                        : ord.orderStatus === 'shipped'
                        ? 'En camino'
                        : 'Preparación'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
