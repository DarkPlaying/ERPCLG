import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/auth';

export const usePresence = (shouldBroadcast = true) => {
    const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Standardize on 'online_users' (underscore) to match dashboards
        const channel = supabase.channel('online_users');

        const setup = async () => {
            let user = getCurrentUser();
            if (!user) {
                const { data } = await supabase.auth.getSession();
                if (data.session?.user) {
                    user = {
                        id: data.session.user.id,
                        email: data.session.user.email || '',
                        role: 'student',
                        name: data.session.user.email?.split('@')[0] || 'User'
                    } as any;
                }
            }

            channel
                .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState();

                    // Flatten the state to a simple map of user_id -> info
                    const users: Record<string, any> = {};
                    for (const key in newState) {
                        const presenceList = newState[key];
                        if (presenceList && presenceList.length > 0) {
                            const payload = presenceList[0] as any;
                            if (payload.user_id) {
                                users[payload.user_id] = {
                                    status: 'online', // Fixed: AdminDashboard expects 'status', not 'state'
                                    ...payload
                                };
                            }
                        }
                    }
                    setOnlineUsers(users);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED' && shouldBroadcast && user) {
                        const userId = user.id || (user as any).uid || 'unknown';

                        await channel.track({
                            user_id: userId,
                            email: user.email,
                            role: user.role,
                            online_at: new Date().toISOString(),
                        });

                        // Heartbeat for Database Persistence (Last Seen)
                        const updateLastSeen = async () => {
                            try {
                                const { error } = await supabase
                                    .from('profiles')
                                    .update({ last_seen: new Date().toISOString() } as any)
                                    .eq('id', userId);

                                if (error) {
                                    // Stop heartbeat if schema is missing 'last_seen' to prevent error spam
                                    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
                                    // console.warn("Presence sync disabled:", error.message); // Silent fail
                                }
                            } catch (e) {
                                if (heartbeatRef.current) clearInterval(heartbeatRef.current);
                            }
                        };

                        updateLastSeen(); // Immediate update

                        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
                        heartbeatRef.current = setInterval(updateLastSeen, 60000); // Every minute
                    }
                });
        };

        setup();

        return () => {
            supabase.removeChannel(channel);
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };
    }, [shouldBroadcast]);

    return onlineUsers;
};
