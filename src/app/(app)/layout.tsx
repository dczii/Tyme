'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import Sidebar from '@/components/Sidebar';
import LoginScreen from '@/components/LoginScreen';
import { PageView } from '@/types';
import { useTyme } from '../providers';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    user,
    authLoading,
    handleLogin,
    handleLogout,
    theme,
    logoStyle,
    saveLogoStyle,
    projects,
  } = useTyme();

  // Derive the active page from the URL so the sidebar highlight stays in sync
  const currentView: PageView =
    pathname.startsWith('/reports') ? 'reports'
    : pathname.startsWith('/settings') ? 'settings'
    : 'calendar';

  // Global loading curtain during session check
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0c0806] text-[#ecd0b9]">
        <div className="flex flex-col items-center gap-3.5">
          <div className="h-6 w-6 border-2 border-[#dda67a]/20 border-t-[#dda67a] rounded-full animate-spin"></div>
          <span className="text-xs uppercase tracking-widest font-mono font-bold text-[#dda67a]/85">Syncing Workspace...</span>
        </div>
      </div>
    );
  }

  // Lock behind official Google OAuth
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

  return (
    <div
      id="app-root-container"
      className="min-h-screen flex flex-col md:flex-row text-slate-200 bg-[#0c0806] font-sans relative overflow-hidden dark"
    >
      {/* Animated/Glowing Background Shapes for Frosted Glass Espresso Theme */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[100px] pointer-events-none bg-[#4a2b16]/25 animate-pulse duration-5000"></div>
      <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none bg-[#9a6a42]/15 animate-pulse duration-7000"></div>
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full blur-[100px] pointer-events-none bg-[#2e1d13]/35 animate-pulse duration-6000"></div>

      {/* Sidebar navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => router.push(`/${view}`)}
        theme={theme}
        onThemeToggle={() => {}}
        logoStyle={logoStyle}
        onLogoStyleChange={saveLogoStyle}
        projectName={projects[0]?.name || 'Tyme Project'}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main page stage element */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        {children}
      </main>
      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}
