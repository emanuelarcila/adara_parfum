import React, { useState } from 'react';
import { DateRange } from '../../types';
import { SALES_PERIOD_DATA, formatCOP } from '../../data/mockData';
import { Download, PieChart, Layers, CheckCircle2 } from 'lucide-react';

interface AdminReportsProps {
  selectedPeriod: DateRange;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ selectedPeriod }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const stats = SALES_PERIOD_DATA[selectedPeriod as keyof typeof SALES_PERIOD_DATA] || SALES_PERIOD_DATA.month;

  const handleExport = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--color-ivory)' }}>
            Informes Comerciales & Inteligencia de Ventas
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Desglose de márgenes, distribución por familias olfativas y efectividad de canales
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
            transition: 'all 0.25s ease'
          }}
        >
          {downloadSuccess ? <CheckCircle2 size={16} /> : <Download size={16} />}
          <span>{downloadSuccess ? '¡Informe Generado!' : 'Exportar Informe PDF / CSV'}</span>
        </button>
      </div>

      {/* Grid: Olfactive Family Breakdown + Channels Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="responsive-2col">
        {/* Family Revenue Breakdown */}
        <div className="liquid-glass-card" style={{ padding: '28px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Layers size={18} color="var(--color-gold)" />
            <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--color-ivory)' }}>
              Ingresos por Familia Olfativa
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { family: 'Oriental & Ámbar', percent: 46, amount: stats.totalCOP * 0.46, color: 'var(--color-gold)' },
              { family: 'Floral Oscuro', percent: 26, amount: stats.totalCOP * 0.26, color: 'var(--color-gold-deep)' },
              { family: 'Amaderada Noble', percent: 18, amount: stats.totalCOP * 0.18, color: '#a68345' },
              { family: 'Cuero & Humo', percent: 10, amount: stats.totalCOP * 0.10, color: 'var(--color-border)' }
            ].map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>{item.family}</span>
                  <span style={{ color: 'var(--color-gold)' }}>{formatCOP(Math.round(item.amount))} ({item.percent}%)</span>
                </div>
                <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(56, 48, 36, 0.4)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.percent}%`, backgroundColor: item.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Channel */}
        <div className="liquid-glass-card" style={{ padding: '28px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <PieChart size={18} color="var(--color-gold)" />
            <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--color-ivory)' }}>
              Distribución por Canal de Venta
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { channel: 'WhatsApp Concierge', percent: 48, share: 'Conversión directa y asesoría VIP' },
              { channel: 'Tienda Web ADARA', percent: 32, share: 'Catálogo online y compras directas' },
              { channel: 'Boutique Bogotá', percent: 14, share: 'Experiencia física en sala de cata' },
              { channel: 'Distribuidores Aliados', percent: 6, share: 'Concept stores autorizadas' }
            ].map((item, idx) => (
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
                  <div style={{ fontWeight: 600, color: 'var(--color-ivory)', fontSize: '13px' }}>{item.channel}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{item.share}</div>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-gold)' }}>{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
