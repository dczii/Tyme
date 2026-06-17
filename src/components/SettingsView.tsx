import React, { useState, useEffect, useRef } from "react";
import { FolderPlus, Sliders, HelpCircle, Shield, Coins } from "lucide-react";
import { Project, Tag, UserProfile } from "../types";
import { toast } from "sonner";
import HourlyRateControl from "./HourlyRateControl";

interface SettingsViewProps {
  projects: Project[];
  tags: Tag[];
  onUpdateSingleProject: (name: string, client?: string, color?: string) => void;
  onAddTag: (name: string) => Tag;
  onDeleteTag: (id: string) => void;
  workdayTargetHours: number;
  onUpdateTargetHours: (hours: number) => void;
  hourlyRate: number;
  onUpdateHourlyRate: (rate: number) => Promise<void> | void;
  logoStyle: "classic" | "minimalist" | "hourglass";
  onLogoStyleChange: (style: "classic" | "minimalist" | "hourglass") => void;
  user: UserProfile;
  onLogout: () => void;
  contacts?: any[];
}

const PRESET_COLORS = [
  "#3b82f6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
];

export default function SettingsView({
  projects,
  tags,
  onUpdateSingleProject,
  onAddTag,
  onDeleteTag,
  workdayTargetHours,
  onUpdateTargetHours,
  hourlyRate,
  onUpdateHourlyRate,
  logoStyle,
  onLogoStyleChange,
  user,
  onLogout,
  contacts = [],
}: SettingsViewProps) {
  // Sync singular project data
  const activeProj = projects[0] || { name: "Test Project", color: "#1d4ed8" };

  // Project form values
  const [projName, setProjName] = useState<string>(activeProj.name);
  const [projColor, setProjColor] = useState<string>(activeProj.color);

  useEffect(() => {
    if (projects[0]) {
      setProjName(projects[0].name);
      setProjColor(projects[0].color);
    }
  }, [projects]);

  // Track first render to avoid firing on initial mount
  const isFirstRender = useRef(true);

  // Debounced auto-save for Project Name
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!projName.trim()) {
      return;
    }

    // Only save if the name actually changed from the database/current value
    const currentName = projects[0]?.name || "";
    if (projName.trim() === currentName) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        await onUpdateSingleProject(projName.trim(), undefined, projColor);
        toast.success("Project name updated successfully!", {
          description: `Saved as "${projName.trim()}"`,
          duration: 3000,
        });
      } catch (err) {
        toast.error("Failed to save project name. Please check your connection.");
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [projName]);

  // Immediate save on Color select click
  const handleColorSelect = async (color: string) => {
    setProjColor(color);
    try {
      await onUpdateSingleProject(projName.trim(), undefined, color);
      toast.success("Theme color updated successfully!", {
        duration: 3000,
      });
    } catch (err) {
      toast.error("Failed to update theme color. Please check your connection.");
    }
  };

  return (
    <div className='flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full z-10'>
      {/* Page Header */}
      <header className='shrink-0'>
        <h2 className='text-xl font-display font-semibold text-white'>Preferences & Management</h2>
        <p className='text-xs text-[#ecd0b9]/75 mt-1'>
          Customize project branding and day-to-day productivity metrics
        </p>
      </header>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'>
        {/* Section 1: Single Project Identity Management */}
        <div className='md:col-span-2 space-y-4 md:space-y-6'>
          <div className='bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5 p-6 space-y-5'>
            <div className='flex items-center justify-between border-b border-[#3e271a]/40 pb-4'>
              <div className='flex items-center gap-2.5'>
                <FolderPlus className='h-5.5 w-5.5 text-[#dda67a]' />
                <div>
                  <h3 className='text-sm font-sans font-bold text-white'>
                    Project Identity & Branding
                  </h3>
                  <p className='text-[10px] text-[#ecd0b9]/50 font-mono hidden md:block'>
                    WORKSPACE CONSTANT ALIGNMENT
                  </p>
                </div>
              </div>
              <span className='hidden sm:inline-block px-2.5 py-1 text-[10px] font-mono rounded bg-[#dda67a]/10 text-[#dda67a] border border-[#dda67a]/20 uppercase tracking-widest font-bold font-semibold'>
                Singular Alignment
              </span>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className='space-y-4'>
              <div className='grid grid-cols-1 gap-4'>
                <div className='space-y-1.5 flex flex-col justify-end'>
                  <label className='text-xs font-semibold text-[#ecd0b9]/75 block font-sans'>
                    Project Name *
                  </label>
                  <input
                    type='text'
                    required
                    placeholder='e.g. Arrived Web App'
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className='w-full text-xs p-3 rounded-xl border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] focus:border-[#dda67a] outline-none transition font-medium font-sans'
                  />
                  <div className='text-[10px] text-[#ecd0b9]/50 font-mono flex items-center gap-1.5 mt-1.5'>
                    <span className='h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse'></span>
                    <span>Saved automatically on every keystroke</span>
                  </div>
                </div>
              </div>

              <div className='space-y-2.5 pt-1'>
                <label className='text-xs font-semibold text-[#ecd0b9]/75 block font-sans'>
                  Theme Color Indicator
                </label>
                <div className='flex flex-wrap items-center justify-between gap-3 bg-[#1c120c]/60 p-3 rounded-xl border border-[#3e271a]/40'>
                  <div className='flex gap-2.5 md:gap-2'>
                    {PRESET_COLORS.map((color) => (
                      <button
                        type='button'
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`h-8 w-8 md:h-5.5 md:w-5.5 rounded-full border border-black/30 cursor-pointer shrink-0 transition relative ${projColor === color ? "scale-110 ring-2 ring-[#dda67a]" : "opacity-70 hover:opacity-100"}`}
                        style={{ backgroundColor: color }}
                      >
                        {projColor === color && (
                          <span className='absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm' />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Column 2: Quick configuration */}
        <div className='space-y-6'>
          {/* Billing & Hourly Rate Card */}
          <div className='bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5 p-5'>
            <h3 className='text-sm font-display font-bold text-white mb-4 flex items-center gap-2'>
              <Coins className='h-5 w-5 text-[#dda67a]' />
              <span>Billing & Rates</span>
            </h3>

            <div className='space-y-4'>
              <p className='text-xs text-[#ecd0b9]/75 font-sans leading-relaxed'>
                Configure your default billable rate. Changes auto-save instantly and apply to all report billing calculations and CSV/PDF exports.
              </p>

              <HourlyRateControl
                rate={hourlyRate}
                onSave={onUpdateHourlyRate}
                variant="full"
              />
            </div>
          </div>

          {/* Productivity Target parameters */}
          <div className='bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5 p-5'>
            <h3 className='text-sm font-display font-bold text-white mb-4 flex items-center gap-2'>
              <Sliders className='h-5 w-5 text-[#dda67a]' />
              <span>Daily Target</span>
            </h3>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between items-center text-xs'>
                  <span className='font-semibold text-[#ecd0b9]/75'>Workday Target hours:</span>
                  <span className='font-mono font-bold text-[#dda67a]'>
                    {workdayTargetHours} hrs/day
                  </span>
                </div>

                <input
                  type='range'
                  min='4'
                  max='12'
                  step='1'
                  value={workdayTargetHours}
                  onChange={(e) => onUpdateTargetHours(Number(e.target.value))}
                  className='w-full h-1.5 bg-[#1d1410] rounded-lg appearance-none cursor-pointer accent-[#a66e46] border border-[#3e271a]/40'
                />
              </div>

              {/* Informational helpful tip */}
              <div className='p-3.5 bg-[#dda67a]/10 border border-[#dda67a]/20 rounded-xl flex items-start gap-2.5 text-xs text-[#ecd0b9] leading-relaxed font-semibold'>
                <HelpCircle className='h-4 w-4 shrink-0 mt-0.5 text-[#dda67a]' />
                <p>
                  Setting a daily workday benchmark marks visual indicators in the scheduling
                  calendar so you instantly spotted lagging days.
                </p>
              </div>

              {/* Secure Session Info & Sign Out */}
              <div className='pt-4 border-t border-[#3e271a]/40 space-y-3.5'>
                <div className='flex items-center gap-2'>
                  <Shield className='h-4.5 w-4.5 text-green-500 shrink-0' />
                  <span className='text-xs font-bold text-white uppercase tracking-wider font-mono'>
                    Secure Access Identity
                  </span>
                </div>

                <div className='flex items-center gap-3 p-3 bg-[#1d1410]/75 border border-[#3e271a]/50 rounded-xl'>
                  <img
                    src={user.picture}
                    alt={user.name}
                    referrerPolicy='no-referrer'
                    className='h-10 w-10 rounded-full border border-green-500/35 shadow-sm'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs font-bold text-white truncate'>{user.name}</p>
                    <p className='text-[10px] text-[#ecd0b9]/50 font-mono truncate'>{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className='w-full text-center py-3.5 md:py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-950/10 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-semibold tracking-wider uppercase font-sans transition cursor-pointer'
                >
                  Sign Out of Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
