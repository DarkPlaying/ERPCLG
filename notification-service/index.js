import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing Supabase environment variables in notification-service.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 Supabase Notification Microservice Started');
console.log('Listening for database notification events...');

const channel = supabase
  .channel('notification-service-channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
    },
    async (payload) => {
      const item = payload.new;
      console.log(`[Notification Service] User: ${item.user_id} | Title: ${item.title}`);
    }
  )
  .subscribe((status) => {
    console.log(`Channel subscription status: ${status}`);
  });