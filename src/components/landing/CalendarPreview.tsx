'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

// Decorative weekly-calendar preview built from divs (no image asset needed).
// Each colored block represents a logged time entry. The blocks pulse forever in a
// staggered, top-origin "breathing" wave that ripples across the week, evoking a
// live, filling calendar. Honors reduced motion (renders static blocks instead).
const previewColumns = [
  { day: 'Mon', blocks: [{ top: 8, height: 44, color: '#dda67a' }, { top: 64, height: 28, color: '#3b82f6' }] },
  { day: 'Tue', blocks: [{ top: 20, height: 60, color: '#10b981' }] },
  { day: 'Wed', blocks: [{ top: 4, height: 30, color: '#ec4899' }, { top: 44, height: 50, color: '#dda67a' }] },
  { day: 'Thu', blocks: [{ top: 32, height: 40, color: '#f59e0b' }] },
  { day: 'Fri', blocks: [{ top: 12, height: 36, color: '#8b5cf6' }, { top: 58, height: 24, color: '#10b981' }] },
];

export default function CalendarPreview() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-[#3e271a] bg-[#140d0a]/70 p-3 shadow-2xl shadow-[#4a2b16]/30 backdrop-blur-xl sm:p-4">
      <div className="rounded-2xl border border-[#3e271a]/60 bg-[#0f0a07]">
        {/* Fake window chrome */}
        <div className="flex items-center gap-2 border-b border-[#3e271a]/50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#5e3820]/70" />
          <span className="h-3 w-3 rounded-full bg-[#5e3820]/50" />
          <span className="h-3 w-3 rounded-full bg-[#5e3820]/30" />
          <span className="ml-3 font-mono text-[11px] uppercase tracking-widest text-[#ecd0b9]/40">
            Tyme · This week
          </span>
        </div>

        {/* Weekly grid with animated time-entry blocks */}
        <div className="grid grid-cols-5 gap-2 p-4 sm:gap-3 sm:p-6">
          {previewColumns.map((col, colIndex) => (
            <div key={col.day} className="flex flex-col">
              <span className="mb-2 text-center font-mono text-[10px] uppercase tracking-wider text-[#ecd0b9]/45">
                {col.day}
              </span>
              <div className="relative h-32 rounded-xl border border-[#3e271a]/40 bg-[#0c0806]/60 sm:h-44">
                {col.blocks.map((b, blockIndex) => {
                  const style: React.CSSProperties = {
                    top: `${b.top}%`,
                    height: `${b.height}%`,
                    backgroundColor: b.color,
                    transformOrigin: 'top',
                  };

                  // Reduced motion: render the block at its final state, no animation.
                  if (shouldReduceMotion) {
                    return (
                      <div
                        key={blockIndex}
                        className="absolute inset-x-1.5 rounded-md opacity-85"
                        style={style}
                      />
                    );
                  }

                  // Infinite breathing wave — each block gently pulses its opacity
                  // and vertical scale on a loop, offset by column/row so the motion
                  // ripples left-to-right, top-to-bottom across the week.
                  return (
                    <motion.div
                      key={blockIndex}
                      className="absolute inset-x-1.5 rounded-md"
                      style={style}
                      animate={{ opacity: [0.3, 0.9, 0.3], scaleY: [0.92, 1, 0.92] }}
                      transition={{
                        duration: 2.8,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        delay: colIndex * 0.18 + blockIndex * 0.14,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
