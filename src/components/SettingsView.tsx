import React, { useState } from 'react';
import { 
  FolderPlus, 
  Tag as TagIcon, 
  Save, 
  Trash2, 
  Sliders, 
  Sparkles,
  Smile,
  Plus,
  HelpCircle,
  FileCheck,
  Zap,
  Coffee,
  Shield,
  Users
} from 'lucide-react';
import { Project, Tag, UserProfile } from '../types';
import { GoogleContact } from '../lib/firebase';

interface SettingsViewProps {
  projects: Project[];
  tags: Tag[];
  onUpdateSingleProject: (name: string, client?: string, color?: string) => void;
  onAddTag: (name: string) => Tag;
  onDeleteTag: (id: string) => void;
  workdayTargetHours: number;
  onUpdateTargetHours: (hours: number) => void;
  logoStyle: 'classic' | 'minimalist' | 'hourglass';
  onLogoStyleChange: (style: 'classic' | 'minimalist' | 'hourglass') => void;
  user: UserProfile;
  onLogout: () => void;
  contacts?: GoogleContact[];
}

const PRESET_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#6366f1'];

export default function SettingsView({
  projects,
  tags,
  onUpdateSingleProject,
  onAddTag,
  onDeleteTag,
  workdayTargetHours,
  onUpdateTargetHours,
  logoStyle,
  onLogoStyleChange,
  user,
  onLogout,
  contacts = []
}: SettingsViewProps) {
  // Sync singular project data
  const activeProj = projects[0] || { name: 'Arrived Web App', client: 'Arrived Technologies', color: '#1d4ed8' };
  
  // Project form values
  const [projName, setProjName] = useState<string>(activeProj.name);
  const [projClient, setProjClient] = useState<string>(activeProj.client || '');
  const [projColor, setProjColor] = useState<string>(activeProj.color);
  const [showSuggestions, setShowSuggestions] = useState(false);

  React.useEffect(() => {
    if (projects[0]) {
      setProjName(projects[0].name);
      setProjClient(projects[0].client || '');
      setProjColor(projects[0].color);
    }
  }, [projects]);

  // Filter contacts as user types client
  const filteredContacts = projClient.trim() 
    ? contacts.filter(c => c.name.toLowerCase().includes(projClient.toLowerCase()) && c.name.toLowerCase() !== projClient.toLowerCase())
    : [];

  // Tag form values
  const [tagName, setTagName] = useState<string>('');

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    onUpdateSingleProject(projName.trim(), projClient.trim() || undefined, projColor);
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    onAddTag(tagName.trim());
    setTagName('');
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full z-10">
      {/* Page Header */}
      <header className="shrink-0">
        <h2 className="text-xl font-display font-semibold text-white">
          Preferences & Management
        </h2>
        <p className="text-xs text-[#ecd0b9]/75 mt-1">
          Customize project boards, log tags, and day-to-day productivity metrics
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Section 1: Single Project Identity Management */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#3e271a]/40 pb-4">
              <div className="flex items-center gap-2.5">
                <FolderPlus className="h-5.5 w-5.5 text-[#dda67a]" />
                <div>
                  <h3 className="text-sm font-sans font-bold text-white">Project Identity & Branding</h3>
                  <p className="text-[10px] text-[#ecd0b9]/50 font-mono hidden md:block">WORKSPACE CONSTANT ALIGNMENT</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-[#dda67a]/10 text-[#dda67a] border border-[#dda67a]/20 uppercase tracking-widest font-bold font-semibold">
                Singular Client Alignment
              </span>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-semibold text-[#ecd0b9]/75 block font-sans">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arrived Web App"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] focus:border-[#dda67a] outline-none transition font-medium font-sans"
                  />
                </div>
                
                <div className="space-y-1.5 flex flex-col justify-end relative">
                  <label className="text-xs font-semibold text-[#ecd0b9]/75 block font-sans">Client / Account Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Arrived Technologies"
                    value={projClient}
                    onChange={(e) => {
                      setProjClient(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full text-xs p-3 rounded-xl border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] focus:border-[#dda67a] outline-none transition font-medium font-sans"
                  />
                  {showSuggestions && filteredContacts.length > 0 && (
                    <div className="absolute top-[102%] left-0 w-full bg-[#1c120c] border border-[#3e271a] rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto p-1.5 space-y-1">
                      <p className="text-[10px] text-[#ecd0b9]/40 font-mono px-2 py-1 uppercase tracking-wider font-semibold">Suggested from Google Contacts</p>
                      {filteredContacts.slice(0, 5).map((contact) => (
                        <button
                          type="button"
                          key={contact.email}
                          onClick={() => {
                            setProjClient(contact.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left text-xs p-2 rounded-lg hover:bg-[#2d1b11]/80 text-[#ecd0b9] hover:text-white transition flex items-center gap-2"
                        >
                          {contact.photoUrl ? (
                            <img src={contact.photoUrl} alt="" className="h-5 w-5 rounded-full" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-[#dda67a]/20 flex items-center justify-center text-[10px] font-bold text-[#dda67a]">
                              {contact.name[0]}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{contact.name}</p>
                            <p className="text-[10px] text-[#ecd0b9]/50 truncate">{contact.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-semibold text-[#ecd0b9]/75 block font-sans">Theme Color Indicator</label>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1c120c]/60 p-3 rounded-xl border border-[#3e271a]/40">
                  <div className="flex gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setProjColor(color)}
                        className={`h-5.5 w-5.5 rounded-full border border-black/30 cursor-pointer shrink-0 transition relative ${projColor === color ? 'scale-110 ring-2 ring-[#dda67a]' : 'opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      >
                        {projColor === color && (
                          <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-[#dda67a] hover:bg-[#c38e62] text-[#1c120c] font-bold cursor-pointer shrink-0 shadow-lg transition flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Project Name</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Real Google Contacts List (Synced via OAuth) */}
          <div className="bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5 p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#3e271a]/40 pb-4">
              <Users className="h-5.5 w-5.5 text-[#dda67a]" />
              <div>
                <h3 className="text-sm font-sans font-bold text-white">Google Contacts List</h3>
                <p className="text-[10px] text-[#ecd0b9]/50 font-mono">AUTHORIZED VIA READONLY PEOPLE API</p>
              </div>
            </div>

            {contacts.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-[#ecd0b9]/70 leading-relaxed font-sans">
                  We found <strong className="text-white">{contacts.length}</strong> Google Contacts connected to your Gmail space. Click a contact card below to immediately select them as the billing client / account name.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {contacts.slice(0, 10).map((contact) => (
                    <button 
                      type="button"
                      key={contact.email}
                      className="p-3 bg-[#1d1410]/50 hover:bg-[#251913]/60 border border-[#3e271a]/30 hover:border-[#dda67a]/30 rounded-xl transition flex items-center gap-3 group cursor-pointer text-left w-full"
                      onClick={() => setProjClient(contact.name)}
                      title="Click to select this contact as client"
                    >
                      {contact.photoUrl ? (
                        <img 
                          src={contact.photoUrl} 
                          alt="" 
                          className="h-9 w-9 rounded-full border border-[#3e271a]/70 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-[#dda67a]/15 border border-[#dda67a]/20 flex items-center justify-center text-xs font-bold text-[#dda67a] font-sans shrink-0">
                          {contact.name[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#dda67a] transition">{contact.name}</h4>
                        <p className="text-[10px] text-[#ecd0b9]/50 font-mono truncate">{contact.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {contacts.length > 10 && (
                  <div className="text-center text-[10px] text-[#ecd0b9]/40 font-mono pt-1">
                    + {contacts.length - 10} additional contacts synced from your Google Account
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-[#1c120c] border border-[#3e271a] flex items-center justify-center text-[#ecd0b9]/40 mx-auto">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-white font-sans">No Google Contacts Loaded Yet</h4>
                <p className="text-[11px] text-[#ecd0b9]/50 max-w-xs mx-auto leading-relaxed">
                  Log in with Google to synchronize live contacts, or check that your account has contacts configured at google.contacts.com.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Column 2: Tags & Quick configuration */}
        <div className="space-y-6">
          
          {/* Active Tags list */}
          <div className="bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5 p-5">
            <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-[#dda67a]" />
              <span>Workspace Tags</span>
            </h3>

            {/* Inline creation */}
            <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                placeholder="New tag name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] focus:border-[#dda67a] outline-none transition"
              />
              <button
                type="submit"
                className="py-2 px-3.5 bg-[#a66e46] hover:bg-[#8e5a34] text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 flex items-center transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
              {tags.map(t => (
                <div 
                  key={t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#3e271a]/45 bg-[#211510]/55 text-xs text-[#ecd0b9] hover:bg-[#2d1b14]/75 transition cursor-default"
                >
                  <span className="font-semibold">{t.name}</span>
                  <button 
                    onClick={() => onDeleteTag(t.id)}
                    className="text-[#ecd0b9]/40 hover:text-red-450 hover:text-red-400 cursor-pointer font-bold transition text-xs pl-0.5"
                    title="Remove Tag"
                  >
                    ×
                  </button>
                </div>
              ))}

              {tags.length === 0 && (
                <div className="text-center w-full py-4 text-xs text-[#ecd0b9]/40 font-mono">No active tags.</div>
              )}
            </div>
          </div>



          {/* Productivity Target parameters */}
          <div className="bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl shadow-xl shadow-black/5 p-5">
            <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#dda67a]" />
              <span>Daily Target</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#ecd0b9]/75">Workday Target hours:</span>
                  <span className="font-mono font-bold text-[#dda67a]">{workdayTargetHours} hrs/day</span>
                </div>
                
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="1"
                  value={workdayTargetHours}
                  onChange={(e) => onUpdateTargetHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1d1410] rounded-lg appearance-none cursor-pointer accent-[#a66e46] border border-[#3e271a]/40"
                />
              </div>

              {/* Informational helpful tip */}
              <div className="p-3.5 bg-[#dda67a]/10 border border-[#dda67a]/20 rounded-xl flex items-start gap-2.5 text-xs text-[#ecd0b9] leading-relaxed font-semibold">
                <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#dda67a]" />
                <p>
                  Setting a daily workday benchmark marks visual indicators in the scheduling calendar so you instantly spotted lagging days.
                </p>
              </div>

              {/* Secure Session Info & Sign Out */}
              <div className="pt-4 border-t border-[#3e271a]/40 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-green-500 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Secure Access Identity</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-[#1d1410]/75 border border-[#3e271a]/50 rounded-xl">
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full border border-green-500/35 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-[#ecd0b9]/50 font-mono truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full text-center py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-950/10 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-semibold tracking-wider uppercase font-sans transition cursor-pointer"
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
