import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutGrid,
  Users,
  GraduationCap,
  ClipboardCheck,
  Briefcase,
  MessageSquare,
  Sparkles,
  Mail,
  Database,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  LogOut,
  HelpCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Clock,
  Menu,
  X,
  User as UserIcon,
  Check,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  category: 'platform' | 'system';
}

interface EfferdAdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  user?: {
    name: string;
    role: string;
    email?: string;
    photoURL?: string;
    profile_picture?: string;
  };
  sessionTimeLeft?: string;
  maintenanceMode?: boolean;
  onToggleMaintenance?: () => void;
  onRefresh?: () => void;
}

export const EfferdAdminLayout: React.FC<EfferdAdminLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  user,
  sessionTimeLeft,
  maintenanceMode,
  onToggleMaintenance,
  onRefresh,
}) => {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to collapsed as requested
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('Efferd Admin');
  const navigate = useNavigate();

  // Search live user details strictly from Supabase database
  useEffect(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      setSearchedUsers([]);
      setSearchDropdownOpen(false);
      return;
    }

    setSearchDropdownOpen(true);
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        // Try searching database directly using ilike
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,department.ilike.%${term}%,role.ilike.%${term}%`)
          .limit(10);

        if (!error && data && data.length > 0) {
          setSearchedUsers(data);
        } else {
          // Resilient fallback: fetch profiles and filter
          const { data: fallbackData } = await supabase
            .from('profiles')
            .select('*')
            .limit(100);

          if (fallbackData) {
            const matched = fallbackData.filter((p: any) => {
              const name = (p.full_name || p.name || '').toLowerCase();
              const email = (p.email || '').toLowerCase();
              const dept = (p.department || '').toLowerCase();
              const role = (p.role || '').toLowerCase();
              return name.includes(term) || email.includes(term) || dept.includes(term) || role.includes(term);
            });
            setSearchedUsers(matched.slice(0, 10));
          } else {
            setSearchedUsers([]);
          }
        }
      } catch (err) {
        console.error('Error searching database users:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close live user search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut ⌘K / Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input');
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Live Recent Queries for Notification Dropdown
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [queriesLoading, setQueriesLoading] = useState(false);

  const fetchRecentQueries = useCallback(async () => {
    setQueriesLoading(true);
    try {
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentQueries(data);
      }
    } catch {
      // Ignore if table not present
    } finally {
      setQueriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentQueries();
    const channel = supabase
      .channel('efferd_queries_notification')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queries' }, () => {
        fetchRecentQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecentQueries]);

  const navItems: NavItem[] = [
    // Platform
    { id: 'overview', label: 'Dashboard', icon: LayoutGrid, category: 'platform' },
    { id: 'users', label: 'Manage Users', icon: Users, category: 'platform' },
    { id: 'teachers', label: 'Manage Teachers', icon: GraduationCap, category: 'platform' },
    { id: 'attendance', label: 'Manage Attendance', icon: ClipboardCheck, category: 'platform' },
    { id: 'workspaces', label: 'Workspaces', icon: Briefcase, category: 'platform' },
    // System
    { id: 'queries', label: 'View Queries', icon: MessageSquare, category: 'system' },
    { id: 'aiCsv', label: 'AI CSV Generator', icon: Sparkles, badge: 'AI', category: 'system' },
    { id: 'send-mail', label: 'Send Mail', icon: Mail, category: 'system' },
    { id: 'backup', label: 'Backup Files', icon: Database, category: 'system' },
  ];

  const platformNav = navItems.filter(item => item.category === 'platform');
  const systemNav = navItems.filter(item => item.category === 'system');

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR - Efferd 7 Style */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 h-full flex flex-col flex-shrink-0
          border-r border-border bg-card/95 backdrop-blur-md transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Monochrome Logo Icon */}
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 p-1 flex-shrink-0 flex items-center justify-center shadow-xs border border-zinc-200 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-1">
                <div className="w-1.5 h-1.5 rounded-xs bg-white dark:bg-zinc-950" />
                <div className="w-1.5 h-1.5 rounded-xs bg-zinc-400 dark:bg-zinc-500" />
                <div className="w-1.5 h-1.5 rounded-xs bg-zinc-400 dark:bg-zinc-500" />
                <div className="w-1.5 h-1.5 rounded-xs bg-white dark:bg-zinc-950" />
              </div>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm tracking-tight truncate leading-tight">
                  College ERP
                </span>
                <span className="text-[10px] text-muted-foreground truncate leading-tight">
                  Admin Portal
                </span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-muted-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Nav Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
          {/* Platform Group */}
          <div className="space-y-1">
            {sidebarOpen && (
              <div className="px-3 pt-2 pb-1 text-xs font-bold tracking-wider uppercase text-muted-foreground/80">
                Platform
              </div>
            )}
            {platformNav.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${isActive
                      ? 'bg-foreground text-background dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }
                    ${!sidebarOpen ? 'justify-center px-2' : ''}
                  `}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-background dark:text-zinc-900' : ''}`} />
                  {sidebarOpen && <span className="truncate flex-1 text-left">{item.label}</span>}
                  {sidebarOpen && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* System Group */}
          <div className="space-y-1 pt-2">
            {sidebarOpen && (
              <div className="px-3 pt-2 pb-1 text-xs font-bold tracking-wider uppercase text-muted-foreground/80">
                System
              </div>
            )}
            {systemNav.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${isActive
                      ? 'bg-foreground text-background dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }
                    ${!sidebarOpen ? 'justify-center px-2' : ''}
                  `}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-background dark:text-zinc-900' : ''}`} />
                  {sidebarOpen && <span className="truncate flex-1 text-left">{item.label}</span>}
                  {sidebarOpen && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Bottom (User Profile) */}
        <div className="p-3 border-t border-border/60">

          {/* User Profile Mini Bar */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold font-mono text-xs flex-shrink-0 overflow-hidden shadow-xs border border-zinc-300 dark:border-zinc-700">
                {(user?.photoURL || user?.profile_picture) ? (
                  <img
                    src={user.photoURL || user.profile_picture}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user?.name?.[0]?.toUpperCase() || 'A'}</span>
                )}
              </div>
              {sidebarOpen && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate leading-none mb-0.5 text-foreground">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-muted-foreground truncate leading-none capitalize">{user?.role || 'Admin'}</p>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVBAR - Efferd 7 Style */}
        <header className="h-16 flex-none border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-30">
          {/* Left: Collapse Button & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-muted-foreground"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>

            {/* Breadcrumb / Section Heading */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-foreground capitalize tracking-tight">
                {activeSection === 'overview' ? 'Dashboard' : navItems.find(i => i.id === activeSection)?.label || activeSection}
              </span>
            </div>
          </div>

          {/* Right: Search, Theme Toggle, Notifications, User */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Quick Search - Live Database User Search */}
            <div ref={searchRef} className="relative hidden md:flex items-center w-56 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    setSearchDropdownOpen(true);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setSearchDropdownOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchDropdownOpen(false);
                  }
                }}
                placeholder="Search DB users..."
                className="pl-9 pr-14 h-9 text-xs sm:text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-foreground rounded-xl"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchedUsers([]);
                      setSearchDropdownOpen(false);
                    }}
                    className="h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    ⌘K
                  </kbd>
                )}
              </div>

              {/* Live Database Users Dropdown */}
              {searchDropdownOpen && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 sm:-left-12 sm:-right-12 mt-2 z-50 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
                  <div className="px-3.5 py-2.5 border-b border-border/60 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <span className="flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5" />
                      Database Users
                    </span>
                    {searchLoading ? (
                      <span className="flex items-center gap-1.5 text-[10px] lowercase font-normal text-muted-foreground">
                        <RefreshCw className="h-3 w-3 animate-spin" /> fetching...
                      </span>
                    ) : (
                      <span className="font-mono text-[10px]">{searchedUsers.length} found</span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                    {searchLoading && searchedUsers.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span>Querying Supabase database...</span>
                      </div>
                    ) : searchedUsers.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">No users found in database</p>
                        <p className="text-[11px]">No profiles match "{searchQuery}"</p>
                      </div>
                    ) : (
                      searchedUsers.map((u) => {
                        const name = u.full_name || u.name || 'Unnamed User';
                        const email = u.email || 'No email';
                        const role = u.role || 'user';
                        const dept = u.department;
                        const avatar = u.photoURL || u.photoUrl || u.profile_picture;
                        const joinedDate = u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;

                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              onSectionChange(role === 'teacher' ? 'teachers' : 'users');
                              setSearchDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-muted/70 transition-all cursor-pointer group border border-transparent hover:border-border"
                          >
                            <div className="h-9 w-9 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden border border-border">
                              {avatar ? (
                                <img src={avatar} alt={name} className="h-full w-full object-cover" />
                              ) : (
                                <span>{name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-foreground truncate group-hover:underline">
                                  {name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium border border-border bg-muted/60 text-foreground capitalize">
                                  {role}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-2 mt-0.5">
                                <span className="truncate">{email}</span>
                                {dept && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{dept}</span>
                                  </>
                                )}
                                {joinedDate && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate text-[10px]">Joined {joinedDate}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 border-t border-border/60 bg-muted/20 flex items-center justify-between px-3">
                    <span className="text-[10px] text-muted-foreground">Click a user to open details</span>
                    <button
                      onClick={() => {
                        onSectionChange('users');
                        setSearchDropdownOpen(false);
                      }}
                      className="text-[11px] font-semibold text-foreground hover:underline transition-colors flex items-center gap-1"
                    >
                      Manage All Users →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Maintenance Mode Toggle Badge */}
            {onToggleMaintenance && (
              <button
                onClick={onToggleMaintenance}
                className={`
                  hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all
                  ${maintenanceMode
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                  }
                `}
                title="Toggle Maintenance Mode"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{maintenanceMode ? 'Maintenance ON' : 'Maintenance'}</span>
              </button>
            )}

            {/* Session Expiry Badge */}
            {sessionTimeLeft && (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-muted/60 border border-border text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {sessionTimeLeft}
              </span>
            )}

            {/* Refresh Action */}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}

            {/* THEME TOGGLE: WHITE & BLACK vs BLACK & WHITE */}
            <div className="flex items-center p-0.5 rounded-xl border border-border bg-muted/50 shadow-xs">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-white text-zinc-950 shadow-xs font-bold ring-1 ring-zinc-300'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Switch to White Background & Black Font"
              >
                <Sun className={`h-4 w-4 flex-shrink-0 ${theme === 'light' ? 'text-zinc-950' : 'text-muted-foreground'}`} />
                <span className="hidden md:inline">White & Black</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-950 text-white shadow-xs font-bold border border-zinc-700'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Switch to Black Background & White Font"
              >
                <Moon className={`h-4 w-4 flex-shrink-0 ${theme === 'dark' ? 'text-white' : 'text-muted-foreground'}`} />
                <span className="hidden md:inline">Black & White</span>
              </button>
            </div>

            {/* Notification Bell - Recent Queries Only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl relative"
                >
                  <Bell className="h-4 w-4" />
                  {recentQueries.some((q: any) => q.status === 'pending' || !q.status) && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-foreground ring-2 ring-card animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden border border-border bg-card shadow-lg">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DropdownMenuLabel className="text-xs font-semibold p-0">Recent Queries</DropdownMenuLabel>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-foreground/10 text-foreground font-medium">
                      {recentQueries.length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => onSectionChange('queries')}
                  >
                    View All
                  </Button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {queriesLoading && recentQueries.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-foreground" />
                      <span>Fetching queries...</span>
                    </div>
                  ) : recentQueries.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No recent queries found.
                    </div>
                  ) : (
                    recentQueries.map((q: any) => (
                      <div
                        key={q.id}
                        onClick={() => onSectionChange('queries')}
                        className="p-3 hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground truncate max-w-[170px]">
                            {q.userEmail || q.userName || 'Student / Faculty'}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            q.status === 'resolved' || q.status === 'replied'
                              ? 'bg-muted text-muted-foreground border border-border'
                              : 'bg-foreground text-background'
                          }`}>
                            {q.status || 'pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {q.query || q.question || 'New inquiry received'}
                        </p>
                        {q.created_at && (
                          <p className="text-[9px] font-mono text-muted-foreground mt-1">
                            {new Date(q.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm overflow-hidden shadow-xs border border-border focus:outline-none hover:scale-105 transition-transform">
                  {(user?.photoURL || user?.profile_picture) ? (
                    <img
                      src={user.photoURL || user.profile_picture}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-bold font-mono">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold leading-none">{user?.name || 'Administrator'}</p>
                    <p className="text-[11px] leading-none text-muted-foreground">{user?.email || 'admin@eduportal.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSectionChange('users')} className="text-xs">
                  <Users className="mr-2 h-3.5 w-3.5" />
                  <span>Manage Users</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSectionChange('backup')} className="text-xs">
                  <Database className="mr-2 h-3.5 w-3.5" />
                  <span>Database & Backups</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-xs text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth bg-background">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
