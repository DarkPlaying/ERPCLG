import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing Supabase environment variables (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('----------------------------------------------------');
console.log('🚀 Supabase Realtime Notification Server Initialized');
console.log(`📡 Connected to: ${SUPABASE_URL}`);
console.log('----------------------------------------------------');

// Subscribe to new notifications inserted into the 'notifications' table
const channel = supabase
  .channel('table-db-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
    },
    async (payload) => {
      const newNotif = payload.new;
      console.log(`[Notification Dispatch] 🔔 New notification for user ${newNotif.user_id}:`);
      console.log(`   Title: "${newNotif.title}"`);
      console.log(`   Body:  "${newNotif.body}"`);
      console.log(`   Link:  "${newNotif.link || '/'}"`);
      console.log(`   Time:  ${new Date().toISOString()}`);
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Realtime listener active: Listening for notifications...');
    } else {
      console.log(`ℹ️ Realtime channel status: ${status}`);
    }
  });

process.on('SIGINT', async () => {
  console.log('\nShutting down Notification Server...');
  await supabase.removeChannel(channel);
  process.exit(0);
});
