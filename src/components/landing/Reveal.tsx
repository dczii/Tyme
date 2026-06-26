'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useIntro } from './IntroContext';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger offset in seconds (applied after intro finishes). */
  delay?: number;
  as?: 'div' | 'section' | 'header' | 'footer' | 'li';
}

export default function Reveal({ children, className, delay = 0, as = 'div' }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const { introDone } = useIntro();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const MotionTag = motion[as] as React.ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: '-12% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (shouldReduceMotion) {
    return <MotionTag ref={ref} className={className}>{children}</MotionTag>;
  }

  const shouldAnimate = inView && introDone;

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={{ opacity: 0, transform: 'translateY(16px)' }}
      animate={
        shouldAnimate
          ? { opacity: 1, transform: 'translateY(0px)' }
          : { opacity: 0, transform: 'translateY(16px)' }
      }
      transition={{ duration: 0.5, delay: shouldAnimate ? delay : 0, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
