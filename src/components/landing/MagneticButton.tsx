'use client';

import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  /** How strongly the wrapper leans toward the cursor (0-1 of the offset). */
  strength?: number;
}

/**
 * Magnetic hover wrapper for primary CTAs. While the cursor moves across the
 * wrapper, the whole button leans toward it (gsap.quickTo, transform-only) and
 * springs back on leave — a physical "this is the thing to press" affordance
 * that draws the eye to the one conversion action without adding any visual
 * weight. Desktop-pointer only: touch devices and prefers-reduced-motion get a
 * completely inert wrapper (the button's own :hover/:active states remain).
 */
export default function MagneticButton({
  children,
  className = '',
  strength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (reduce || !el) return;
    // Magnetism only makes sense for a real hovering pointer.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [reduce, strength]);

  return (
    <div ref={ref} className={`inline-flex will-change-transform ${className}`}>
      {children}
    </div>
  );
}
