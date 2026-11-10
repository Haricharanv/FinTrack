import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

// Adapted from ThemeOcean's 3D Animated Tilt & Dynamic Glow Card, retrieved
// through 21st.dev Magic MCP. Attribution and changes: docs/DESIGN_SOURCES.md.
export function MagicTiltCard({
  children,
  className = '',
  maxTilt = 3,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const motion = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, frame: 0 });
  const tick = useCallback(() => {
    const state = motion.current;
    if (!surface.current) {
      state.frame = 0;
      return;
    }
    state.x += (state.targetX - state.x) * 0.14;
    state.y += (state.targetY - state.y) * 0.14;
    surface.current.style.setProperty('--tilt-x', `${state.x.toFixed(3)}deg`);
    surface.current.style.setProperty('--tilt-y', `${state.y.toFixed(3)}deg`);
    const settled =
      Math.abs(state.targetX - state.x) < 0.01 && Math.abs(state.targetY - state.y) < 0.01;
    state.frame = settled ? 0 : requestAnimationFrame(tick);
  }, []);
  const animate = () => {
    if (!motion.current.frame) motion.current.frame = requestAnimationFrame(tick);
  };
  useEffect(() => {
    const state = motion.current;
    if (reduced) {
      cancelAnimationFrame(state.frame);
      state.frame = state.x = state.y = state.targetX = state.targetY = 0;
      surface.current?.style.setProperty('--tilt-x', '0deg');
      surface.current?.style.setProperty('--tilt-y', '0deg');
    }
    return () => cancelAnimationFrame(state.frame);
  }, [reduced]);
  const aim = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || reduced) return;
    const rect = wrapper.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    motion.current.targetX = -(y / rect.height - 0.5) * 2 * maxTilt;
    motion.current.targetY = (x / rect.width - 0.5) * 2 * maxTilt;
    surface.current?.style.setProperty('--glow-x', `${x}px`);
    surface.current?.style.setProperty('--glow-y', `${y}px`);
    animate();
  };
  const reset = () => {
    motion.current.targetX = motion.current.targetY = 0;
    if (!reduced) animate();
  };
  return (
    <div
      ref={wrapper}
      className={`magic-card ${className}`}
      onPointerMove={aim}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      <div ref={surface} className="magic-card-surface">
        <span className="magic-card-glow" aria-hidden="true" />
        <div className="magic-card-content">{children}</div>
      </div>
    </div>
  );
}
