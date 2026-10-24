import React, { useState } from 'react';
import { DateRange, Order, Product, SalesChannel } from '../../types';
import { formatCOP } from '../../data/mockData';
import {
  calculateDashboardMetrics,
  calculateRevenueByOlfactiveFamily,
  filterOrdersByPeriod
} from '../../services/commercialAnalyticsService';
import { Download, PieChart, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Datos de demostración históricos conservados en el código como referencia arquitectónica.
 * No se mezclan con las estadísticas dinámicas reales calculadas a partir de `orders`.
 */
export const DEMO_FAMILY_REVENUE_BREAKDOWN = [
  { family: 'Oriental & Ámbar', percent: 46, ratio: 0.46, color: 'var(--color-gold)' },
  { family: 'Floral Oscuro', percent: 26, ratio: 0.26, color: 'var(--color-gold-deep)' },
  { family: 'Amaderada Noble', percent: 18, ratio: 0.18, color: '#a68345' },
  { family: 'Cuero & Humo', percent: 10, ratio: 0.10, color: 'var(--color-border)' }
];

export const DEMO_CHANNEL_BREAKDOWN = [
  { channel: 'WhatsApp Concierge', percent: 48, share: 'Conversión directa y asesoría VIP' },
  { channel: 'Tienda Web ADARA', percent: 32, share: 'Catálogo online y compras directas' },
  { channel: 'Boutique Bogotá', percent: 14, share: 'Experiencia física en sala de cata' },
  { channel: 'Distribuidores Aliados', percent: 6, share: 'Concept stores autorizadas' }
];

/**
 * Propiedades del módulo de informes comerciales y exportación de datos.
 */
interface AdminReportsProps {
  /** Periodo temporal activo para la agregación de ventas y órdenes. */
  selectedPeriod: DateRange;
  /** Lista total de órdenes históricas para filtrar y generar métricas. */
  orders?: Order[];
  /** Catálogo de productos para asociar familias olfativas a las líneas vendidas. */
  products?: Product[];
}

const CHANNELS_CONFIG: {
  channelKey: SalesChannel;
  displayName: string;
  description: string;
}[] = [
  {
    channelKey: 'WhatsApp',
    displayName: 'WhatsApp Concierge',
    description: 'Conversión directa y asesoría VIP'
  },
  {
    channelKey: 'Tienda Web',
    displayName: 'Tienda Web ADARA',
    description: 'Catálogo online y compras directas'
  },
  {
    channelKey: 'Boutique Bogotá',
    displayName: 'Boutique Bogotá',
    description: 'Experiencia física en sala de cata'
  },
  {
    channelKey: 'Distribuidor',
    displayName: 'Distribuidores Aliados',
    description: 'Concept stores autorizadas'
  }
];

/**
 * Módulo de reportes comerciales, distribución de ventas y exportación de datos contables.
 *
 * @remarks
 * Procesa en tiempo real el desglose porcentual de ingresos por familia olfativa y canal de comercialización,
 * y permite descargar informes tabulares en formato CSV codificados con UTF-8 BOM (`\uFEFF`) para
 * garantizar apertura impecable de caracteres con acentos en Microsoft Excel en español.
 *
 * @param props - Propiedades del componente {@link AdminReportsProps}.
 * @returns Elemento JSX con la vista analítica de reportes comerciales.
 */
export const AdminReports: React.FC<AdminReportsProps> = ({
  selectedPeriod,
  orders = [],
  products = []
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Cálculos dinámicos fiables basados en las órdenes reales y el periodo seleccionado
  const metrics = calculateDashboardMetrics(orders, selectedPeriod);
  const periodOrders = filterOrdersByPeriod(orders, selectedPeriod);
  const familyRevenue = calculateRevenueByOlfactiveFamily(periodOrders, products);
  const { channelMetrics } = metrics;

  const handleExport = () => {
    if (periodOrders.length === 0) {
      alert('No se encontraron pedidos registrados en el periodo seleccionado para exportar.');
      return;
    }

    // Generar archivo CSV en memoria con codificación UTF-8 BOM para compatibilidad con Excel
    const headers = [
      'Referencia',
      'Fecha',
      'Canal',
      'Cliente',
      'Ciudad',
      'Telefono',
      'Total COP',
      'Estado Pago',
      'Estado Logistico',
      'Articulos'
    ];

    const rows = periodOrders.map((ord) => [
      `"${ord.reference || ord.id}"`,
      `"${ord.date}"`,
      `"${ord.channel}"`,
      `"${ord.customerName}"`,
      `"${ord.customerCity || ''}"`,
      `"${ord.customerPhone || ''}"`,
      ord.totalCOP || 0,
      `"${ord.paymentStatus}"`,
      `"${ord.orderStatus}"`,
      `"${(ord.items || [])
        .map((i) => `${i.productName} (x${i.quantity})`)
        .join('; ')}"`
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `adara-informe-ventas-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--color-ivory)' }}>
            Informes Comerciales & Inteligencia de Ventas
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Desglose de ventas confirmadas por familias olfativas y efectividad de canales ({metrics.interval.label})
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '4px',
            backgroundColor: downloadSuccess ? 'var(--color-success)' : 'var(--color-gold)',
            color: 'var(--color-obsidian)',
            border: 'none',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'all 0.25s ease',
            cursor: 'pointer'
          }}
        >
          {downloadSuccess ? <CheckCircle2 size={16} /> : <Download size={16} />}
          <span>{downloadSuccess ? '¡CSV Exportado!' : 'Exportar Pedidos CSV'}</span>
        </button>
      </div>

      {/* Nota de Auditoría sobre métricas no modeladas (Márgenes de ganancia / COGS) */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '4px',
          backgroundColor: 'rgba(212, 175, 55, 0.05)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          fontSize: '12px',
          color: 'var(--color-ivory)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          lineHeight: 1.5
        }}
      >
        <AlertCircle size={16} color="var(--color-gold)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--color-gold)' }}>Transparencia Comercial:</strong>{' '}
          Los datos mostrados a continuación corresponden a las ventas brutas confirmadas de los pedidos reales.
          El cálculo de márgenes netos de utilidad requerirá agregar el costo unitario de adquisición (COGS) en el modelo de productos en fases posteriores.
        </div>
      </div>

      {/* Grid: Olfactive Family Breakdown + Channels Breakdown */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}
        className="responsive-2col"
      >
        {/* Family Revenue Breakdown */}
        <div className="liquid-glass-card" style={{ padding: '28px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-gold)" />
              <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--color-ivory)' }}>
                Ingresos por Familia Olfativa
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {formatCOP(metrics.confirmedSales.totalCOP)}
            </span>
          </div>

          {familyRevenue.length === 0 ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: 'var(--color-text-tertiary)',
                fontSize: '12px'
              }}
            >
              No se registraron ventas confirmadas en familias olfativas para este periodo.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {familyRevenue.map((item, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '6px'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>
                      {item.family}{' '}
                      <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)' }}>
                        ({item.unitsSold} {item.unitsSold === 1 ? 'unidad' : 'unidades'})
                      </span>
                    </span>
                    <span style={{ color: 'var(--color-gold)' }}>
                      {formatCOP(Math.round(item.revenueCOP))} ({item.percent}%)
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
                        width: `${item.percent}%`,
                        backgroundColor: item.color,
                        borderRadius: '3px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales by Channel */}
        <div className="liquid-glass-card" style={{ padding: '28px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} color="var(--color-gold)" />
              <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--color-ivory)' }}>
                Distribución por Canal de Venta
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {channelMetrics.totalReceived} {channelMetrics.totalReceived === 1 ? 'pedido recibido' : 'pedidos recibidos'}
            </span>
          </div>

          {channelMetrics.totalReceived === 0 ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: 'var(--color-text-tertiary)',
                fontSize: '12px'
              }}
            >
              No se registraron pedidos en ningún canal para este periodo.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {CHANNELS_CONFIG.map((cfg, idx) => {
                const chData = channelMetrics.byChannel[cfg.channelKey] || {
                  ordersCount: 0,
                  confirmedSalesCount: 0,
                  revenueCOP: 0
                };

                const revenueShare =
                  metrics.confirmedSales.totalCOP > 0
                    ? Math.round((chData.revenueCOP / metrics.confirmedSales.totalCOP) * 100)
                    : 0;

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(11, 11, 10, 0.6)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-ivory)', fontSize: '13px' }}>
                        {cfg.displayName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                        {chData.ordersCount} pedidos ({formatCOP(chData.revenueCOP)})
                      </div>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-gold)' }}>
                      {revenueShare}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
