'use client';

import React from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Full-bleed looping video backdrop for the hero.
 *
 * HOW TO ENABLE A REAL VIDEO:
 *   1. Drop a short (~10–20s), muted, seamless-loop clip into /public, ideally as
 *      both formats: `public/hero-bg.webm` (smaller, preferred) and `public/hero-bg.mp4`
 *      (Safari/iOS fallback). Keep each well under ~2–3 MB so it doesn't hurt LCP.
 *   2. Optionally add a first-frame still as `public/hero-poster.jpg` for the poster.
 *   3. Uncomment the entries in HERO_VIDEO_SOURCES below (and set POSTER).
 *
 * Suggested footage (free, no attribution): a dark, low-contrast, slow ambient loop
 * that matches the espresso palette — warm out-of-focus bokeh, drifting embers/dust,
 * flowing dark-amber ink/gradient, or soft particle fields. Avoid busy/high-contrast
 * clips so the white headline stays readable. Good sources: Coverr, Mixkit, Pexels
 * Videos. Encode mp4 as H.264 + AAC; webm as VP9; strip the audio track.
 *
 * Until a clip is provided this renders only the espresso gradient wash (no video
 * element, so no 404s). It is also skipped entirely when the user prefers reduced
 * motion — autoplaying background video is exactly what that setting is meant to stop.
 */

const HERO_VIDEO_SOURCES: { src: string; type: string }[] = [
  // { src: '/hero-bg.webm', type: 'video/webm' },
  // { src: '/hero-bg.mp4', type: 'video/mp4' },
];

const POSTER: string | undefined = undefined; // e.g. '/hero-poster.jpg'

export default function HeroVideoBackground() {
  const shouldReduceMotion = useReducedMotion();
  const showVideo = !shouldReduceMotion && HERO_VIDEO_SOURCES.length > 0;

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-[#0c0806]">
      {showVideo && (
        <video
          className="h-full w-full object-cover opacity-30"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
        >
          {HERO_VIDEO_SOURCES.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      )}

      {/* Espresso wash + vignette so headline/CTA text stays legible over any clip. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0806]/55 via-[#0c0806]/70 to-[#0c0806]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0c0806_85%)]" />
    </div>
  );
}
