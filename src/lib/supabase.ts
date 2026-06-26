import { createClient, User, Session, RealtimeChannel } from '@supabase/supabase-js';
import { Project, Tag, TimeEntry, UserProfile } from '../types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// In-memory provider token cache (for Google Contacts API)
let cachedProviderToken: string | null = null;

// Error handling (replaces handleFirestoreError)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  table: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleSupabaseError(error: unknown, operationType: OperationType, table: string | null) {
  const currentUser = supabase.auth.getUser();
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    table,
    authInfo: {
      userId: null,
      email: null,
    }
  };
  console.error('Supabase Diagnostic Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Authentication ---

// Subscribe to auth state changes
export const initAuth = (
  onAuthSuccess?: (user: User, providerToken: string | null) => void,
  onAuthFailure?: () => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event: string, session: Session | null) => {
      if (session?.user) {
        // Cache provider token if available (only present right after OAuth login)
        if (session.provider_token) {
          cachedProviderToken = session.provider_token;
        }
        if (onAuthSuccess) {
          onAuthSuccess(session.user, cachedProviderToken);
        }
      } else {
        cachedProviderToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
};

// Trigger Google OAuth (redirect-based).
// Returns the user straight into the app at /calendar after consent — used by both
// the public landing page button and the in-app LoginScreen. The matching
// `${origin}/calendar` URL must be present in Supabase Auth → URL Configuration →
// Redirect URLs (alongside the bare origin) or the callback will be rejected.
export const googleSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/calendar`,
      scopes: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/contacts.readonly',
    },
  });
  if (error) {
    console.error('Google authorization failed:', error);
    throw error;
  }
  // Note: This redirects the browser. The function won't return in the normal flow.
};

// Sign out
export const logoutUser = async () => {
  await supabase.auth.signOut();
  cachedProviderToken = null;
};

// --- Google Contacts (uses cached provider token) ---

export interface GoogleContact {
  name: string;
  email: string;
  photoUrl?: string;
}

export async function fetchGoogleContacts(): Promise<GoogleContact[]> {
  if (!cachedProviderToken) {
    console.warn('Cannot fetch Google Contacts: No provider token available');
    return [];
  }

  try {
    const res = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=100',
      {
        headers: {
          Authorization: `Bearer ${cachedProviderToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Google People API responded with status ${res.status}`);
    }

    const data = await res.json();
    const connections = data.connections || [];
    
    return connections.map((person: any) => {
      const nameObj = person.names?.[0] || {};
      const emailObj = person.emailAddresses?.[0] || {};
      const photoObj = person.photos?.[0] || {};

      return {
        name: nameObj.displayName || nameObj.givenName || 'Unnamed Contact',
        email: emailObj.value || '',
        photoUrl: photoObj.url || undefined,
      };
    }).filter((c: GoogleContact) => c.name || c.email);

  } catch (err) {
    console.error('Error querying Google Contacts API:', err);
    return [];
  }
}

// --- Data Synchronization (Supabase Operations) ---

// Helper: fetch + realtime subscription pattern
// On any change, re-fetches the full dataset (matches Firestore onSnapshot behavior)
function createRealtimeSubscription<T>(
  channelName: string,
  table: string,
  userId: string,
  fetchFn: () => Promise<T[]>,
  onUpdate: (data: T[]) => void
): () => void {
  // Initial fetch
  fetchFn().then(onUpdate).catch(err => {
    handleSupabaseError(err, OperationType.LIST, table);
  });

  // Subscribe to realtime changes
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: table === 'profiles' ? `id=eq.${userId}` : `user_id=eq.${userId}`,
      },
      () => {
        // Re-fetch full dataset on any change
        fetchFn().then(onUpdate).catch(err => {
          console.error(`Error re-fetching ${table}:`, err);
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to user profile
export const subscribeToUserProfile = (
  userId: string,
  onUpdate: (userData: UserProfile & { workdayTargetHours: number; logoStyle: 'classic' | 'minimalist' | 'hourglass'; hourlyRate: number }) => void
) => {
  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    if (data) {
      return [{
        email: data.email || '',
        name: data.name || '',
        picture: data.picture || '',
        workdayTargetHours: data.workday_target_hours ?? 8,
        logoStyle: (data.logo_style as 'classic' | 'minimalist' | 'hourglass') ?? 'classic',
        hourlyRate: data.hourly_rate ?? 1,
      }];
    }
    return [];
  };

  // Initial fetch
  fetchProfile().then(results => {
    if (results.length > 0) onUpdate(results[0]);
  });

  // Realtime subscription
  const channel = supabase
    .channel(`profile-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      () => {
        fetchProfile().then(results => {
          if (results.length > 0) onUpdate(results[0]);
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Save/update user profile
export const saveUserProfileToFS = async (
  userId: string,
  profile: Partial<UserProfile & { workdayTargetHours: number; logoStyle: string; hourlyRate: number }>
) => {
  try {
    // Map camelCase to snake_case
    const dbProfile: Record<string, any> = { id: userId };
    if (profile.email !== undefined) dbProfile.email = profile.email;
    if (profile.name !== undefined) dbProfile.name = profile.name;
    if (profile.picture !== undefined) dbProfile.picture = profile.picture;
    if (profile.workdayTargetHours !== undefined) dbProfile.workday_target_hours = profile.workdayTargetHours;
    if (profile.logoStyle !== undefined) dbProfile.logo_style = profile.logoStyle;
    if (profile.hourlyRate !== undefined) dbProfile.hourly_rate = profile.hourlyRate;

    // Check if the profile already exists.
    // We cannot use simple upsert for partial updates because PostgreSQL enforces NOT NULL constraints
    // (like email and name) on the INSERT portion of the upsert statement.
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId);

    if (fetchError) throw fetchError;

    if (data && data.length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(dbProfile)
        .eq('id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('profiles')
        .insert(dbProfile);
      if (error) throw error;
    }
  } catch (err) {
    handleSupabaseError(err, OperationType.WRITE, 'profiles');
  }
};

// Subscribe to projects
export const subscribeToProjects = (userId: string, onUpdate: (projects: Project[]) => void) => {
  const fetchProjects = async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      client: d.client,
      color: d.color,
    }));
  };

  return createRealtimeSubscription(
    `projects-${userId}`,
    'projects',
    userId,
    fetchProjects,
    onUpdate
  );
};

// Save project
export const saveProjectToFS = async (userId: string, project: Project) => {
  try {
    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        user_id: userId,
        name: project.name,
        client: project.client || '',
        color: project.color,
      }, { onConflict: 'id' });

    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, OperationType.WRITE, 'projects');
  }
};

