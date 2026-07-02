'use client';

import React, { useState } from "react";
import { FolderPlus, Sliders, HelpCircle, Shield, Coins, Pencil, Trash2, Plus } from "lucide-react";
import { Project, Tag, TimeEntry, UserProfile } from "../types";
import { PROJECT_COLORS } from "../constants";
import { toast } from "sonner";
import HourlyRateControl from "./HourlyRateControl";

interface SettingsViewProps {
  projects: Project[];
  tags: Tag[];
  entries: TimeEntry[];
  onAddProject: (name: string, color: string, client?: string) => Project;
  onUpdateProject: (id: string, updates: { name?: string; client?: string; color?: string }) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
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

export default function SettingsView({
  projects,
  tags,
  entries,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
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
  // Project add/edit form state (shared between the "+ Add Project" and inline edit forms)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>("");
  const [formClient, setFormClient] = useState<string>("");
  const [formColor, setFormColor] = useState<string>(PROJECT_COLORS[0]);

  // Two-step delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getEntryCount = (projectId: string) =>
    entries.filter((e) => e.projectId === projectId).length;

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setConfirmDeleteId(null);
    setFormName("");
    setFormClient("");
    setFormColor(PROJECT_COLORS[0]);
  };

  const startEdit = (proj: Project) => {
    setEditingId(proj.id);
    setShowAddForm(false);
    setConfirmDeleteId(null);
    setFormName(proj.name);
    setFormClient(proj.client || "");
    setFormColor(proj.color);
  };

  const closeForm = () => {
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) return;
    try {
      if (editingId) {
        await onUpdateProject(editingId, {
          name,
          client: formClient.trim(),
          color: formColor,
        });
        toast.success("Project updated successfully!", {
          description: `Saved as "${name}"`,
          duration: 3000,
        });
      } else {
        onAddProject(name, formColor, formClient.trim() || undefined);
        toast.success("Project created successfully!", {
          description: `"${name}" added to your workspace.`,
          duration: 3000,
        });
      }
      closeForm();
    } catch {
      toast.error("Failed to save project. Please check your connection.");
    }
  };

  const handleDelete = async (proj: Project) => {
    if (confirmDeleteId !== proj.id) {
      setConfirmDeleteId(proj.id);
      return;
    }
    setConfirmDeleteId(null);
    const affected = getEntryCount(proj.id);
    try {
      await onDeleteProject(proj.id);
      toast.success("Project deleted", {
        description:
          affected > 0
            ? `"${proj.name}" removed. ${affected} time ${affected === 1 ? "entry" : "entries"} moved to "No Project".`
            : `"${proj.name}" has been removed.`,
        duration: 4000,
      });
    } catch {
      toast.error("Failed to delete project. Please check your connection.");
    }
  };

