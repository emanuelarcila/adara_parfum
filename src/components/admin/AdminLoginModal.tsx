import React, { useState, useEffect, useRef } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, X } from 'lucide-react';
import { loginWithEmail, formatAuthError, isUserAdmin, logoutUser } from '../../lib/firebase';

/**
 * Propiedades del modal de inicio de sesión administrativo.
 */
interface AdminLoginModalProps {
  /** Indica si el modal de autenticación está desplegado en pantalla. */
  isOpen: boolean;
  /** Disparador para cerrar el modal de login. */
  onClose: () => void;
  /** Callback ejecutado exitosamente cuando las credenciales y el rol de admin se verifican. */
  onLoginSuccess: () => void;
}

/**
 * Modal de autenticación y verificación de privilegios administrativos de ADARA PARFUM.
 *
 * @remarks
 * Permite iniciar sesión con correo y contraseña mediante Firebase Authentication.
 * Tras la autenticación, valida que el UID del usuario figure en la lista autorizada (`isUserAdmin`);
 * si no posee privilegios, revoca inmediatamente la sesión (`logoutUser`) y muestra un mensaje seguro.
 * Limpia la memoria de contraseñas tras el envío y gestiona foco accesible y bloqueo de scroll.
 *
 * @param props - Propiedades del componente {@link AdminLoginModalProps}.
 * @returns Elemento modal interactivo o `null` si `isOpen === false`.
 */
export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleModalClose = () => {
    if (isLoading) return;
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  // Keyboard accessibility (Escape) & background scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleModalClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const user = await loginWithEmail(trimmedEmail, password);
      // Limpiar contraseña de la memoria inmediatamente tras el acceso
      setPassword('');

      // Comprobación de autorización administrativa estricta mediante UID
      if (!isUserAdmin(user)) {
        await logoutUser();
        setErrorMessage('Esta cuenta no posee autorización administrativa en ADARA PARFUM.');
        return;
      }

      setEmail('');
      onLoginSuccess();
    } catch (err: unknown) {
      // Limpiar contraseña ante error
      setPassword('');
      const firebaseError = err as { code?: string };
      setErrorMessage(formatAuthError(firebaseError.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
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
        WebkitBackdropFilter: 'blur(20px)',
        pointerEvents: 'auto'
      }}
      onClick={handleModalClose}
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
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cierre visible y accesible */}
        <button
          type="button"
          onClick={handleModalClose}
          disabled={isLoading}
          data-cursor="CERRAR"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            background: 'rgba(11, 11, 10, 0.6)',
            border: '1px solid var(--color-border)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-ivory)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isLoading ? 0.4 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.borderColor = 'var(--color-gold)';
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
          aria-label="Cerrar ventana de inicio de sesión"
        >
          <X size={16} />
        </button>

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

          <h2
            id="admin-login-title"
            style={{ fontSize: '26px', margin: '0 0 6px', color: 'var(--color-ivory)', fontFamily: 'var(--font-display)' }}
          >
            ADARA CONTROL
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Panel de Gestión & Control Operativo
          </p>

          <div
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: 'rgba(198, 161, 91, 0.1)',
              border: '1px solid rgba(198, 161, 91, 0.25)',
              color: 'var(--color-gold)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em'
            }}
          >
            FIREBASE AUTHENTICATION
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: '4px',
              backgroundColor: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              color: 'var(--color-danger)',
              fontSize: '12px',
              lineHeight: 1.5,
              marginBottom: '20px'
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="admin-email-input"
              style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Correo Electrónico
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(11, 11, 10, 0.8)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '10px 14px',
                gap: '10px',
                cursor: 'text'
              }}
              onClick={() => emailInputRef.current?.focus()}
            >
              <Mail size={16} color="var(--color-text-tertiary)" style={{ pointerEvents: 'none' }} />
              <input
                ref={emailInputRef}
                id="admin-email-input"
                type="email"
                value={email}
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@adara.co"
                autoComplete="email"
                required
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-ivory)',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                  opacity: isLoading ? 0.6 : 1,
                  cursor: 'text'
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password-input"
              style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
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
                gap: '10px',
                cursor: 'text'
              }}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('button')) {
                  passwordInputRef.current?.focus();
                }
              }}
            >
              <Lock size={16} color="var(--color-text-tertiary)" style={{ pointerEvents: 'none' }} />
              <input
                ref={passwordInputRef}
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-ivory)',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                  opacity: isLoading ? 0.6 : 1,
                  cursor: 'text'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                data-cursor={showPassword ? 'OCULTAR' : 'VER'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  padding: 0,
                  cursor: 'pointer'
                }}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-cursor="ACCEDER"
            style={{
              marginTop: '10px',
              padding: '14px',
              backgroundColor: isLoading ? 'rgba(198, 161, 91, 0.5)' : 'var(--color-gold)',
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
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <span>Acceder al Panel</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
