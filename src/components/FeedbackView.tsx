'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
  Sparkles,
  Send,
  PartyPopper,
  User as UserIcon,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { FeedbackDraft, FeedbackKind, UserProfile } from '../types';
import { PAYWALL_FEATURES, PRICE_BANDS } from '../constants';

interface FeedbackViewProps {
  user: UserProfile;
  /**
   * Resolves true when the email went out. Email is the only sink — false means
   * the submission was lost, so the form must stay filled for a retry.
   */
  onSubmitFeedback: (draft: FeedbackDraft) => Promise<boolean>;
}

const RATING_LABELS = ['', 'Rough', 'Needs work', 'Does the job', 'Really good', 'Love it'];

// Panel chrome shared by every card on this screen
const PANEL =
  'bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5';

const INPUT =
  'w-full text-xs p-3 rounded-xl border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] placeholder:text-[#ecd0b9]/30 focus:border-[#dda67a] outline-none transition font-medium font-sans min-h-[44px]';

// Identity fields come from the account and are not editable here. Muted and
// non-interactive so it reads as "this is who you are", not "fill this in".
const INPUT_READONLY =
  'w-full text-xs p-3 rounded-xl border border-[#3e271a]/50 bg-[#140d0a]/60 text-[#ecd0b9]/60 outline-none font-medium font-sans min-h-[44px] cursor-not-allowed disabled:opacity-100';

/**
 * Arrow-key navigation for a custom radio group. Native radios move selection with
 * the arrow keys and expose the group as one tab stop; `role="radio"` without this
 * announces "1 of N" to a screen reader and then ignores the keys that implies.
 */
function useRadioKeys<T extends string>(values: readonly T[], current: T | '', onSelect: (v: T) => void) {
  return (event: React.KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const idx = current === '' ? -1 : values.indexOf(current as T);
    const next = idx === -1
      ? (delta === 1 ? 0 : values.length - 1)
      : (idx + delta + values.length) % values.length;
    onSelect(values[next]);
  };
}

const KIND_VALUES = ['review', 'features'] as const;
const RATING_VALUES = ['1', '2', '3', '4', '5'] as const;
const PRICE_VALUES = PRICE_BANDS.map(b => b.id);

