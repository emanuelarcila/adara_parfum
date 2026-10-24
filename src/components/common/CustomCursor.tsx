/**
 * ADARA PARFUM — Cursor Personalizado de Lujo
 *
 * Implementa una experiencia de puntero fluido con efecto de seguimiento elástico (Lerp)
 * y detección de elementos interactivos (`button`, `a`, `[data-cursor]`).
 * Se desactiva automáticamente en pantallas táctiles (`pointer: coarse`).
 */

import React, { useEffect, useState } from 'react';

/**
 * Componente de cursor interactivo con micro-animaciones en tiempo real.
 */
export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo activar si el dispositivo dispone de puntero de precisión (mouse / touchpad)
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setPos({ x: targetX, y: targetY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, select, [data-cursor], .interactive');
        if (interactive) {
          setIsHovering(true);
          const customLabel = interactive.getAttribute('data-cursor');
          setCursorText(customLabel || '');
        } else {
          setIsHovering(false);
          setCursorText('');
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    // Interpolación lineal suave (Lerp) para el anillo exterior
    const render = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      setRingPos({ x: currentX, y: currentY });
      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <div
        className="custom-cursor-dot"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`
        }}
      />
      <div
        className={`custom-cursor-ring ${isHovering ? 'is-hovering' : ''}`}
        style={{
          transform: `translate3d(${ringPos.x - (isHovering ? 29 : 17)}px, ${ringPos.y - (isHovering ? 29 : 17)}px, 0)`
        }}
      >
        {cursorText && <span className="custom-cursor-label">{cursorText}</span>}
      </div>
    </>
  );
};

