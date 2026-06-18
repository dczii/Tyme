/**
 * Firebase → Supabase Data Migration Script
 * 
 * Migrates all user data from Firestore to Supabase PostgreSQL.
 * 
 * Prerequisites:
 *   1. Install temporary dependencies:
 *      npm install firebase-admin
 * 
 *   2. Download your Firebase service account key:
 *      Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 *      Save as: scripts/firebase-service-account.json
 * 
 *   3. Set your Supabase service role key (NOT anon key) as env var:
 *      export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 * 
 * Usage:
 *   npx tsx scripts/migrate-firebase-to-supabase.ts              # Dry run (default)
 *   npx tsx scripts/migrate-firebase-to-supabase.ts --execute     # Execute migration
 * 
 * After migration:
 *   npm uninstall firebase-admin    # Remove temporary dependency
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Configuration ---

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ejaxgpxbziftclwkfmri.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIREBASE_DATABASE_ID = 'ai-studio-2f5fed5d-b280-4d1c-aa74-fc396cd58da3';
const SERVICE_ACCOUNT_PATH = resolve(__dirname, 'firebase-service-account.json');

const DRY_RUN = !process.argv.includes('--execute');

// --- Helpers ---

interface MigrationStats {
  users: { found: number; migrated: number; errors: number };
  projects: { found: number; migrated: number; errors: number };
  tags: { found: number; migrated: number; errors: number };
  entries: { found: number; migrated: number; errors: number };
}

function createStats(): MigrationStats {
  return {
    users: { found: 0, migrated: 0, errors: 0 },
    projects: { found: 0, migrated: 0, errors: 0 },
    tags: { found: 0, migrated: 0, errors: 0 },
    entries: { found: 0, migrated: 0, errors: 0 },
  };
}

function log(message: string) {
  const prefix = DRY_RUN ? '[DRY RUN]' : '[MIGRATE]';
  console.log(`${prefix} ${message}`);
}

function logError(message: string, error?: unknown) {
  const prefix = DRY_RUN ? '[DRY RUN]' : '[MIGRATE]';
  console.error(`${prefix} ❌ ${message}`, error instanceof Error ? error.message : error || '');
}

// --- Validation ---

function validateConfig() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    console.error('   Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    console.error('   Find it in: Supabase Dashboard → Settings → API → service_role key');
    process.exit(1);
  }

  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`❌ Firebase service account key not found at: ${SERVICE_ACCOUNT_PATH}`);
    console.error('   Download it from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
    console.error(`   Save it as: ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
  }
}

// --- Migration Logic ---

async function migrate() {
  console.log('\n========================================');
  console.log('  Firebase → Supabase Data Migration');
  console.log('========================================\n');

  if (DRY_RUN) {
    console.log('🔍 Running in DRY RUN mode. No data will be written.');
    console.log('   Use --execute flag to perform the actual migration.\n');
  } else {
    console.log('⚡ Running in EXECUTE mode. Data will be written to Supabase.\n');
  }

  validateConfig();

  // Initialize Firebase Admin
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8')) as ServiceAccount;
  const firebaseApp = initializeApp({ credential: cert(serviceAccount) });
  const firestore = getFirestore(firebaseApp, FIREBASE_DATABASE_ID);

  // Initialize Supabase with service role key (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const stats = createStats();

  // --- Step 1: Read all users from Firestore ---
  log('Reading users from Firestore...');
  const usersSnapshot = await firestore.collection('users').get();
  stats.users.found = usersSnapshot.size;
  log(`Found ${usersSnapshot.size} user(s)`);

  // We need a mapping from Firebase UID to Supabase UUID
  // Since users will get new UUIDs when they sign in via Supabase,
  // we store data keyed by email so it can be matched after first login.
  // 
  // Strategy: Store migrated data with a placeholder UUID. When the user
  // signs in to Supabase for the first time, a trigger or app logic can
  // re-associate the data using their email.

  const userEmailToFirebaseUid = new Map<string, string>();

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const firebaseUid = userDoc.id;
    const email = userData.email;

    if (!email) {
      logError(`User ${firebaseUid} has no email, skipping`);
      stats.users.errors++;
      continue;
    }

    userEmailToFirebaseUid.set(email, firebaseUid);

    log(`  User: ${email} (Firebase UID: ${firebaseUid})`);
    log(`    Name: ${userData.name || 'N/A'}`);
    log(`    Workday Hours: ${userData.workdayTargetHours ?? 8}`);
    log(`    Logo Style: ${userData.logoStyle ?? 'classic'}`);
    log(`    Hourly Rate: ${userData.hourlyRate ?? 1}`);

    // --- Step 2: Read subcollections for this user ---

    // Projects
    const projectsSnapshot = await firestore.collection(`users/${firebaseUid}/projects`).get();
    stats.projects.found += projectsSnapshot.size;
    log(`    Projects: ${projectsSnapshot.size}`);
    for (const projDoc of projectsSnapshot.docs) {
      const proj = projDoc.data();
      log(`      - ${proj.name} (${proj.color})`);
    }

    // Tags
    const tagsSnapshot = await firestore.collection(`users/${firebaseUid}/tags`).get();
    stats.tags.found += tagsSnapshot.size;
    log(`    Tags: ${tagsSnapshot.size}`);
    for (const tagDoc of tagsSnapshot.docs) {
      const tag = tagDoc.data();
      log(`      - ${tag.name}`);
    }

    // Entries
    const entriesSnapshot = await firestore.collection(`users/${firebaseUid}/entries`).get();
    stats.entries.found += entriesSnapshot.size;
    log(`    Entries: ${entriesSnapshot.size}`);
    for (const entryDoc of entriesSnapshot.docs) {
      const entry = entryDoc.data();
      log(`      - ${entry.date} ${entry.startTime}-${entry.endTime}: ${entry.description}`);
    }

    // --- Step 3: Write to Supabase (if not dry run) ---
    if (!DRY_RUN) {
      // Check if user already exists in Supabase auth by email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        logError(`Failed to list Supabase auth users`, authError);
        stats.users.errors++;
        continue;
      }

      const supabaseUser = authUsers.users.find(u => u.email === email);

      if (!supabaseUser) {
        log(`    ⚠️  User ${email} has not signed in to Supabase yet. Skipping data migration.`);
        log(`    ℹ️  Data will be available after user signs in via Google OAuth.`);
        // Store data in a staging table or skip — for now, skip
        stats.users.errors++;
        continue;
      }

      const supabaseUid = supabaseUser.id;
      log(`    Mapped to Supabase UUID: ${supabaseUid}`);

      // Upsert profile
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: supabaseUid,
          email: userData.email,
          name: userData.name || 'Tyme User',
          picture: userData.picture || '',
          workday_target_hours: userData.workdayTargetHours ?? 8,
          logo_style: userData.logoStyle ?? 'classic',
          hourly_rate: userData.hourlyRate ?? 1,
        }, { onConflict: 'id' });
        if (error) throw error;
        stats.users.migrated++;
        log(`    ✅ Profile migrated`);
      } catch (err) {
        logError(`    Failed to migrate profile for ${email}`, err);
        stats.users.errors++;
      }

      // Upsert projects
      for (const projDoc of projectsSnapshot.docs) {
        const proj = projDoc.data();
        try {
          const { error } = await supabase.from('projects').upsert({
            id: projDoc.id,
            user_id: supabaseUid,
            name: proj.name,
            client: proj.client || '',
            color: proj.color,
          }, { onConflict: 'id' });
          if (error) throw error;
          stats.projects.migrated++;
        } catch (err) {
          logError(`    Failed to migrate project ${proj.name}`, err);
          stats.projects.errors++;
        }
      }

      // Upsert tags
      for (const tagDoc of tagsSnapshot.docs) {
        const tag = tagDoc.data();
        try {
          const { error } = await supabase.from('tags').upsert({
            id: tagDoc.id,
            user_id: supabaseUid,
            name: tag.name,
          }, { onConflict: 'id' });
          if (error) throw error;
          stats.tags.migrated++;
        } catch (err) {
          logError(`    Failed to migrate tag ${tag.name}`, err);
          stats.tags.errors++;
        }
      }

      // Upsert entries
      for (const entryDoc of entriesSnapshot.docs) {
        const entry = entryDoc.data();
        try {
          const { error } = await supabase.from('entries').upsert({
            id: entryDoc.id,
            user_id: supabaseUid,
            description: entry.description,
            project_id: entry.projectId || '',
            tags: entry.tags || [],
            date: entry.date,
            start_time: entry.startTime,
            end_time: entry.endTime,
            duration_minutes: entry.durationMinutes,
          }, { onConflict: 'id' });
          if (error) throw error;
          stats.entries.migrated++;
        } catch (err) {
          logError(`    Failed to migrate entry "${entry.description}"`, err);
          stats.entries.errors++;
        }
      }
    }
  }

  // --- Summary ---
  console.log('\n========================================');
  console.log('  Migration Summary');
  console.log('========================================\n');
  console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN' : '⚡ EXECUTE'}\n`);
  console.log('  | Entity   | Found | Migrated | Errors |');
  console.log('  |----------|-------|----------|--------|');
  console.log(`  | Users    | ${String(stats.users.found).padStart(5)} | ${String(stats.users.migrated).padStart(8)} | ${String(stats.users.errors).padStart(6)} |`);
  console.log(`  | Projects | ${String(stats.projects.found).padStart(5)} | ${String(stats.projects.migrated).padStart(8)} | ${String(stats.projects.errors).padStart(6)} |`);
  console.log(`  | Tags     | ${String(stats.tags.found).padStart(5)} | ${String(stats.tags.migrated).padStart(8)} | ${String(stats.tags.errors).padStart(6)} |`);
  console.log(`  | Entries  | ${String(stats.entries.found).padStart(5)} | ${String(stats.entries.migrated).padStart(8)} | ${String(stats.entries.errors).padStart(6)} |`);
  console.log('');

  if (DRY_RUN) {
    console.log('  ℹ️  This was a dry run. Run with --execute to perform the migration.');
  } else {
    const totalErrors = stats.users.errors + stats.projects.errors + stats.tags.errors + stats.entries.errors;
    if (totalErrors === 0) {
      console.log('  ✅ Migration completed successfully with no errors!');
    } else {
      console.log(`  ⚠️  Migration completed with ${totalErrors} error(s). Review logs above.`);
    }
  }
  console.log('');

  process.exit(0);
}

migrate().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
