import { createClient } from "@supabase/supabase-js";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

interface CreateUserParams {
    email: string;
    password: string;
    role: string;
    full_name?: string;
    department?: string;
    hashedPassword?: string;
}

/**
 * Creates a new user in Supabase Auth & Profiles table.
 * Uses a temporary client to avoid disrupting the current session.
 * 
 * @param params User creation parameters
 * @returns Object containing UID and restoration status
 */
export const createUserInBothSystems = async (params: CreateUserParams): Promise<{ uid: string; isRestored: boolean }> => {
    const { email, password, role, full_name, department, hashedPassword } = params;
    const emailLower = email.toLowerCase().trim();
    const roleLower = role.toLowerCase().trim();

    // Create a temporary client to sign up the new user without logging out the admin
    const tempClient = createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            }
        }
    );

    try {
        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email: emailLower,
            password,
            options: {
                data: {
                    full_name,
                    role: roleLower,
                    department
                }
            }
        });

        let userId: string;

        if (authError) {
            if (authError.message.toLowerCase().includes("already registered")) {
                console.warn("User already exists in Supabase Auth. Retrieving ID...");

                // Try to get the existing user ID from profiles
                const { data: existing } = await supabase
                    .from('profiles')
                    .select('id')
                    .ilike('email', emailLower)
                    .maybeSingle();

                if (existing) {
                    userId = existing.id;
                } else {
                    // Try to sign in to get the Auth ID
                    const { data: signInData, error: signInError } = await tempClient.auth.signInWithPassword({
                        email: emailLower,
                        password
                    });

                    if (signInData?.user) {
                        userId = signInData.user.id;
                    } else {
                        throw new Error("User exists in Auth but ID could not be retrieved. Likely password mismatch.");
                    }
                }
            } else {
                throw authError;
            }
        } else if (authData.user) {
            userId = authData.user.id;
        } else {
            throw new Error("User creation failed: No user object returned from Supabase.");
        }

        // Create/update profile using secure RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_profile_secure', {
            p_user_id: userId,
            p_email: emailLower,
            p_full_name: full_name || 'User',
            p_role: roleLower,
            p_department: department || '-',
            p_hashed_password: hashedPassword
        });

        if (rpcError) {
            console.error("RPC Error creating profile:", rpcError);
            throw new Error(`Profile creation failed: ${rpcError.message}`);
        }

        return { uid: userId, isRestored: authError !== null };

    } catch (error) {
        console.error("Error creating user in Supabase:", error);
        throw error;
    }
};