// Subscribe to tags
export const subscribeToTags = (userId: string, onUpdate: (tags: Tag[]) => void) => {
  const fetchTags = async (): Promise<Tag[]> => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
    }));
  };

  return createRealtimeSubscription(
    `tags-${userId}`,
    'tags',
    userId,
    fetchTags,
    onUpdate
  );
};

// Save tag
export const saveTagToFS = async (userId: string, tag: Tag) => {
  try {
    const { error } = await supabase
      .from('tags')
      .upsert({
        id: tag.id,
        user_id: userId,
        name: tag.name,
      }, { onConflict: 'id' });

    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, OperationType.WRITE, 'tags');
  }
};

// Delete tag
export const deleteTagFromFS = async (userId: string, tagId: string) => {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, OperationType.DELETE, 'tags');
  }
};

// Subscribe to entries
export const subscribeToEntries = (userId: string, onUpdate: (entries: TimeEntry[]) => void) => {
  const fetchEntries = async (): Promise<TimeEntry[]> => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      description: d.description,
      projectId: d.project_id,
      tags: d.tags || [],
      date: d.date,
      startTime: d.start_time,
      endTime: d.end_time,
      durationMinutes: d.duration_minutes,
    }));
  };

  return createRealtimeSubscription(
    `entries-${userId}`,
    'entries',
    userId,
    fetchEntries,
    onUpdate
  );
};

// Save time entry
export const saveEntryToFS = async (userId: string, entry: TimeEntry) => {
  try {
    const { error } = await supabase
      .from('entries')
      .upsert({
        id: entry.id,
        user_id: userId,
        description: entry.description,
        project_id: entry.projectId || '',
        tags: entry.tags,
        date: entry.date,
        start_time: entry.startTime,
        end_time: entry.endTime,
        duration_minutes: entry.durationMinutes,
      }, { onConflict: 'id' });

    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, OperationType.WRITE, 'entries');
  }
};

// Delete time entry
export const deleteEntryFromFS = async (userId: string, entryId: string) => {
  try {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, OperationType.DELETE, 'entries');
  }
};
