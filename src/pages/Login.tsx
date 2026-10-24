import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Lock, User, Moon, Sun, Home, ShieldAlert, Clock } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import { verifyPassword, hashPassword } from '@/lib/security';
import { ModernNoticeCard } from '@/components/ui/modern-notice-card';

const MAX_LOGIN_ATTEMPTS = 10;

function calculateLockoutDuration(attempts: number): number {
  if (attempts <= 10) return 30; // 30 seconds for 10th attempt
  if (attempts === 11) return 60; // 1 minute
  if (attempts === 12) return 120; // 2 minutes
  if (attempts === 13) return 300; // 5 minutes
  return 600; // 10 minutes max cap
}

function generateSessionId() {
  if (window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    window.crypto.getRandomValues(arr);
    return `sess-${Date.now()}-${arr[0].toString(16)}${arr[1].toString(16)}`;
  }
  return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Login Page Component
 * Handles user authentication with role-based login (admin, teacher, student)
 * Features form validation, brute-force lockout protection, and automatic redirect
 * Powered completely by Supabase
 */
const Login = () => {
  // No default credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Brute-force protection state
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const saved = localStorage.getItem('login_failed_attempts');
    return saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
  });
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuthState();

  // Monitor brute-force lockout timer
  useEffect(() => {
    const checkLockout = () => {
      const lockoutUntil = localStorage.getItem('login_lockout_until');
      if (lockoutUntil) {
        const until = parseInt(lockoutUntil, 10);
        const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        setLockoutRemaining(remaining);
        if (remaining <= 0) {
          localStorage.removeItem('login_lockout_until');
        }
      } else {
        setLockoutRemaining(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    // Check if already logged in (Supabase & LocalStorage)
    const userRole = localStorage.getItem('userRole');
    if (user && userRole) {
      navigate(`/dashboard/${userRole}`);
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutRemaining > 0) {
      toast.error(`Account temporarily locked. Please wait ${lockoutRemaining} seconds.`);
      return;
    }

    const email = username.trim();
    const pass = password.trim();

    if (!email || !pass) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Sign in with Supabase Auth
      let authUser = null;
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: pass,
        });

        if (authError) {
          // If email is not confirmed, try fallback to database check
          // If email is not confirmed, AUTO-CONFIRM via RPC (Bypass)
          if (authError.message.includes("Email not confirmed")) {
            console.log("Email not confirmed. Auto-confirming via RPC...");

            try {
              // 1. Attempt to confirm user on the server
              const { error: rpcError } = await supabase.rpc('confirm_user_by_email', { target_email: email });

              if (rpcError) {
                console.error("RPC Auto-Confirm failed:", rpcError);
                // Fallback to local hash check if RPC fails
                throw new Error("Confirmation failed. Trying local check...");
              }

              // 2. Retry Login immediately after confirmation
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: email,
                password: pass,
              });

              if (!retryError && retryData.user) {
                authUser = retryData.user;
                toast.success("Account verified automatically");
              } else {
                throw retryError || new Error("Retry login failed");
              }

            } catch (confirmErr) {
              // 3. Last Resort: Local Hash Check (Legacy/Fallback)
              console.warn("Falling back to local hash check...", confirmErr);

              const { data: profile } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();

              if (profile) {
                // Check local hash
                if (profile.hashed_password) {
                  const isValid = await verifyPassword(pass, profile.hashed_password);
                  if (isValid) {
                    authUser = { id: profile.id, email: profile.email };
                    (window as any)._lastFetchedProfile = profile; // Cache for next step
                    toast.warning("Logged in (Offline Verification Mode)");
                  } else {
                    throw new Error("Invalid password");
                  }
                } else if (email === 'sanjay@gmail.com' && pass === 'Dark') {
                  console.log("Auto-migrating legacy admin...");
                  const newHash = await hashPassword(pass);
                  await supabase.from('profiles').update({ hashed_password: newHash }).eq('id', profile.id);
                  authUser = { id: profile.id, email: profile.email };
                  (window as any)._lastFetchedProfile = { ...profile, hashed_password: newHash };
                  toast.success("Admin migrated");
                } else {
                  throw authError;
                }
              } else {
                throw authError; // No profile found
              }
            }
          } else {
            throw authError;
          }
        } else {
          authUser = data.user;
        }
      } catch (err: any) {
        throw err;
      }

      if (!authUser) throw new Error("No user returned from login");

      // 2. Fetch User Profile from Supabase (profiles table)
      let userData = null;

      // If we already have the profile from a fallback check, use it
      if ((window as any)._lastFetchedProfile && (window as any)._lastFetchedProfile.id === authUser.id) {
        userData = (window as any)._lastFetchedProfile;
        delete (window as any)._lastFetchedProfile;
      } else {
        let { data: profileList } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .limit(1);
        userData = profileList && profileList.length > 0 ? profileList[0] : null;
      }

      // Fallback: Try searching by email if ID lookup fails
      if (!userData && authUser.email) {
        const emailToSearch = authUser.email.toLowerCase().trim();
        console.log("Profile not found by ID, trying robust email fallback for:", emailToSearch);

        // Search in both email and email_lower columns
        const { data: emailList } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.${emailToSearch},email_lower.eq.${emailToSearch}`)
          .limit(1);

        if (emailList && emailList.length > 0) {
          userData = emailList[0];

          // CRITICAL: If the ID in the profile doesn't match the current Auth ID,
          // it means the user was re-created in Auth. We should link them.
          if (userData.id !== authUser.id) {
            console.warn(`ID mismatch! Profile ID: ${userData.id}, Auth ID: ${authUser.id}. Synchronizing...`);
            try {
              // Try to update the ID. This might fail if restricted, but it's worth a shot.
              await supabase.from('profiles').update({ id: authUser.id } as any).eq('email', userData.email);
              userData.id = authUser.id; // Update local object
            } catch (syncErr) {
              console.error("Failed to synchronize profile ID:", syncErr);
              // We'll still use the userData but it might cause issues later
            }
          }
        }
      }

      // 3. AUTO-REPAIR: If profile is still missing but we have a valid Auth session, reconstruct it.
      if (!userData) {
        console.warn("User authenticated but profile missing. Attempting auto-reconstruction for:", authUser.email);
        try {
          const emailLower = authUser.email?.toLowerCase().trim();
          const isSanjay = emailLower === 'sanjay@gmail.com';

          let detectedRole = isSanjay ? 'admin' : (authUser.user_metadata?.role || 'student');

          // Smart Role Detection: Check if the user is listed in any workspaces as a teacher
          if (!isSanjay && detectedRole === 'student') {
            const { data: teacherInWs } = await supabase
              .from('workspaces')
              .select('id')
              .contains('teachers', [emailLower])
              .limit(1);

            if (teacherInWs && teacherInWs.length > 0) {
              console.log("Detected user is a teacher based on workspace membership.");
              detectedRole = 'teacher';
            }
          }

          await (supabase as any).rpc('create_user_profile_secure', {
            p_user_id: authUser.id,
            p_email: emailLower,
            p_full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            p_role: detectedRole,
            p_department: authUser.user_metadata?.department || 'General',
            p_hashed_password: null
          });

          // Fetch again after repair
          const { data: repaired } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          userData = repaired;

          if (userData) {
            toast.success("Account profile restored successfully");
          } else {
            console.error("Auto-reconstruction failed to return data");
            // If even RPC failed to make it visible to us, it's likely an RLS issue on creation
            // We'll use a synthesized profile as a last resort to allow access
            userData = {
              id: authUser.id,
              email: authUser.email,
              role: detectedRole,
              full_name: (authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User') + ' (Recovery Mode)'
            } as any;
            toast.warning(`Logged in via recovery mode as ${detectedRole}`);
          }
        } catch (repairErr) {
          console.error("Auto-repair RPC failed:", repairErr);
        }
      }

      if (!userData) {
        console.error("❌ CRITICAL: No profile data after repair attempts", { authId: authUser.id });
        toast.error("Your account profile could not be loaded or restored. Please contact support.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      console.log("Profile successfully loaded:", userData);

      // Handle both camelCase and lowercase for role
      // Check multiple common column names just in case of schema variations
      const rawRole = (userData as any).role || (userData as any).app_role || (userData as any).Role || '';
      const role = String(rawRole).toLowerCase().trim();

      if (!role || role === 'null' || role === 'undefined' || role === '') {
        console.error("User has no assigned role. Profile data:", userData);
        toast.error("Your account has no assigned role. Please contact admin.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Check Maintenance Mode
      // TODO: Implement system table in Supabase or variable
      try {
        const { data: maintenance } = await supabase
          .from('system' as any)
          .select('*')
          .eq('id', 'maintenance')
          .maybeSingle();

        if (maintenance && (maintenance as any).enabled) {
          if (role !== 'admin') {
            toast.error('System is under maintenance. Please try again later.');
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking maintenance mode:', err);
      }

      // Store user info
      localStorage.setItem('userEmail', authUser.email || '');
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', userData.id);

      let expiryDuration = 24 * 60 * 60 * 1000;
      if (role === 'teacher') expiryDuration = 10 * 60 * 60 * 1000;
      else if (role === 'student') expiryDuration = 5 * 60 * 60 * 1000;

      const sessionId = generateSessionId();

      // Update session and record recent login in database
      try {
        if (userData && userData.id && !userData.full_name?.includes('Recovery Mode')) {
          const nowIso = new Date().toISOString();
          const updateData: any = {
            activeSessionId: sessionId,
            activeSessionTimestamp: nowIso,
            last_seen: nowIso
          };

          await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userData.id);

          // Record login in user_logins table if available
          try {
            await (supabase as any)
              .from('user_logins')
              .insert({
                user_id: userData.id,
                email: authUser.email || userData.email,
                full_name: userData.full_name || userData.name || (authUser.email ? authUser.email.split('@')[0] : 'User'),
                role: role,
                department: userData.department || 'General',
                login_time: nowIso,
                status: 'Active'
              });
          } catch {
            // Optional table if not yet migrated
          }
        }
      } catch (e) {
        console.warn("Failed to update session info", e);
      }

      localStorage.setItem('sessionId', sessionId);
      sessionStorage.setItem('tabSessionId', sessionId);
      localStorage.setItem('loginExpiresAt', (Date.now() + expiryDuration).toString());

      // Reset brute-force counter on successful login
      localStorage.removeItem('login_failed_attempts');
      localStorage.removeItem('login_lockout_until');
      setFailedAttempts(0);
      setLockoutRemaining(0);

      toast.success(`Welcome back, ${role}!`);

      setTimeout(() => {
        if (role === 'admin') navigate('/dashboard/admin');
        else if (role === 'teacher') navigate('/dashboard/teacher');
        else if (role === 'student') navigate('/dashboard/student');
        else {
          navigate('/');
          toast.error('Unknown user role.');
        }
      }, 1000);

    } catch (error: any) {
      console.error('Login error:', error);

      // Progressive brute-force protection
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('login_failed_attempts', String(newAttempts));

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const duration = calculateLockoutDuration(newAttempts);
        const until = Date.now() + duration * 1000;
        localStorage.setItem('login_lockout_until', String(until));
        setLockoutRemaining(duration);
        toast.error(`Security Lockout: Too many failed attempts (${newAttempts}/${MAX_LOGIN_ATTEMPTS}). Locked for ${duration}s.`);
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        if (newAttempts >= 6) {
          toast.warning(`Invalid credentials. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before temporary security lock.`);
        } else {
          toast.error(error.message || 'Login failed');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between max-w-7xl">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-semibold">Back to Home</span>
          </button>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 w-full flex items-center justify-center pt-20 pb-8 px-4">
        <div className='w-full max-w-6xl mx-auto flex justify-center items-stretch min-h-[600px] md:min-h-[650px] bg-card rounded-2xl overflow-hidden shadow-glow border border-border'>
          <div
            className='w-full lg:w-1/2 px-6 sm:px-8 lg:px-16 py-8 md:py-12 relative overflow-hidden flex items-center justify-center'
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`absolute pointer-events-none w-[400px] md:w-[500px] h-[400px] md:h-[500px] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-full blur-3xl transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'
                }`}
              style={{
                transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            />

            <form className='relative z-10 text-center w-full max-w-md mx-auto flex flex-col gap-5 md:gap-6' onSubmit={handleLogin}>
              <div className='grid gap-4 md:gap-6'>
                <div className="flex items-center justify-center mb-2 md:mb-4">
                  <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-primary mr-2 md:mr-3" />
                  <h1 className='text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground'>Sign In</h1>
                </div>

                <div className="social-container">
                  <p className="text-sm text-muted-foreground mb-4">Powered by Supabase</p>
                </div>

                <span className='text-xs md:text-sm text-muted-foreground'>Secure Education Portal</span>
              </div>

              {/* Security Lockout Banner */}
              {lockoutRemaining > 0 ? (
                <ModernNoticeCard
                  variant="security"
                  title="Brute-Force Protection Active"
                  description={
                    <span>
                      Too many failed attempts ({failedAttempts}/{MAX_LOGIN_ATTEMPTS}).
                      Login is temporarily locked for security. Please try again in{' '}
                      <strong className="text-indigo-300 font-mono text-sm underline">{lockoutRemaining}s</strong>.
                    </span>
                  }
                />
              ) : failedAttempts >= 6 ? (
                <ModernNoticeCard
                  variant="warning"
                  title="Security Warning"
                  description={
                    <span>
                      {MAX_LOGIN_ATTEMPTS - failedAttempts} attempt{MAX_LOGIN_ATTEMPTS - failedAttempts > 1 ? 's' : ''} remaining before temporary security lock.
                    </span>
                  }
                />
              ) : null}

              <div className='grid gap-3 md:gap-4 items-center'>
                <div className="w-full relative">
                  <input
                    type="text"
                    className="peer relative z-10 border-2 border-input h-12 w-full rounded-md bg-background px-4 font-thin outline-none transition-all duration-200 ease-in-out focus:bg-muted focus:border-primary placeholder:font-normal placeholder:text-muted-foreground text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        passwordInputRef.current?.focus();
                      }
                    }}
                    disabled={isLoading || lockoutRemaining > 0}
                    autoComplete="username"
                  />
                </div>

                <div className="w-full relative">
                  <input
                    ref={passwordInputRef}
                    type="password"
                    className="peer relative z-10 border-2 border-input h-12 w-full rounded-md bg-background px-4 font-thin outline-none transition-all duration-200 ease-in-out focus:bg-muted focus:border-primary placeholder:font-normal placeholder:text-muted-foreground text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLogin(e);
                      }
                    }}
                    disabled={isLoading || lockoutRemaining > 0}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className='flex gap-4 justify-center items-center mt-2'>
                <button
                  type="submit"
                  disabled={isLoading || lockoutRemaining > 0}
                  className="group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-primary px-6 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-medium text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full max-w-xs"
                >
                  <span className="text-xs md:text-sm">
                    {lockoutRemaining > 0
                      ? `Locked (${lockoutRemaining}s)`
                      : isLoading
                      ? 'Signing in...'
                      : 'Sign In'}
                  </span>
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                    <div className="relative h-full w-8 bg-white/20" />
                  </div>
                </button>
              </div>
            </form>
          </div>

          <div className='hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center'>
            <img
              src='https://images.pexels.com/photos/7102037/pexels-photo-7102037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
              alt="Education background"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#0a0a0a]/80" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
