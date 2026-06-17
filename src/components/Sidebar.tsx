import React from 'react';
import { 
  Clock, 
  FileBarChart2, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';
import { PageView, UserProfile } from '../types';
import BrandLogo from './BrandLogo';
import packageJson from '../../package.json';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentView: PageView;
  onViewChange: (view: PageView) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  logoStyle: 'classic' | 'minimalist' | 'hourglass';
  onLogoStyleChange: (style: 'classic' | 'minimalist' | 'hourglass') => void;
  projectName: string;
  user: UserProfile;
  onLogout: () => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  theme, 
  onThemeToggle,
  logoStyle,
  onLogoStyleChange,
  projectName,
  user,
  onLogout
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const navItems = [
    { id: 'calendar' as PageView, label: 'Calendar', icon: Clock },
    { id: 'reports' as PageView, label: 'Reports', icon: FileBarChart2 },
    { id: 'settings' as PageView, label: 'Settings', icon: Settings },
  ];

  const cycleLogo = () => {
    const sequence: ('classic' | 'minimalist' | 'hourglass')[] = ['classic', 'minimalist', 'hourglass'];
    const nextIdx = (sequence.indexOf(logoStyle) + 1) % sequence.length;
    onLogoStyleChange(sequence[nextIdx]);
  };

  return (
    <>
      {/* ========== MOBILE BOTTOM NAV BAR (< md) ========== */}
      <nav 
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#110a08]/90 backdrop-blur-2xl border-t border-[#2a1b12]/60 pb-safe"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl min-w-[64px] transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'text-[#dda67a]'
                    : 'text-[#bdae9c]/50 active:text-[#bdae9c]/80'
                  }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'stroke-[2.25px] scale-110' : 'stroke-[1.75px]'}`} />
                  {isActive && (
                    <motion.span 
                      layoutId="mobileNavActiveDot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#dda67a]" 
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${isActive ? 'text-[#dda67a]' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* User avatar button for logout */}
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl min-w-[64px] cursor-pointer text-[#bdae9c]/50 active:text-red-400 transition-all duration-200"
            title="Sign out"
          >
            <img 
              src={user.picture} 
              alt={user.name} 
              className="h-5 w-5 rounded-full border border-[#dda67a]/20"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] font-semibold tracking-wide">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ========== DESKTOP SIDEBAR (≥ md) ========== */}
      <aside 
        id="sidebar-nav" 
        className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-64'} border-r flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-20 relative h-screen
          bg-[#110a08]/40 backdrop-blur-3xl border-[#2a1b12]/50`}
      >
        {/* Floating Collapse/Expand trigger button exactly on the dividing border line */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full border border-[#2a1b12] bg-[#1c120c] hover:bg-[#2d1b11] text-[#ecd0b9] hover:text-white flex items-center justify-center shadow-md shadow-black/80 transition-all hover:scale-110 duration-200 z-50 cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className="flex flex-col">
          {/* Header area with collapsible toggle */}
          <div className="border-b border-[#2a1b12]/50 p-5 flex items-center">
            <div 
              onClick={cycleLogo}
              title="Click to cycle logo style!"
              className="flex items-center gap-3 cursor-pointer select-none w-full min-w-0"
            >
              {logoStyle === 'classic' && (
                <>
                  <div className="h-10 w-12 rounded-xl bg-[#201410] border border-[#3d2416]/55 flex items-center justify-center p-1 shadow-md shadow-black/30 shrink-0 transition-transform duration-200 hover:scale-105 overflow-hidden">
                    <BrandLogo size={22} className="brightness-125 select-none pointer-events-none" />
                  </div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0, x: -10 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="min-w-0 flex-1 ml-1 overflow-hidden"
                      >
                        <h1 className="font-sans font-semibold text-base leading-none tracking-tight text-white whitespace-nowrap">
                          Tyme
                        </h1>
                        <p className="text-[9px] font-mono text-[#ecd0b9]/60 tracking-wider uppercase mt-1 truncate max-w-[120px]" title={projectName}>
                          {projectName || 'Espresso'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {logoStyle === 'minimalist' && (
                <>
                  <div className="h-10 w-12 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105">
                    <BrandLogo size={24} className="brightness-110 select-none pointer-events-none" />
                  </div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0, x: -10 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="min-w-0 flex-1 ml-1 overflow-hidden"
                      >
                        <h1 className="font-sans font-semibold text-[10px] leading-none tracking-[0.2em] uppercase text-[#ecd0b9] whitespace-nowrap">
                          T y m e
                        </h1>
                        <p className="text-[8px] font-mono text-[#ecd0b9]/45 tracking-widest uppercase mt-1 truncate max-w-[120px]" title={projectName}>
                          {projectName || 'Swiss'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {logoStyle === 'hourglass' && (
                <>
                  <div className="h-10 w-12 rounded-xl bg-gradient-to-tr from-[#2d1b11] via-[#1a110a] to-[#0d0705] border border-[#dda67a]/20 flex items-center justify-center p-1 shadow shadow-[#dda67a]/10 shrink-0 transition-transform duration-200 hover:scale-105 overflow-hidden">
                    <BrandLogo size={22} className="brightness-125 select-none pointer-events-none" />
                  </div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0, x: -10 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="min-w-0 flex-1 ml-1 overflow-hidden"
                      >
                        <h1 className="font-sans font-bold text-base leading-none tracking-tight text-white flex items-center gap-1 whitespace-nowrap">
                          tyme<span className="h-1.5 w-1.5 rounded-full bg-[#dda67a] animate-pulse"></span>
                        </h1>
                        <p className="text-[8px] font-mono text-[#ecd0b9]/60 tracking-widest uppercase mt-1 truncate max-w-[120px]" title={projectName}>
                          {projectName || 'Clock'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
   
          {/* Navigation list */}
          <nav className="p-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-link-${item.id}`}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center rounded-xl font-medium text-sm transition-all duration-300 cursor-pointer text-left border relative
                    ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
                    ${isActive
                      ? 'text-[#ecd0b9] border-[#5e3820]/60 shadow-lg shadow-black/10'
                      : 'border-transparent text-[#bdae9c]/70 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm'
                    }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBackground"
                      className="absolute inset-0 bg-[#2d1b11]/60 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 relative z-10 ${isActive ? 'stroke-[2.25px] text-[#dda67a]' : 'stroke-[1.75px]'}`} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0, x: -5 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -5 }}
                        transition={{ duration: 0.15 }}
                        className="truncate whitespace-nowrap flex-1 ml-1 relative z-10 overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </nav>
        </div>
   
        {/* Footer Details - User Name, Sync info & Logout Button */}
        <div className="p-4 border-t border-[#2a1b12]/50 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between bg-[#130d0a]/30 border border-[#2a1b12]/30 p-2 rounded-xl min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={user.picture} 
                alt={user.name} 
                className="h-8 w-8 rounded-full border border-[#dda67a]/20 shrink-0 cursor-help"
                title={`${user.name} (${user.email})`}
                referrerPolicy="no-referrer"
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, x: -10 }}
                    animate={{ opacity: 1, width: 'auto', x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="min-w-0 flex-1 ml-1 overflow-hidden"
                  >
                    <p className="text-xs font-bold text-white truncate max-w-[100px]" title={user.name}>
                      {user.name}
                    </p>
                    <p className="text-[9px] font-mono text-[#ecd0b9]/40 truncate max-w-[100px]" title={user.email}>
                      {user.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <AnimatePresence>
              {!isCollapsed && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={onLogout}
                  className="p-1.5 rounded-lg border border-transparent hover:border-red-500/20 text-[#ecd0b9]/50 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shrink-0 ml-1 hover:scale-105 duration-100"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {isCollapsed && (
            <div className="flex justify-center transition-all duration-300">
              <button
                onClick={onLogout}
                className="p-2 rounded-xl border border-[#2a1b12]/60 hover:border-red-500/20 bg-[#1c120c] hover:bg-red-500/10 text-[#ecd0b9]/60 hover:text-red-400 transition-all duration-200 cursor-pointer hover:scale-105 shadow-md"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className={`flex justify-between items-center px-1 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <span className="text-[10px] font-mono text-[#ecd0b9]/40">
              v{packageJson.version}
            </span>
            <span className={`text-[10px] font-mono text-[#ecd0b9]/40 uppercase tracking-widest transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              Dark Mode
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
