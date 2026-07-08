'use client';

import React, { useState, useEffect, useRef } from "react";
import { Minus, Plus, Check, Loader2, Coins, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface HourlyRateControlProps {
  rate: number;
  onSave: (newRate: number) => Promise<void> | void;
  variant?: "compact" | "full";
}

const PRESET_VALUES = [15, 25, 50, 75, 100, 150];

export default function HourlyRateControl({
  rate,
  onSave,
  variant = "compact",
}: HourlyRateControlProps) {
  // Controlled input string to allow typing decimal dot smoothly
  const [localRateStr, setLocalRateStr] = useState<string>(rate.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Synchronize local string with incoming prop (unless input is focused)
  useEffect(() => {
    if (!isFocused) {
      // Format rate nicely (remove trailing .00 if integer, otherwise show up to 2 decimals)
      const formatted = Number(rate).toFixed(2).replace(/\.00$/, "");
      setLocalRateStr(formatted);
    }
  }, [rate, isFocused]);

  // Clean up popover listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    if (isPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const saveRateToFirestore = async (value: number) => {
    setIsSaving(true);
    setShowSaved(false);
    try {
      await onSave(value);
      setIsSaving(false);
      setShowSaved(true);
      
      // Clear saved indicator after 2 seconds
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      setIsSaving(false);
      toast.error("Failed to save hourly rate. Please check your connection.");
    }
  };

  const handleImmediateSave = (newRate: number) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const validatedRate = Math.max(0, Math.round(newRate * 100) / 100);
    setLocalRateStr(validatedRate.toString());
    saveRateToFirestore(validatedRate);
  };

  const handleDebouncedSave = (newRate: number) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    const validatedRate = Math.max(0, Math.round(newRate * 100) / 100);

    debounceRef.current = setTimeout(() => {
      saveRateToFirestore(validatedRate);
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Allow digits, single decimal point, and empty value
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setLocalRateStr(val);
      
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0) {
        handleDebouncedSave(parsed);
      }
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localRateStr);
    
    if (isNaN(parsed) || parsed < 0) {
      // Revert to current prop rate
      setLocalRateStr(Number(rate).toFixed(2).replace(/\.00$/, ""));
    } else {
      // Format cleanly to 2 decimal places if it's a decimal, or integer
      const formatted = Math.max(0, Math.round(parsed * 100) / 100);
      setLocalRateStr(formatted.toFixed(2).replace(/\.00$/, ""));
      handleImmediateSave(formatted);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const increment = () => {
    const current = parseFloat(localRateStr) || 0;
    const next = current + 5;
    handleImmediateSave(next);
  };

  const decrement = () => {
    const current = parseFloat(localRateStr) || 0;
    const next = Math.max(0, current - 5);
    handleImmediateSave(next);
  };

  const handleSelectPreset = (preset: number) => {
    handleImmediateSave(preset);
    setIsPopoverOpen(false);
  };

  return (
    <div className={`flex flex-col gap-2 ${variant === "full" ? "w-full" : ""}`}>
      <div className="flex items-center gap-1.5">
        {/* Adjustment container */}
        <div
          className={`flex items-center border rounded-xl overflow-hidden transition-all duration-200 ${
            isFocused 
              ? "border-accent bg-surface-2/60 shadow-[0_0_8px_rgba(221,166,122,0.15)]" 
              : "border-border/55 bg-surface-2/40"
          }`}
        >
          {/* Decrement Button */}
          <button
            type="button"
            onClick={decrement}
            disabled={rate <= 0}
            className="p-2 text-body/60 hover:text-heading hover:bg-white/5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all animate-none"
            title="Decrease rate by $5"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          {/* Dollar prefix & Text Input */}
          <div className="flex items-center px-1">
            <span className="font-mono text-accent-text font-bold text-xs select-none">$</span>
            <input
              type="text"
              value={localRateStr}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="w-12 bg-transparent text-heading focus:outline-none font-mono font-bold outline-none text-center text-xs py-1.5"
              placeholder="0"
              title="Enter billing rate per hour"
            />
            <span className="text-[9px] text-body/45 select-none font-sans font-medium">/hr</span>
          </div>

          {/* Increment Button */}
          <button
            type="button"
            onClick={increment}
            className="p-2 text-body/60 hover:text-heading hover:bg-white/5 active:scale-95 cursor-pointer transition-all animate-none"
            title="Increase rate by $5"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Compact version popover trigger */}
        {variant === "compact" && (
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className={`p-2 rounded-xl border border-border/55 bg-surface-2/40 hover:bg-border/40 text-body/75 hover:text-body transition-all flex items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                isPopoverOpen ? "bg-border/50 text-heading" : ""
              }`}
              title="Quick presets & adjustments"
            >
              <Coins className="h-3.5 w-3.5 text-accent-text" />
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isPopoverOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Popover overlay */}
            {isPopoverOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-48 bg-surface-1 border border-border-strong rounded-xl shadow-2xl p-3 space-y-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-body/40 font-mono block">
                  Quick Presets
                </span>
                
                {/* Presets Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_VALUES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                        rate === preset
                          ? "bg-accent text-black border-accent"
                          : "bg-surface-3/50 text-body/75 border-border-strong/50 hover:bg-border hover:text-heading"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border-strong/40 pt-2 flex items-center justify-between text-[9px] text-body/50 font-mono">
                  <span>Step changes:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleImmediateSave(Math.max(0, rate - 1))}
                      className="px-1.5 py-0.5 rounded bg-surface-3 border border-border-strong/50 hover:bg-border text-accent-text font-bold"
                    >
                      -$1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImmediateSave(rate + 1)}
                      className="px-1.5 py-0.5 rounded bg-surface-3 border border-border-strong/50 hover:bg-border text-accent-text font-bold"
                    >
                      +$1
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto-save status feedback indicator */}
        <div className="flex items-center text-[10px] font-mono font-medium transition-all duration-300 min-w-[55px]">
          {isSaving && (
            <span className="flex items-center gap-1 text-accent-text animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving</span>
            </span>
          )}
          {!isSaving && showSaved && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="h-3 w-3" />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>

      {/* Full version inline presets and sliders (for SettingsView) */}
      {variant === "full" && (
        <div className="bg-surface-2/60 p-3 rounded-xl border border-border-strong/40">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-body/40 font-mono block">
              Quick Select Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_VALUES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                    rate === preset
                      ? "bg-accent text-black border-accent shadow-sm shadow-accent/20"
                      : "bg-surface-3/50 text-body/75 border-border-strong/50 hover:bg-border hover:text-heading"
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
