import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('Efferd Admin');
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

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

  const filteredNav = searchQuery.trim()
    ? navItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

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
            {/* Efferd Logo Icon */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-500 p-0.5 flex-shrink-0 flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-card rounded-[6px] flex items-center justify-center">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
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
          {filteredNav ? (
            <div className="space-y-1">
              <div className="px-2 text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
                Search Results
              </div>
              {filteredNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${activeSection === item.id
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Platform Group */}
              <div className="space-y-1">
                {sidebarOpen && (
                  <div className="px-2 pb-1.5 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/80">
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
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all
                        ${isActive
                          ? 'bg-foreground text-background dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                        }
                        ${!sidebarOpen ? 'justify-center px-2' : ''}
                      `}
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-background dark:text-zinc-900' : ''}`} />
                      {sidebarOpen && <span className="truncate flex-1 text-left">{item.label}</span>}
                      {sidebarOpen && item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-primary/20 text-primary font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* System Group */}
              <div className="space-y-1">
                {sidebarOpen && (
                  <div className="px-2 pb-1.5 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/80">
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
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all
                        ${isActive
                          ? 'bg-foreground text-background dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                        }
                        ${!sidebarOpen ? 'justify-center px-2' : ''}
                      `}
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-background dark:text-zinc-900' : ''}`} />
                      {sidebarOpen && <span className="truncate flex-1 text-left">{item.label}</span>}
                      {sidebarOpen && item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-emerald-500/20 text-emerald-400 font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Bottom (Product Update Card & Help) */}
        <div className="p-3 border-t border-border/60 space-y-2">
          {sidebarOpen && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-muted/60 via-muted/30 to-background border border-border/60 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">
                  Update
                </span>
              </div>
              <p className="text-xs font-semibold leading-tight">Product update</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Performance boosts and UI polish.
              </p>
              <button
                onClick={() => toast.info('System is running the latest Efferd 7 Engine.')}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 pt-1"
              >
                Learn more <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Quick Help & Docs */}
          <div className={`flex flex-col gap-0.5 ${!sidebarOpen ? 'items-center' : ''}`}>
            <button
              onClick={() => toast.info('Efferd Support Helpdesk is ready.')}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <HelpCircle className="h-4 w-4" />
              {sidebarOpen && <span>Help Center</span>}
            </button>
            <button
              onClick={() => toast.info('Documentation loaded.')}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <FileText className="h-4 w-4" />
              {sidebarOpen && <span>Documentation</span>}
            </button>
          </div>

          {/* User Profile Mini Bar */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0 overflow-hidden shadow-sm">
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
                  <p className="text-xs font-semibold truncate leading-none mb-0.5">{user?.name || 'Administrator'}</p>
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

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground capitalize">
                {activeSection === 'overview' ? 'Dashboard' : navItems.find(i => i.id === activeSection)?.label || activeSection}
              </span>
            </div>
          </div>

          {/* Right: Search, Theme Toggle, Notifications, User */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Search with ⌘ K */}
            <div className="relative hidden md:flex items-center w-52 lg:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search portal..."
                className="pl-8 pr-12 h-8 text-xs bg-muted/40 border-border/60 focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>

            {/* Maintenance Mode Toggle Badge */}
            {onToggleMaintenance && (
              <button
                onClick={onToggleMaintenance}
                className={`
                  hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all
                  ${maintenanceMode
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    : 'bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground'
                  }
                `}
                title="Toggle Maintenance Mode"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>{maintenanceMode ? 'Maintenance ON' : 'Maintenance'}</span>
              </button>
            )}

            {/* Session Expiry Badge */}
            {sessionTimeLeft && (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {sessionTimeLeft}
              </span>
            )}

            {/* Refresh Action */}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                title="Refresh Data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* THEME TOGGLE (LIGHT / DARK MODE) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg transition-transform hover:scale-105 active:scale-95"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400 transition-all rotate-0 scale-100" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500 transition-all rotate-0 scale-100" />
              )}
            </Button>

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg relative"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 text-xs space-y-2">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="font-semibold text-[11px]">System All Green</p>
                    <p className="text-[10px] text-muted-foreground">Supabase & Firebase Sync active.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="font-semibold text-[11px]">Efferd UI Active</p>
                    <p className="text-[10px] text-muted-foreground">Dashboard 7 Analytics interface ready.</p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-medium text-xs overflow-hidden shadow-sm ring-1 ring-border focus:outline-none">
                  {(user?.photoURL || user?.profile_picture) ? (
                    <img
                      src={user.photoURL || user.profile_picture}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.[0]?.toUpperCase() || 'A'}</span>
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
