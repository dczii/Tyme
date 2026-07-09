'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type Tone = 'error' | 'success';

const TONE_STYLES: Record<Tone, string> = {
  error: 'bg-red-950/45 border-red-500/25 text-red-300',
  success: 'bg-emerald-950/40 border-emerald-500/25 text-emerald-200',
};

const TONE_ICON_COLOR: Record<Tone, string> = {
  error: 'text-red-400',
  success: 'text-emerald-400',
};

interface AuthBannerProps {
  show: boolean;
  tone: Tone;
  children: React.ReactNode;
}

/**
 * The animated status/error banner shared across the auth surfaces. Errors are
 * announced assertively, successes politely, so screen-reader users hear the
 * outcome of an off-page return without the banner stealing focus (#28, #29).
 */
export function AuthBanner({ show, tone, children }: AuthBannerProps) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          role={tone === 'error' ? 'alert' : 'status'}
          aria-live={tone === 'error' ? 'assertive' : 'polite'}
          className={`border rounded-xl p-3 flex items-start gap-2.5 text-xs overflow-hidden ${TONE_STYLES[tone]}`}
        >
          <Icon className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${TONE_ICON_COLOR[tone]}`} />
          <span>{children}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
