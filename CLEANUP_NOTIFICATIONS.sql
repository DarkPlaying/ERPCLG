-- =============================================================================
-- NOTIFICATION CLEANUP SCRIPT
-- =============================================================================
-- Purpose: Deletes notifications older than 6 months to save space and maintain performance.
-- Recommendation: Run this script manually every 6 months or schedule it.

-- 1. Create a function to clean up old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete notifications older than 6 months
    DELETE FROM public.notifications
    WHERE created_at < NOW() - INTERVAL '6 months';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RAISE NOTICE 'Deleted % old notifications.', deleted_count;
END;
$$;

-- 2. Run the cleanup immediately (Optional - uncomment to run now)
-- SELECT public.cleanup_old_notifications();

-- 3. (Optional) Schedule with pg_cron if available
-- Note: Requires pg_cron extension to be enabled on your Supabase project.
/*
SELECT cron.schedule(
    'cleanup-notifications-monthly', -- name of the job
    '0 0 1 * *',                     -- every 1st day of the month at midnight
    $$SELECT public.cleanup_old_notifications()$$
);
*/

-- 4. Grant permission to authenticated users (if you want to call it from client)
GRANT EXECUTE ON FUNCTION public.cleanup_old_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_notifications TO service_role;
