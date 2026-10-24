/**
 * Legacy Firebase compatibility bridge.
 * The application has been fully migrated to Supabase.
 * For all database, authentication, and storage operations, use @/integrations/supabase/client directly.
 */
import { supabase } from "@/integrations/supabase/client";

export { supabase };
export const auth = supabase.auth;
export const storage = supabase.storage;
export const db = supabase;
export const database = supabase;
