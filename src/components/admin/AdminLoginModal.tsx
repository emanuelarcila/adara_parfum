import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('director@adara.co');
  const [password, setPassword] = useState('adara2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsLoading(false);
      if (email.trim() && password.trim()) {
        onLoginSuccess();
      } else {
        setErrorMessage('Por favor ingresa un correo y contraseña válidos.');
      }
    }, 600);
  };

  const handleQuickDemo = () => {
    setEmail('director@adara.co');
    setPassword('adara2026');
    onLoginSuccess();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'rgba(7, 7, 6, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
      onClick={onClose}
    >
      <div
        className="liquid-glass animate-rise"
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '8px',
          padding: '40px 36px',
          backgroundColor: 'rgba(23, 23, 20, 0.96)',
          border: '1px solid var(--color-border-gold)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(198, 161, 91, 0.12)',
              border: '1px solid var(--color-border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <ShieldCheck size={22} color="var(--color-gold)" />
          </div>

          <h2 style={{ fontSize: '26px', margin: '0 0 6px', color: 'var(--color-ivory)' }}>
            ADARA CONTROL
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Panel de Gestión Comercial & Operativa
          </p>

          <div
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(198, 161, 91, 0.15)',
              color: 'var(--color-gold)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em'
            }}
          >
            PROTOTIPO DEMO
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '4px',
              backgroundColor: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: 'var(--color-danger)',
              fontSize: '12px',
              marginBottom: '20px'
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Correo de Acceso
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(11, 11, 10, 0.8)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '10px 14px',
                gap: '10px'
              }}
            >
              <Mail size={16} color="var(--color-text-tertiary)" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@adara.co"
                required
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-ivory)',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Contraseña
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(11, 11, 10, 0.8)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '10px 14px',
                gap: '10px'
              }}
            >
              <Lock size={16} color="var(--color-text-tertiary)" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-ivory)',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', padding: 0 }}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '10px',
              padding: '14px',
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-obsidian)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s ease'
            }}
          >
            <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión'}</span>
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={handleQuickDemo}
            style={{
              padding: '12px',
              backgroundColor: 'rgba(198, 161, 91, 0.1)',
              border: '1px dashed var(--color-border-gold)',
              borderRadius: '4px',
              color: 'var(--color-gold)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} />
            <span>Acceso Inmediato de Demostración</span>
          </button>
        </form>
      </div>
    </div>
  );
};