  const renderProjectForm = (submitLabel: string) => (
    <form
      onSubmit={handleSubmitForm}
      className='space-y-3 bg-[#1c120c]/60 p-4 rounded-xl border border-[#3e271a]/40'
    >
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        <input
          type='text'
          required
          autoFocus
          placeholder='Project name *'
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className='w-full text-xs p-3 rounded-xl border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] focus:border-[#dda67a] outline-none transition font-medium font-sans'
        />
        <input
          type='text'
          placeholder='Client (optional)'
          value={formClient}
          onChange={(e) => setFormClient(e.target.value)}
          className='w-full text-xs p-3 rounded-xl border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] focus:border-[#dda67a] outline-none transition font-medium font-sans'
        />
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex gap-2.5 md:gap-2'>
          {PROJECT_COLORS.map((color) => (
            <button
              type='button'
              key={color}
              onClick={() => setFormColor(color)}
              className={`h-8 w-8 md:h-5.5 md:w-5.5 rounded-full border border-black/30 cursor-pointer shrink-0 transition relative ${formColor === color ? "scale-110 ring-2 ring-[#dda67a]" : "opacity-70 hover:opacity-100"}`}
              style={{ backgroundColor: color }}
            >
              {formColor === color && (
                <span className='absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm' />
              )}
            </button>
          ))}
        </div>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={closeForm}
            className='px-3 py-2 text-xs rounded-lg bg-[#241610] hover:bg-[#341f17] text-[#ecd0b9] border border-[#3e271a]/50 cursor-pointer transition'
          >
            Cancel
          </button>
          <button
            type='submit'
            className='px-4 py-2 text-xs rounded-lg bg-[#a66e46] text-white font-semibold hover:bg-[#8e5a34] cursor-pointer transition'
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className='flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full z-10'>
      {/* Page Header */}
      <header className='shrink-0'>
        <h2 className='text-xl font-display font-semibold text-white'>Preferences & Management</h2>
        <p className='text-xs text-[#ecd0b9]/75 mt-1'>
          Manage workspace projects and day-to-day productivity metrics
        </p>
      </header>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'>
        {/* Section 1: Projects Management */}
        <div className='md:col-span-2 space-y-4 md:space-y-6'>
          <div className='bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5 p-6 space-y-5'>
            <div className='flex items-center justify-between border-b border-[#3e271a]/40 pb-4'>
              <div className='flex items-center gap-2.5'>
                <FolderPlus className='h-5.5 w-5.5 text-[#dda67a]' />
                <div>
                  <h3 className='text-sm font-sans font-bold text-white'>Projects</h3>
                  <p className='text-[10px] text-[#ecd0b9]/50 font-mono hidden md:block'>
                    WORKSPACE PROJECT MANAGEMENT
                  </p>
                </div>
              </div>
              <span className='hidden sm:inline-block px-2.5 py-1 text-[10px] font-mono rounded bg-[#dda67a]/10 text-[#dda67a] border border-[#dda67a]/20 uppercase tracking-widest font-bold'>
                {projects.length} Active
              </span>
            </div>

            {/* Project list */}
            <div className='space-y-2'>
              {projects.map((proj) => {
                if (editingId === proj.id) {
                  return <div key={proj.id}>{renderProjectForm("Save Changes")}</div>;
                }
                const entryCount = getEntryCount(proj.id);
                const isConfirming = confirmDeleteId === proj.id;
                return (
                  <div
                    key={proj.id}
                    className='flex items-center gap-3 p-3 rounded-xl border border-[#3e271a]/40 bg-[#1c120c]/60 hover:border-[#3e271a]/80 transition group'
                  >
                    <span
                      className='h-3 w-3 rounded-full shrink-0 border border-black/30'
                      style={{ backgroundColor: proj.color }}
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='text-xs font-semibold text-white truncate'>{proj.name}</p>
                      <p className='text-[10px] text-[#ecd0b9]/50 font-mono truncate'>
                        {proj.client ? `${proj.client} · ` : ""}
                        {entryCount} {entryCount === 1 ? "entry" : "entries"}
                      </p>
                    </div>
                    <div className='flex items-center gap-1.5 shrink-0'>
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleDelete(proj)}
                            className='px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 cursor-pointer transition'
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className='px-2.5 py-1.5 text-[10px] rounded-lg bg-[#241610] hover:bg-[#341f17] text-[#ecd0b9] border border-[#3e271a]/50 cursor-pointer transition'
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(proj)}
                            title='Edit project'
                            className='p-2 rounded-lg text-[#ecd0b9]/60 hover:text-[#dda67a] hover:bg-[#dda67a]/10 cursor-pointer transition'
                          >
                            <Pencil className='h-3.5 w-3.5' />
                          </button>
                          <button
                            onClick={() => handleDelete(proj)}
                            title='Delete project'
                            className='p-2 rounded-lg text-[#ecd0b9]/60 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition'
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && !showAddForm && (
                <div className='p-6 text-center text-xs text-[#ecd0b9]/50 italic border border-dashed border-[#3e271a]/60 rounded-xl'>
                  No projects yet. Create your first project to start organizing time entries.
                </div>
              )}
            </div>

            {/* Add project form / trigger */}
            {showAddForm ? (
              renderProjectForm("Create Project")
            ) : (
              <button
                onClick={startAdd}
                className='w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-[#dda67a] hover:bg-[#dda67a]/10 rounded-xl border border-dashed border-[#dda67a]/40 hover:border-[#dda67a]/70 cursor-pointer transition'
              >
                <Plus className='h-4 w-4' />
                <span>Add Project</span>
              </button>
            )}
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
