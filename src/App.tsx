import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import LoginScreen from './components/LoginScreen';
import { Toaster, toast } from 'sonner';
import { TimeEntry, Project, Tag, PageView, UserProfile } from './types';
import {
  initAuth,
  logoutUser,
  subscribeToUserProfile,
  saveUserProfileToFS,
  subscribeToProjects,
  saveProjectToFS,
  subscribeToTags,
  saveTagToFS,
  deleteTagFromFS,
  subscribeToEntries,
  saveEntryToFS,
  deleteEntryFromFS,
  fetchGoogleContacts,
  GoogleContact
} from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  const [currentView, setCurrentView] = useState<PageView>('calendar');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core visual settings
  const [logoStyle, setLogoStyle] = useState<'classic' | 'minimalist' | 'hourglass'>('classic');
  const [workdayTargetHours, setWorkdayTargetHours] = useState<number>(8);

  const theme = 'dark';

  // Subscribed States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  // Real Google contacts list fetched from People API
  const [contacts, setContacts] = useState<GoogleContact[]>([]);

  // 1. Initialize Auth on mount
  useEffect(() => {
    const unsubscribeAuth = initAuth((user, token) => {
      setFirebaseUser(user);
      setUser({
        name: user.displayName || 'Tyme User',
        email: user.email || '',
        picture: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || 'tyme')}`
      });
      setAuthLoading(false);

      // Async fetch real Google Contacts to integrate with the Client list
      fetchGoogleContacts().then((results) => {
        setContacts(results);
      });
    }, () => {
      setFirebaseUser(null);
      setUser(null);
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Realtime state subscriptions when firebaseUser is authenticated
  useEffect(() => {
    if (!firebaseUser) return;

    const uid = firebaseUser.uid;

    // A. Subscribe to user profile settings
    const unsubProfile = subscribeToUserProfile(uid, (data) => {
      if (data.logoStyle) setLogoStyle(data.logoStyle);
      if (data.workdayTargetHours) setWorkdayTargetHours(data.workdayTargetHours);
    });

    // Seed/Save initial profile if not in DB yet
    saveUserProfileToFS(uid, {
      name: firebaseUser.displayName || 'Tyme User',
      email: firebaseUser.email || '',
      picture: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.email || 'tyme')}`
    });

    // B. Subscribe to Projects
    const unsubProjects = subscribeToProjects(uid, (projs) => {
      setProjects(projs);
    });

    // C. Subscribe to Tags
    const unsubTags = subscribeToTags(uid, (tgs) => {
      setTags(tgs);
    });

    // D. Subscribe to Entries
    const unsubEntries = subscribeToEntries(uid, (ents) => {
      setEntries(ents);
    });

    return () => {
      unsubProfile();
      unsubProjects();
      unsubTags();
      unsubEntries();
    };
  }, [firebaseUser]);

  const handleLogin = (profile: UserProfile) => {
    // This is called when the direct signIn completes successfully inside LoginScreen
    setUser(profile);
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    await logoutUser();
    setUser(null);
    setFirebaseUser(null);
    setProjects([]);
    setTags([]);
    setEntries([]);
    setContacts([]);
    setAuthLoading(false);
  };

  const saveLogoStyle = async (style: 'classic' | 'minimalist' | 'hourglass') => {
    setLogoStyle(style);
    if (firebaseUser) {
      await saveUserProfileToFS(firebaseUser.uid, { logoStyle: style });
    }
  };

  const saveTargetHours = async (hours: number) => {
    setWorkdayTargetHours(hours);
    if (firebaseUser) {
      await saveUserProfileToFS(firebaseUser.uid, { workdayTargetHours: hours });
    }
  };

  // --- Core CRUD Handlers synced to Cloud Firestore ---

  // Add new time entry
  const handleAddEntry = async (entryData: Omit<TimeEntry, 'id'>) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    if (firebaseUser) {
      await saveEntryToFS(firebaseUser.uid, newEntry);
    }
  };

  // Update existing time entry
  const handleUpdateEntry = async (updated: TimeEntry) => {
    if (firebaseUser) {
      await saveEntryToFS(firebaseUser.uid, updated);
    }
  };

  // Delete time entry
  const handleDeleteEntry = async (id: string) => {
    if (firebaseUser) {
      const entryToDelete = entries.find(e => e.id === id);
      const description = entryToDelete?.description || 'Task';
      try {
        await deleteEntryFromFS(firebaseUser.uid, id);
        toast.success("Task deleted successfully", {
          description: `"${description}" has been removed.`,
          duration: 3000
        });
      } catch (err) {
        toast.error("Failed to delete task. Please check your connection.");
      }
    }
  };

  // Edit the singular workspace project
  const handleUpdateSingleProject = async (name: string, client?: string, color?: string) => {
    if (!firebaseUser) return;
    
    const activeProj = projects[0] || {
      id: 'proj-1',
      name: '',
      client: '',
      color: '#dda67a'
    };

    const updatedProj: Project = {
      id: activeProj.id,
      name,
      client: client || '',
      color: color || activeProj.color
    };

    await saveProjectToFS(firebaseUser.uid, updatedProj);
  };

  // Add new Tag
  const handleAddTag = (name: string): Tag => {
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name
    };
    if (firebaseUser) {
      saveTagToFS(firebaseUser.uid, newTag);
    }
    return newTag;
  };

  // Delete Tag
  const handleDeleteTag = async (id: string) => {
    if (!firebaseUser) return;
    const tagToDelete = tags.find(t => t.id === id);
    if (tagToDelete) {
      // Clean entries of matching tag references
      const nextEntries = entries.map(e => ({
        ...e,
        tags: e.tags.filter(t => t !== tagToDelete.name)
      }));
      for (const entry of nextEntries) {
        await saveEntryToFS(firebaseUser.uid, entry);
      }
    }
    await deleteTagFromFS(firebaseUser.uid, id);
  };

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
        onViewChange={setCurrentView}
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
        {currentView === 'calendar' && (
          <CalendarView 
            entries={entries}
            projects={projects}
            tags={tags}
            onAddEntry={handleAddEntry}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onAddProject={(name, color, client) => ({ id: 'proj-dummy', name, color, client })} // Singular project locked
            onAddTag={handleAddTag}
            theme={theme}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView 
            entries={entries}
            projects={projects}
            tags={tags}
            onDeleteEntry={handleDeleteEntry}
            onDuplicateEntry={handleAddEntry}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView 
            projects={projects}
            tags={tags}
            onUpdateSingleProject={handleUpdateSingleProject}
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
            workdayTargetHours={workdayTargetHours}
            onUpdateTargetHours={saveTargetHours}
            logoStyle={logoStyle}
            onLogoStyleChange={saveLogoStyle}
            user={user}
            onLogout={handleLogout}
            contacts={contacts}
          />
        )}
      </main>
      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}
