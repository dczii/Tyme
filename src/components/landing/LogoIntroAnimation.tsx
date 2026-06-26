'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import { useIntro } from './IntroContext';

const LOGO_SIZE = 140;

// Strong custom curves (see review STANDARDS.md)
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const EASE_FLY: [number, number, number, number] = [0.4, 0, 0.2, 1];

// Each bar: matches BrandLogo geometry exactly
const BARS = [
  { x: 17, y: 9,    w: 66, h: 9.5, rx: 4.75, rest: '#5C3D28' },
  { x: 25, y: 21.5, w: 50, h: 8.4, rx: 4.2,  rest: '#4A2C1A' },
  { x: 33, y: 33,   w: 34, h: 7.4, rx: 3.7,  rest: '#3D2314' },
  { x: 41, y: 43.5, w: 18, h: 6.3, rx: 3.15, rest: '#3D2314' },
  { x: 41, y: 50.2, w: 18, h: 6.3, rx: 3.15, rest: '#3D2314' },
  { x: 33, y: 59.6, w: 34, h: 7.4, rx: 3.7,  rest: '#3D2314' },
  { x: 25, y: 70.1, w: 50, h: 8.4, rx: 4.2,  rest: '#4A2C1A' },
  { x: 17, y: 81.5, w: 66, h: 9.5, rx: 4.75, rest: '#5C3D28' },
];

/**
 * Logo whose bars pulse orange in a top→bottom wave. The pulse is driven by a CSS
 * @keyframes animation (off the main JS thread) rather than per-frame Framer `fill`
 * tweens, and is gated behind prefers-reduced-motion so reduced-motion users get a
 * static logo (color pulse is movement-free, but we drop it to keep the splash calm).
 */
function PulsingLogo({ size }: { size: number }) {
  return (
    <>
      <style>{`
        @keyframes tyme-bar-pulse {
          0%, 100% { fill: var(--rest); }
          40%      { fill: #E8651A; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .tyme-intro-bar { animation: tyme-bar-pulse 1.6s ease-in-out infinite; }
        }
      `}</style>
      <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <title>Tyme logo</title>
        {BARS.map((bar, i) => (
          <rect
            key={i}
            className="tyme-intro-bar"
            x={bar.x}
            y={bar.y}
            width={bar.w}
            height={bar.h}
            rx={bar.rx}
            fill={bar.rest}
            style={
              {
                '--rest': bar.rest,
                animationDelay: `${i * 0.12}s`, // cascade top → bottom
              } as React.CSSProperties
            }
          />
        ))}
      </svg>
    </>
  );
}

export default function LogoIntroAnimation() {
  const logoControls = useAnimation();
  const bgControls = useAnimation();
  const [visible, setVisible] = useState(true);
  const { markIntroDone } = useIntro();
  const reduce = useReducedMotion();

  useEffect(() => {
    const finish = () => {
      markIntroDone();
      setVisible(false);
    };

    const run = async () => {
      // Reduced motion: no positional fly — just hold briefly, fade the backdrop, done.
      if (reduce) {
        await new Promise((r) => setTimeout(r, 600));
        await bgControls.start({ opacity: 0, transition: { duration: 0.4 } });
        finish();
        return;
      }

      // Hold so the pulse reads, then fly the logo into the header.
      await new Promise((r) => setTimeout(r, 800));

      const headerLogo = document.querySelector<HTMLElement>('[data-header-logo]');
      if (!headerLogo) {
        await bgControls.start({ opacity: 0, transition: { duration: 0.4 } });
        finish();
        return;
      }

      const rect = headerLogo.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const targetX = rect.left + rect.width / 2 - vw / 2;
      const targetY = rect.top + rect.height / 2 - vh / 2;
      const targetScale = rect.width / LOGO_SIZE;

      // Fly (full transform string → GPU-composited) while the backdrop fades out.
      await Promise.all([
        logoControls.start({
          transform: `translate(${targetX}px, ${targetY}px) scale(${targetScale})`,
          transition: { duration: 0.7, ease: EASE_FLY },
        }),
        bgControls.start({
          opacity: 0,
          transition: { duration: 0.55, ease: EASE_IN_OUT },
        }),
      ]);

      await logoControls.start({ opacity: 0, transition: { duration: 0.15 } });
      finish();
    };

    run();
  }, [logoControls, bgControls, markIntroDone, reduce]);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {/* Full-screen backdrop (opacity/color only — safe under reduced motion) */}
      <motion.div
        animate={bgControls}
        style={{ position: 'absolute', inset: 0, background: '#0c0806' }}
      />

      {/* Centered pulsing logo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.92)' }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'scale(1)' }}
          transition={{ duration: reduce ? 0.3 : 0.5, ease: EASE_OUT }}
        >
          <motion.div
            initial={{ transform: 'translate(0px, 0px) scale(1)' }}
            animate={logoControls}
            style={{
              transformOrigin: '50% 50%',
              filter: 'drop-shadow(0 0 30px rgba(232,101,26,0.55))',
            }}
          >
            <PulsingLogo size={LOGO_SIZE} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
