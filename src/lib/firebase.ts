import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Project, Tag, TimeEntry, UserProfile } from '../types';

// Initialize the single Firebase instance (Enterprise edition)
const app = initializeApp(firebaseConfig);

// The metadata mentions databaseId is: ai-studio-2f5fed5d-b280-4d1c-aa74-fc396cd58da3
export const db = getFirestore(app, 'ai-studio-2f5fed5d-b280-4d1c-aa74-fc396cd58da3');
export const auth = getAuth(app);

// Configure Google OAuth Provider with requested scopes (Contacts and Profile info)
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

// In-memory token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Connection test on start (as required by Firestore critical guidelines)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore configuration issue: client is offline');
    }
  }
}
testConnection();

// Error logger mirroring secure error objects required by System guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    }
  };
  console.error('Firestore Secure Diagnostic Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Subscribe to auth state changes and manage token caching
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Trigger secure Firebase Google popup flow
export const googleSignIn = async () => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google authorization failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Revoke session
export const logoutUser = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Fetch real Google Contacts using the registered access token
export interface GoogleContact {
  name: string;
  email: string;
  photoUrl?: string;
}

export async function fetchGoogleContacts(): Promise<GoogleContact[]> {
  if (!cachedAccessToken) {
    console.warn('Cannot fetch Google Contacts: No access token available');
    return [];
  }

  try {
    const res = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=100',
      {
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
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

// --- Data Synchronization (Firestore Operations) ---

// Realtime User Document State
export const subscribeToUserProfile = (
  userId: string,
  onUpdate: (userData: UserProfile & { workdayTargetHours: number; logoStyle: 'classic' | 'minimalist' | 'hourglass'; hourlyRate: number }) => void
) => {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, path),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          email: data.email || '',
          name: data.name || '',
          picture: data.picture || '',
          workdayTargetHours: data.workdayTargetHours ?? 8,
          logoStyle: data.logoStyle ?? 'classic',
          hourlyRate: data.hourlyRate ?? 1
        });
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
};

// Set User profile settings
export const saveUserProfileToFS = async (
  userId: string,
  profile: Partial<UserProfile & { workdayTargetHours: number; logoStyle: string; hourlyRate: number }>
) => {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, path), profile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

// Subscriptions for Projects
export const subscribeToProjects = (userId: string, onUpdate: (projects: Project[]) => void) => {
  const path = `users/${userId}/projects`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        projects.push({
          id: doc.id,
          name: d.name,
          client: d.client,
          color: d.color
        });
      });
      onUpdate(projects);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
};

// Save Project
export const saveProjectToFS = async (userId: string, project: Project) => {
  const path = `users/${userId}/projects/${project.id}`;
  try {
    await setDoc(doc(db, path), {
      id: project.id,
      userId,
      name: project.name,
      client: project.client || '',
      color: project.color
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

// Subscriptions for Tags
export const subscribeToTags = (userId: string, onUpdate: (tags: Tag[]) => void) => {
  const path = `users/${userId}/tags`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const tags: Tag[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        tags.push({
          id: doc.id,
          name: d.name
        });
      });
      onUpdate(tags);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
};

// Save Tag
export const saveTagToFS = async (userId: string, tag: Tag) => {
  const path = `users/${userId}/tags/${tag.id}`;
  try {
    await setDoc(doc(db, path), {
      id: tag.id,
      userId,
      name: tag.name
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

// Delete Tag
export const deleteTagFromFS = async (userId: string, tagId: string) => {
  const path = `users/${userId}/tags/${tagId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

// Subscriptions for Entries
export const subscribeToEntries = (userId: string, onUpdate: (entries: TimeEntry[]) => void) => {
  const path = `users/${userId}/entries`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const entries: TimeEntry[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        entries.push({
          id: doc.id,
          description: d.description,
          projectId: d.projectId,
          tags: d.tags || [],
          date: d.date,
          startTime: d.startTime,
          endTime: d.endTime,
          durationMinutes: d.durationMinutes
        });
      });
      onUpdate(entries);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
};

// Save Time Entry
export const saveEntryToFS = async (userId: string, entry: TimeEntry) => {
  const path = `users/${userId}/entries/${entry.id}`;
  try {
    await setDoc(doc(db, path), {
      id: entry.id,
      userId,
      description: entry.description,
      projectId: entry.projectId || '',
      tags: entry.tags,
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      durationMinutes: entry.durationMinutes
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

// Delete Time Entry
export const deleteEntryFromFS = async (userId: string, entryId: string) => {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};
