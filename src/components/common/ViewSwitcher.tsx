import { Store, ShieldCheck } from 'lucide-react';

interface ViewSwitcherProps {
  currentView: 'store' | 'admin';
  onSwitch: (view: 'store' | 'admin') => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onSwitch }) => {
  return (
    <aside
      aria-label="Selector de interfaces"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9000
      }}
    >
      <div
        className="liquid-glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          borderRadius: '9999px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(198, 161, 91, 0.3)'
        }}
      >
        <button
          type="button"
          onClick={() => onSwitch('store')}
          data-cursor="TIENDA"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            backgroundColor: currentView === 'store' ? 'var(--color-gold)' : 'transparent',
            color: currentView === 'store' ? 'var(--color-obsidian)' : 'var(--color-text-secondary)'
          }}
        >
          <Store size={14} />
          <span>Tienda Pública</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitch('admin')}
          data-cursor="PANEL"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            backgroundColor: currentView === 'admin' ? 'var(--color-gold)' : 'transparent',
            color: currentView === 'admin' ? 'var(--color-obsidian)' : 'var(--color-text-secondary)'
          }}
        >
          <ShieldCheck size={14} />
          <span>Panel Control</span>
          <span
            style={{
              fontSize: '8px',
              padding: '2px 5px',
              borderRadius: '4px',
              backgroundColor: currentView === 'admin' ? 'rgba(11, 11, 10, 0.2)' : 'rgba(198, 161, 91, 0.2)',
              color: currentView === 'admin' ? 'var(--color-obsidian)' : 'var(--color-gold)',
              fontWeight: 700
            }}
          >
            DEMO
          </span>
        </button>
      </div>
    </aside>
  );
};
