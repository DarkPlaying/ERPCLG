import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logout } from '@/lib/auth';

interface UseConcurrentSessionProps {
  userId?: string | null;
  userRole?: string;
  onTerminated?: () => void;
}

export function useConcurrentSession({
  userId,
  userRole,
  onTerminated,
}: UseConcurrentSessionProps) {
  const [isTerminated, setIsTerminated] = useState(false);
  const navigate = useNavigate();

  // Each browser tab / window maintains its own unique session ID
  const myTabSessionId = useRef<string | null>(null);

  useEffect(() => {
    // 1. Establish the session ID for this specific tab/window
    let currentId = sessionStorage.getItem('tabSessionId');
    if (!currentId) {
      currentId = localStorage.getItem('sessionId');
      if (currentId) {
        sessionStorage.setItem('tabSessionId', currentId);
      }
    }
    myTabSessionId.current = currentId;

    const uid = userId || localStorage.getItem('userId');
    if (!uid || !currentId) return;

    const triggerKickout = () => {
      setIsTerminated(true);
      if (onTerminated) onTerminated();
    };

    // 2. Storage event listener (fires when ANOTHER tab/window in the SAME browser logs in)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sessionId') {
        const newSessionId = e.newValue;
        if (newSessionId && myTabSessionId.current && newSessionId !== myTabSessionId.current) {
          console.warn('[Session Security] Detected new login in another tab:', {
            oldSession: myTabSessionId.current,
            newSession: newSessionId,
          });
          triggerKickout();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Supabase Realtime listener on profiles table (fires across DIFFERENT browsers/devices)
    const channel = supabase
      .channel(`session-kickout-${uid}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${uid}`,
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          if (
            updatedProfile?.activeSessionId &&
            myTabSessionId.current &&
            updatedProfile.activeSessionId !== myTabSessionId.current
          ) {
            console.warn('[Session Security] Remote kickout received via Supabase Realtime');
            triggerKickout();
          }
        }
      )
      .subscribe();

    // 4. Polling heartbeat check (guarantees kickout even if realtime event is missed)
    const interval = setInterval(async () => {
      if (isTerminated) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('activeSessionId')
          .eq('id', uid)
          .maybeSingle();

        if (
          data?.activeSessionId &&
          myTabSessionId.current &&
          data.activeSessionId !== myTabSessionId.current
        ) {
          console.warn('[Session Security] Mismatch detected via periodic sync');
          triggerKickout();
        }
      } catch (err) {
        // Ignore transient network errors
      }
    }, 4000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userId, isTerminated, onTerminated]);

  const handleReturnToLogin = () => {
    logout();
    sessionStorage.removeItem('tabSessionId');
    localStorage.removeItem('sessionId');
    navigate('/login');
  };

  return {
    isTerminated,
    handleReturnToLogin,
  };
}
