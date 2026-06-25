'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TimeEntry, Project, Tag, UserProfile } from '@/types';
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
  GoogleContact,
} from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type LogoStyle = 'classic' | 'minimalist' | 'hourglass';

interface TymeContextValue {
  // Auth / session
  user: UserProfile | null;
  authLoading: boolean;
  handleLogin: (profile: UserProfile) => void;
  handleLogout: () => Promise<void>;

  // Visual settings
  theme: 'dark';
  logoStyle: LogoStyle;
  saveLogoStyle: (style: LogoStyle) => Promise<void>;
  workdayTargetHours: number;
  saveTargetHours: (hours: number) => Promise<void>;
  hourlyRate: number;
  saveHourlyRate: (rate: number) => Promise<void>;

  // Synced data
  projects: Project[];
  tags: Tag[];
  entries: TimeEntry[];
  contacts: GoogleContact[];

  // CRUD handlers
  handleAddEntry: (entryData: Omit<TimeEntry, 'id'>) => Promise<void>;
  handleUpdateEntry: (updated: TimeEntry) => Promise<void>;
  handleDeleteEntry: (id: string) => Promise<void>;
  handleUpdateSingleProject: (name: string, client?: string, color?: string) => Promise<void>;
  handleAddTag: (name: string) => Tag;
  handleDeleteTag: (id: string) => Promise<void>;
}

const TymeContext = createContext<TymeContextValue | null>(null);

export function useTyme(): TymeContextValue {
  const ctx = useContext(TymeContext);
  if (!ctx) throw new Error('useTyme must be used within <TymeProvider>');
  return ctx;
}

export function TymeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core visual settings
  const [logoStyle, setLogoStyle] = useState<LogoStyle>('classic');
  const [workdayTargetHours, setWorkdayTargetHours] = useState<number>(8);
  const [hourlyRate, setHourlyRate] = useState<number>(1);

  const theme = 'dark' as const;

  // Subscribed States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  // Real Google contacts list fetched from People API
  const [contacts, setContacts] = useState<GoogleContact[]>([]);

  // 1. Initialize Auth on mount
  useEffect(() => {
    const unsubscribeAuth = initAuth((user) => {
      setSupabaseUser(user);
      setUser({
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'Tyme User',
        email: user.email || '',
        picture: user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || 'tyme')}`,
      });
      setAuthLoading(false);

      // Async fetch real Google Contacts to integrate with the Client list
      fetchGoogleContacts().then((results) => {
        setContacts(results);
      });
    }, () => {
      setSupabaseUser(null);
      setUser(null);
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Realtime state subscriptions when supabaseUser is authenticated
  useEffect(() => {
    if (!supabaseUser) return;

    const uid = supabaseUser.id;

    // A. Subscribe to user profile settings
    const unsubProfile = subscribeToUserProfile(uid, (data) => {
      if (data.logoStyle) setLogoStyle(data.logoStyle);
      if (data.workdayTargetHours) setWorkdayTargetHours(data.workdayTargetHours);
      if (data.hourlyRate !== undefined) setHourlyRate(data.hourlyRate);
    });

    // Seed/Save initial profile if not in DB yet
    saveUserProfileToFS(uid, {
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'Tyme User',
      email: supabaseUser.email || '',
      picture: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(supabaseUser.email || 'tyme')}`,
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
  }, [supabaseUser]);

  const handleLogin = (profile: UserProfile) => {
    // This is called when the direct signIn completes successfully inside LoginScreen
    setUser(profile);
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    await logoutUser();
    setUser(null);
    setSupabaseUser(null);
    setProjects([]);
    setTags([]);
    setEntries([]);
    setContacts([]);

    // Clear persisted timer state
    localStorage.removeItem('tyme_timer_is_tracking');
    localStorage.removeItem('tyme_timer_desc');
    localStorage.removeItem('tyme_timer_proj_id');
    localStorage.removeItem('tyme_timer_tags');
    localStorage.removeItem('tyme_timer_start_time');

    setAuthLoading(false);
  };

  const saveLogoStyle = async (style: LogoStyle) => {
    setLogoStyle(style);
    if (supabaseUser) {
      await saveUserProfileToFS(supabaseUser.id, { logoStyle: style });
    }
  };

  const saveTargetHours = async (hours: number) => {
    setWorkdayTargetHours(hours);
    if (supabaseUser) {
      await saveUserProfileToFS(supabaseUser.id, { workdayTargetHours: hours });
    }
  };

  const saveHourlyRate = async (rate: number) => {
    setHourlyRate(rate);
    if (supabaseUser) {
      await saveUserProfileToFS(supabaseUser.id, { hourlyRate: rate });
    }
  };

  // --- Core CRUD Handlers synced to Supabase ---

  // Add new time entry
  const handleAddEntry = async (entryData: Omit<TimeEntry, 'id'>) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    if (supabaseUser) {
      await saveEntryToFS(supabaseUser.id, newEntry);
    }
  };

  // Update existing time entry
  const handleUpdateEntry = async (updated: TimeEntry) => {
    if (supabaseUser) {
      await saveEntryToFS(supabaseUser.id, updated);
    }
  };

  // Delete time entry
  const handleDeleteEntry = async (id: string) => {
    if (supabaseUser) {
      const entryToDelete = entries.find(e => e.id === id);
      const description = entryToDelete?.description || 'Task';
      try {
        await deleteEntryFromFS(supabaseUser.id, id);
        toast.success('Task deleted successfully', {
          description: `"${description}" has been removed.`,
          duration: 3000,
        });
      } catch {
        toast.error('Failed to delete task. Please check your connection.');
      }
    }
  };

  // Edit the singular workspace project
  const handleUpdateSingleProject = async (name: string, client?: string, color?: string) => {
    if (!supabaseUser) return;

    const activeProj = projects[0] || {
      id: 'proj-1',
      name: '',
      client: '',
      color: '#dda67a',
    };

    const updatedProj: Project = {
      id: activeProj.id,
      name,
      client: client || '',
      color: color || activeProj.color,
    };

    await saveProjectToFS(supabaseUser.id, updatedProj);
  };

  // Add new Tag
  const handleAddTag = (name: string): Tag => {
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name,
    };
    if (supabaseUser) {
      saveTagToFS(supabaseUser.id, newTag);
    }
    return newTag;
  };

  // Delete Tag
  const handleDeleteTag = async (id: string) => {
    if (!supabaseUser) return;
    const tagToDelete = tags.find(t => t.id === id);
    if (tagToDelete) {
      // Clean entries of matching tag references
      const nextEntries = entries.map(e => ({
        ...e,
        tags: e.tags.filter(t => t !== tagToDelete.name),
      }));
      for (const entry of nextEntries) {
        await saveEntryToFS(supabaseUser.id, entry);
      }
    }
    await deleteTagFromFS(supabaseUser.id, id);
  };

  const value: TymeContextValue = {
    user,
    authLoading,
    handleLogin,
    handleLogout,
    theme,
    logoStyle,
    saveLogoStyle,
    workdayTargetHours,
    saveTargetHours,
    hourlyRate,
    saveHourlyRate,
    projects,
    tags,
    entries,
    contacts,
    handleAddEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleUpdateSingleProject,
    handleAddTag,
    handleDeleteTag,
  };

  return <TymeContext.Provider value={value}>{children}</TymeContext.Provider>;
}
