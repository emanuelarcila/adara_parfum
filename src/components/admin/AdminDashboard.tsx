import React, { useState } from 'react';
import { DateRange, Order, Product } from '../../types';
import { formatCOP } from '../../data/mockData';
import { calculateDashboardMetrics } from '../../services/commercialAnalyticsService';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { AdminTab } from './AdminLayout';

/**
 * Propiedades recibidas por el panel de métricas y resumen gerencial.
 */
interface AdminDashboardProps {
  /** Lista total de pedidos del sistema. */
  orders: Order[];
  /** Catálogo de productos para monitoreo de stock bajo. */
  products: Product[];
  /** Periodo temporal activo para el cálculo de estadísticas. */
  selectedPeriod: DateRange;
  /** Disparador para redirigir la navegación hacia otra pestaña del panel. */
  onNavigateTab: (tab: AdminTab) => void;
}

/**
 * Tablero de control ejecutivo y operacional de ADARA PARFUM.
 *
 * @remarks
 * Sintetiza los indicadores clave de desempeño (KPIs): ventas confirmadas en COP,
 * pedidos recibidos desglosados (web, boutique, cancelados), unidades vendidas vs despachadas,
 * ticket promedio, comparativa porcentual frente al periodo anterior, gráfico SVG interactivo
 * de tendencia mensual, ranking de fragancias más vendidas y alertas críticas de existencias bajas.
 *
 * @param props - Propiedades del componente {@link AdminDashboardProps}.
 * @returns Elemento JSX que renderiza el panel de mando.
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  selectedPeriod,
  onNavigateTab
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Métricas dinámicas calculadas en tiempo real para el periodo seleccionado
  const metrics = calculateDashboardMetrics(orders, selectedPeriod);
  const lowStockProducts = products.filter((p) => p.stock <= (p.threshold ?? 3));

  // Preparación de datos de tendencia mensual dinámica
  const chartHeight = 220;
  const chartWidth = 680;
  const monthlyData = metrics.monthlyTrend;

  const maxCurrent = Math.max(0, ...monthlyData.map((d) => d.current));
  const maxPrevious = Math.max(0, ...monthlyData.map((d) => d.previous));
  const dataMax = Math.max(maxCurrent, maxPrevious);
  const maxSales = Math.max(40000000, Math.ceil(dataMax / 10000000) * 10000000);

  const pointsCurrent = monthlyData.map((d, i) => {
    const x = (i / (monthlyData.length - 1)) * (chartWidth - 80) + 40;
    const y = chartHeight - (d.current / maxSales) * (chartHeight - 40) - 20;
    return { x, y, data: d };
  });

  const pointsPrevious = monthlyData.map((d, i) => {
    const x = (i / (monthlyData.length - 1)) * (chartWidth - 80) + 40;
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
      {/* Top Status Banner */}
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
          <ShieldCheck size={16} />
          <span>
            <strong>Panel Operativo ADARA:</strong> Métricas en tiempo real calculadas según los pedidos registrados y el periodo {metrics.interval.label}.
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
            {formatCOP(metrics.confirmedSales.totalCOP)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <span
              style={{
                color: metrics.comparison.isPositive ? 'var(--color-success)' : 'var(--color-danger)',
                fontWeight: 700
              }}
            >
              {metrics.comparison.comparisonLabel}
            </span>
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
            {metrics.ordersReceived.total} {metrics.ordersReceived.total === 1 ? 'pedido' : 'pedidos'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Ticket promedio: {formatCOP(metrics.averageTicketCOP)}
            {metrics.ordersReceived.cancelled > 0 && (
              <span style={{ color: 'var(--color-danger)', marginLeft: '6px' }}>
                ({metrics.ordersReceived.cancelled} cancelado{metrics.ordersReceived.cancelled > 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Frascos Despachados */}
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
            {metrics.units.dispatched} uds
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            {metrics.units.sold} vendidos ({metrics.units.inPreparation} en preparación)
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
              gap: '4px',
              cursor: 'pointer'
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
                <span style={{ color: 'var(--color-ivory)' }}>Actual</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-border)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>Año Previo</span>
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
          {hoveredMonth !== null && monthlyData[hoveredMonth] && (
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
              <span>{monthlyData[hoveredMonth].month}</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                Actual: {formatCOP(monthlyData[hoveredMonth].current)} ({monthlyData[hoveredMonth].unitsSold} uds)
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Previo: {formatCOP(monthlyData[hoveredMonth].previous)}
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
            Participación sobre ingresos en {metrics.interval.label}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {metrics.topFragrances.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 16px',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                No se registran ventas de fragancias para este periodo.
              </div>
            ) : (
              metrics.topFragrances.map((frag, idx) => (
                <div key={frag.productId || idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>
                      {frag.productName} ({frag.unitsSold} {frag.unitsSold === 1 ? 'ud' : 'uds'})
                    </span>
                    <span style={{ color: 'var(--color-gold)' }}>
                      {formatCOP(frag.revenueCOP)} ({frag.percentOfRevenue}%)
                    </span>
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
                        width: `${Math.min(100, Math.max(2, frag.percentOfRevenue))}%`,
                        backgroundColor:
                          idx === 0
                            ? 'var(--color-gold)'
                            : idx === 1
                            ? 'var(--color-gold-deep)'
                            : 'var(--color-border)',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
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
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '32px 14px',
                      textAlign: 'center',
                      color: 'var(--color-text-tertiary)',
                      fontSize: '12px'
                    }}
                  >
                    No se encuentran pedidos registrados en el sistema.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 4).map((ord) => {
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case 'delivered':
                        return { label: 'Entregado', bg: 'rgba(74, 222, 128, 0.15)', color: 'var(--color-success)' };
                      case 'shipped':
                        return { label: 'En camino', bg: 'rgba(96, 165, 250, 0.15)', color: 'var(--color-info)' };
                      case 'preparing':
                        return { label: 'Preparación', bg: 'rgba(251, 191, 36, 0.15)', color: 'var(--color-warning)' };
                      case 'cancelled':
                        return { label: 'Cancelado', bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)' };
                      default:
                        return { label: 'Pendiente', bg: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold)' };
                    }
                  };
                  const badge = getStatusBadge(ord.orderStatus);

                  return (
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
                            backgroundColor: badge.bg,
                            color: badge.color
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