export default function FeedbackView({ user, onSubmitFeedback }: FeedbackViewProps) {
  const [step, setStep] = useState<number>(1);
  const [kind, setKind] = useState<FeedbackKind | ''>('');

  // Identity comes from the signed-in account and is shown read-only. The server
  // re-derives both from the auth token and ignores whatever the client sends, so
  // these are for display and cannot be used to redirect the reply.
  const name = user.name || '';
  const email = user.email || '';

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [features, setFeatures] = useState<string[]>([]);
  const [otherFeature, setOtherFeature] = useState<string>('');
  const [priceBand, setPriceBand] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  // State updates are async, so two fast clicks can both clear an `isSubmitting`
  // state check before React re-renders. A ref flips synchronously.
  const submitLock = React.useRef(false);

  // Changing step swaps the whole panel; without this you'd land mid-form on
  // mobile, where "Next" sits at the bottom of a long scroll.
  const scrollRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const toggleFeature = (id: string) => {
    setFeatures(prev => (prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]));
  };

  // Identity is fixed by the account, so the only thing to choose on step 1 is the branch.
  const canAdvance = kind !== '';

  const canSubmit = useMemo(() => {
    if (!canAdvance) return false;
    if (kind === 'review') return rating > 0;
    return (features.length > 0 || otherFeature.trim().length > 0) && priceBand !== '';
  }, [canAdvance, kind, rating, features, otherFeature, priceBand]);

  const onKindKeys = useRadioKeys(KIND_VALUES, kind, setKind);
  const onRatingKeys = useRadioKeys(
    RATING_VALUES,
    rating ? (String(rating) as (typeof RATING_VALUES)[number]) : '',
    (v) => setRating(Number(v)),
  );
  const onPriceKeys = useRadioKeys(PRICE_VALUES, priceBand, setPriceBand);

  const resetForm = () => {
    setStep(1);
    setKind('');
    setRating(0);
    setReview('');
    setFeatures([]);
    setOtherFeature('');
    setPriceBand('');
    setIsDone(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitLock.current || kind === '') return;
    submitLock.current = true;
    setIsSubmitting(true);
    try {
      const sent = await onSubmitFeedback({
        kind,
        name: name.trim(),
        email: email.trim(),
        rating: kind === 'review' ? rating : 0,
        review: kind === 'review' ? review.trim() : '',
        features: kind === 'features' ? features : [],
        otherFeature: kind === 'features' ? otherFeature.trim() : '',
        priceBand: kind === 'features' ? priceBand : '',
      });

      if (sent) {
        toast.success('Sent — thank you!', {
          description: 'Your message is on its way to the Tyme team.',
          duration: 4000,
        });
        setIsDone(true);
        return;
      }

      // Nothing is stored, so a failed send means the answers exist only in this
      // form. Keep it filled and say so rather than showing a false thank-you.
      toast.error("Couldn't send your message", {
        description: 'Your answers are still here — please try again in a moment.',
        duration: 6000,
      });
    } catch {
      toast.error("Couldn't send your message", {
        description: 'Please check your connection and try again.',
        duration: 6000,
      });
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  // ---------- Success state ----------
  if (isDone) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-3xl mx-auto w-full z-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`${PANEL} p-8 md:p-10 text-center w-full`}
        >
          <div className="h-14 w-14 rounded-2xl bg-[#2d1b11] border border-[#3e271a] flex items-center justify-center mx-auto mb-5">
            <PartyPopper className="h-7 w-7 text-[#dda67a]" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-white">Thank you</h2>
          <p className="text-sm text-[#ecd0b9]/75 mt-2 max-w-md mx-auto">
            We&apos;ve got it. If we need to follow up, we&apos;ll reach you at{' '}
            <span className="font-mono text-[#dda67a]">{email.trim()}</span>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <button
              onClick={resetForm}
              className="px-4 py-2.5 text-xs rounded-xl bg-[#241610] hover:bg-[#341f17] text-[#ecd0b9] border border-[#3e271a]/50 cursor-pointer transition min-h-[44px]"
            >
              Send something else
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------- Survey ----------
  return (
    <div
      ref={scrollRef}
      className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-3xl mx-auto w-full z-10"
    >
      {/* Page Header */}
      <header className="shrink-0">
        <h2 className="text-xl font-display font-semibold text-white">Send us a message</h2>
        <p className="text-xs text-[#ecd0b9]/75 mt-1">
          Leave a review, or tell us which features you&apos;d pay for — whichever you prefer
        </p>
      </header>

      <div className={`${PANEL} p-5 md:p-7`}>
        <AnimatePresence mode="wait">
          {/* ---------- Step 1: who you are + what you want to send ---------- */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="space-y-7"
            >
              <div>
                <h3 className="text-sm font-semibold text-white">Where we&apos;ll reply</h3>
                <p className="text-xs text-[#ecd0b9]/60 mt-1">
                  Taken from your Tyme account. Change it in Settings if it&apos;s wrong.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label
                      htmlFor="feedback-name"
                      className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#ecd0b9]/45 mb-1.5"
                    >
                      <UserIcon className="h-3 w-3" /> Your name
                    </label>
                    <input
                      id="feedback-name"
                      type="text"
                      value={name}
                      readOnly
                      disabled
                      className={INPUT_READONLY}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="feedback-email"
                      className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#ecd0b9]/45 mb-1.5"
                    >
                      <Mail className="h-3 w-3" /> Email
                    </label>
                    <input
                      id="feedback-email"
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className={INPUT_READONLY}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 id="feedback-kind-label" className="text-sm font-semibold text-white">
                  What do you want to send?
                </h3>
                <p className="text-xs text-[#ecd0b9]/60 mt-1">Pick one.</p>
                <div
                  role="radiogroup"
                  aria-labelledby="feedback-kind-label"
                  onKeyDown={onKindKeys}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4"
                >
                  {([
                    {
                      id: 'review' as FeedbackKind,
                      icon: MessageSquareQuote,
                      title: 'Leave a review',
                      body: 'Rate Tyme and tell us what works or what gets in your way.',
                    },
                    {
                      id: 'features' as FeedbackKind,
                      icon: Sparkles,
                      title: "Features you'd pay for",
                      body: 'Pick the ones worth money to you and what they’re worth.',
                    },
                  ]).map((option) => {
                    const Icon = option.icon;
                    const selected = kind === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        // Roving tabindex: the group is one tab stop, arrows move within it.
                        tabIndex={selected || (kind === '' && option.id === 'review') ? 0 : -1}
                        onClick={() => setKind(option.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer
                          ${selected
                            ? 'bg-[#2d1b11]/60 border-[#5e3820] shadow-lg shadow-black/10'
                            : 'bg-[#1d1410]/50 border-[#3e271a]/50 hover:border-[#3e271a] hover:bg-[#1d1410]'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors duration-200
                              ${selected ? 'bg-[#2d1b11] border-[#5e3820] text-[#dda67a]' : 'bg-[#140d0a] border-[#3e271a] text-[#ecd0b9]/40'}`}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          {selected && (
                            <span className="h-5 w-5 rounded-full bg-[#a66e46] flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <span className={`block text-xs font-semibold mt-3 ${selected ? 'text-white' : 'text-[#ecd0b9]/85'}`}>
                          {option.title}
                        </span>
                        <span className="block text-[11px] text-[#ecd0b9]/50 mt-1 leading-snug">
                          {option.body}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------- Step 2a: the review branch ---------- */}
          {step === 2 && kind === 'review' && (
            <motion.div
              key="step-2-review"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="space-y-6"
            >
              <div>
                <h3 id="feedback-rating-label" className="text-sm font-semibold text-white">
                  How is Tyme working for you?
                </h3>
                <p className="text-xs text-[#ecd0b9]/60 mt-1">Pick a rating — this one is required.</p>
                <div
                  role="radiogroup"
                  aria-labelledby="feedback-rating-label"
                  onKeyDown={onRatingKeys}
                  className="flex items-center gap-1.5 mt-4"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((value) => {
                    const lit = (hoverRating || rating) >= value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={rating === value}
                        aria-label={`${value} out of 5 — ${RATING_LABELS[value]}`}
                        tabIndex={rating === value || (rating === 0 && value === 1) ? 0 : -1}
                        onMouseEnter={() => setHoverRating(value)}
                        // Mirror hover on focus so keyboard users see the same label.
                        onFocus={() => setHoverRating(value)}
                        onBlur={() => setHoverRating(0)}
                        onClick={() => setRating(value)}
                        className="p-1.5 rounded-lg cursor-pointer transition-transform duration-150 hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors duration-150 ${lit ? 'text-[#dda67a] fill-[#dda67a]' : 'text-[#ecd0b9]/25'}`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-3 text-[10px] font-mono uppercase tracking-wider text-[#dda67a]/80">
                    {RATING_LABELS[hoverRating || rating] || ''}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="feedback-review" className="text-sm font-semibold text-white">
                  Anything you want to tell us?
                </label>
                <p className="text-xs text-[#ecd0b9]/60 mt-1">
                  What works, what annoys you, what you wish existed. Optional.
                </p>
                <textarea
                  id="feedback-review"
                  value={review}
                  onChange={(e) => setReview(e.target.value.slice(0, 2000))}
                  rows={6}
                  placeholder="The weekly grid is great, but I keep wishing I could…"
                  className={`${INPUT} mt-3 resize-y`}
                />
                <p className="text-[10px] font-mono text-[#ecd0b9]/35 mt-1.5 text-right">
                  {review.length}/2000
                </p>
              </div>
            </motion.div>
          )}

          {/* ---------- Step 2b: the features branch ---------- */}
          {step === 2 && kind === 'features' && (
            <motion.div
              key="step-2-features"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="space-y-7"
            >
              <div>
                <h3 id="feedback-features-label" className="text-sm font-semibold text-white">
                  Which of these would you pay for?
                </h3>
                <p className="text-xs text-[#ecd0b9]/60 mt-1">
                  Pick as many as you like — or describe your own below.
                </p>

                <div
                  role="group"
                  aria-labelledby="feedback-features-label"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4"
                >
                  {PAYWALL_FEATURES.map((feature) => {
                    const selected = features.includes(feature.id);
                    return (
                      <button
                        key={feature.id}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        onClick={() => toggleFeature(feature.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer min-h-[44px] flex gap-3 items-start
                          ${selected
                            ? 'bg-[#2d1b11]/60 border-[#5e3820] shadow-lg shadow-black/10'
                            : 'bg-[#1d1410]/50 border-[#3e271a]/50 hover:border-[#3e271a] hover:bg-[#1d1410]'}`}
                      >
                        <span
                          className={`h-4.5 w-4.5 rounded-md border shrink-0 mt-0.5 flex items-center justify-center transition-colors duration-200
                            ${selected ? 'bg-[#a66e46] border-[#a66e46]' : 'border-[#3e271a] bg-[#140d0a]'}`}
                        >
                          {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-xs font-semibold ${selected ? 'text-white' : 'text-[#ecd0b9]/85'}`}>
                            {feature.label}
                          </span>
                          <span className="block text-[11px] text-[#ecd0b9]/50 mt-0.5 leading-snug">
                            {feature.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="feedback-other" className="text-sm font-semibold text-white">
                  Something we didn&apos;t list?
                </label>
                <input
                  id="feedback-other"
                  type="text"
                  value={otherFeature}
                  onChange={(e) => setOtherFeature(e.target.value.slice(0, 200))}
                  placeholder="The one feature that would make you upgrade today"
                  className={`${INPUT} mt-3`}
                />
              </div>

              <div>
                <h3 id="feedback-price-label" className="text-sm font-semibold text-white">
                  What would that be worth per month?
                </h3>
                <p className="text-xs text-[#ecd0b9]/60 mt-1">
                  Be honest — &ldquo;free only&rdquo; is a genuinely useful answer.
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby="feedback-price-label"
                  onKeyDown={onPriceKeys}
                  className="space-y-2.5 mt-4"
                >
                  {PRICE_BANDS.map((band, idx) => {
                    const selected = priceBand === band.id;
                    return (
                      <button
                        key={band.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={selected || (priceBand === '' && idx === 0) ? 0 : -1}
                        onClick={() => setPriceBand(band.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer min-h-[44px] flex items-center gap-3
                          ${selected
                            ? 'bg-[#2d1b11]/60 border-[#5e3820] shadow-lg shadow-black/10'
                            : 'bg-[#1d1410]/50 border-[#3e271a]/50 hover:border-[#3e271a] hover:bg-[#1d1410]'}`}
                      >
                        <span
                          className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors duration-200
                            ${selected ? 'border-[#a66e46]' : 'border-[#3e271a]'}`}
                        >
                          {selected && <span className="h-2 w-2 rounded-full bg-[#a66e46]" />}
                        </span>
                        <span className={`text-sm font-mono font-semibold ${selected ? 'text-white' : 'text-[#ecd0b9]/85'}`}>
                          {band.label}
                        </span>
                        <span className="text-[11px] text-[#ecd0b9]/45 ml-auto">{band.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step controls */}
        <div className="flex items-center justify-between gap-3 mt-7 pt-5 border-t border-[#3e271a]/40">
          <button
            type="button"
            onClick={() => setStep(1)}
            // Locked mid-send: leaving the branch would desync the in-flight payload.
            disabled={step === 1 || isSubmitting}
            className="px-3.5 py-2.5 text-xs rounded-xl bg-[#241610] hover:bg-[#341f17] text-[#ecd0b9] border border-[#3e271a]/50 transition min-h-[44px] flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#241610]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <span className="text-[10px] font-mono uppercase tracking-widest text-[#ecd0b9]/35">
            Step {step} of 2
          </span>

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canAdvance}
              className="px-4 py-2.5 text-xs rounded-xl bg-[#a66e46] text-white font-semibold hover:bg-[#8e5a34] transition min-h-[44px] flex items-center gap-1.5 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-[#a66e46]"
              title={kind === '' ? 'Choose what you want to send' : undefined}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="px-4 py-2.5 text-xs rounded-xl bg-[#a66e46] text-white font-semibold hover:bg-[#8e5a34] transition min-h-[44px] flex items-center gap-1.5 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-[#a66e46]"
              title={
                canSubmit
                  ? undefined
                  : kind === 'review'
                    ? 'Pick a rating first'
                    : 'Pick at least one feature and a price range'
              }
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
