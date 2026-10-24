import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Download,
  MoreHorizontal,
  ArrowRight,
  DollarSign,
  ShoppingCart,
  Percent,
  Users,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Activity,
  Layers,
  Sparkles,
  UserPlus,
  Upload,
  CloudSun,
  RefreshCw,
  Loader2,
  Calendar as CalendarIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModernCalendar } from '@/components/ui/modern-calendar';
import { toast } from 'sonner';

interface EfferdAnalyticsOverviewProps {
  stats: {
    users: number;
    students: number;
    teachers: number;
    workspaces: number;
  };
  userGrowthData?: any[];
  onNavigateSection?: (section: string) => void;
  onExportReport?: () => void;
  recentOperations?: any[];
  onAddUser?: () => void;
  onUploadCsv?: () => void;
  date?: Date;
  setDate?: (d: Date | undefined) => void;
  weather?: any;
  fetchWeather?: () => void;
}

export const EfferdAnalyticsOverview: React.FC<EfferdAnalyticsOverviewProps> = ({
  stats,
  userGrowthData,
  onNavigateSection,
  onExportReport,
  recentOperations = [],
  onAddUser,
  onUploadCsv,
  date,
  setDate,
  weather,
  fetchWeather,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '1m' | '3m' | '6m'>('1m');

  // Chart data based on selected time range
  const chartDataSets = {
    '7d': [
      { date: 'Mon', value: 21400 },
      { date: 'Tue', value: 23800 },
      { date: 'Wed', value: 22100 },
      { date: 'Thu', value: 24500 },
      { date: 'Fri', value: 23200 },
      { date: 'Sat', value: 26100 },
      { date: 'Sun', value: 25400 },
    ],
    '1m': [
      { date: 'Mar 30', value: 23200 },
      { date: 'Apr 4', value: 20100 },
      { date: 'Apr 9', value: 21800 },
      { date: 'Apr 14', value: 18400 },
      { date: 'Apr 19', value: 22400 },
      { date: 'Apr 24', value: 19800 },
      { date: 'Apr 29', value: 24900 },
    ],
    '3m': [
      { date: 'Feb', value: 68000 },
      { date: 'Mar', value: 82000 },
      { date: 'Apr', value: 94000 },
    ],
    '6m': [
      { date: 'Nov', value: 52000 },
      { date: 'Dec', value: 61000 },
      { date: 'Jan', value: 74000 },
      { date: 'Feb', value: 82000 },
      { date: 'Mar', value: 91000 },
      { date: 'Apr', value: 104000 },
    ],
  };

  const currentChartData = chartDataSets[timeRange];

  // Daily leads / presence bar data
  const dailyLeadsData = [
    { day: '1', leads: 42 },
    { day: '2', leads: 68 },
    { day: '3', leads: 55 },
    { day: '4', leads: 89 },
    { day: '5', leads: 74 },
    { day: '6', leads: 92 },
    { day: '7', leads: 81 },
    { day: '8', leads: 110 },
    { day: '9', leads: 95 },
    { day: '10', leads: 124 },
    { day: '11', leads: 105 },
    { day: '12', leads: 138 },
  ];

  // Lead sources donut data
  const leadSourcesData = [
    { name: 'Website', value: 1445, color: '#10b981' },
    { name: 'Paid Ads', value: 903, color: '#0ea5e9' },
    { name: 'Direct', value: 620, color: '#6366f1' },
    { name: 'Social', value: 413, color: '#f59e0b' },
  ];

  // Recent Activity Transactions
  const recentTransactions = [
    {
      id: 'TX-9401',
      user: 'Dr. Sarah Connor',
      role: 'Professor / Teacher',
      action: 'Biometric Attendance Synced',
      department: 'Computer Science',
      date: 'Today, 10:14 AM',
      amount: '$1,240.00',
      status: 'completed',
    },
    {
      id: 'TX-9402',
      user: 'Ethan Hunt',
      role: 'Student',
      action: 'Exam Verification Registered',
      department: 'Information Tech',
      date: 'Today, 09:48 AM',
      amount: '$350.00',
      status: 'completed',
    },
    {
      id: 'TX-9403',
      user: 'Jane Miller',
      role: 'Staff Admin',
      action: 'Workspace Bulk Migration',
      department: 'Admissions',
      date: 'Yesterday, 04:30 PM',
      amount: '$4,800.00',
      status: 'pending',
    },
    {
      id: 'TX-9404',
      user: 'Prof. Alex Mercer',
      role: 'Teacher',
      action: 'Course Syllabus Published',
      department: 'Mechanical Engg',
      date: 'Yesterday, 02:15 PM',
      amount: '$850.00',
      status: 'completed',
    },
    {
      id: 'TX-9405',
      user: 'System Bot',
      role: 'AI Engine',
      action: 'Automated CSV Sync & RLS Audit',
      department: 'Security Ops',
      date: '23 Oct, 11:20 AM',
      amount: '$0.00',
      status: 'completed',
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOP CONTROLS ROW - Time Range & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Time Filter Pill Group */}
        <div className="inline-flex items-center p-1 rounded-xl bg-card border border-border shadow-xs">
          {(['7d', '1m', '3m', '6m'] as const).map((range) => {
            const labels = { '7d': '7 Days', '1m': '1 Month', '3m': '3 Months', '6m': '6 Months' };
            const isActive = timeRange === range;
            return (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-foreground text-background dark:bg-zinc-100 dark:text-zinc-950 shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                {labels[range]}
              </button>
            );
          })}
        </div>

        {/* Right Actions: Download Report & More Options */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportReport ? onExportReport : () => toast.success('Exporting comprehensive report...')}
            className="h-8 gap-2 text-xs font-medium rounded-lg border-border hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Report</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => toast.info('Data refreshed from Supabase database')} className="text-xs">
                Refresh Metrics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigateSection && onNavigateSection('backup')} className="text-xs">
                Export Raw JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigateSection && onNavigateSection('users')} className="text-xs">
                View All Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* CONNECTED METRICS & MAIN REVENUE/GROWTH CHART CARD */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Connected KPI Stats Grid (Efferd 7 Signature Bordered Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border bg-card">
          {/* Card 1: Revenue / Total Users */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <DollarSign className="h-3.5 w-3.5" /> Revenue
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" /> +1.9%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                $622K
              </span>
              <span className="text-[11px] text-muted-foreground">
                {stats.users || 1420} users active
              </span>
            </div>
          </div>

          {/* Card 2: Orders / Enrolled Students */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <ShoppingCart className="h-3.5 w-3.5" /> Orders
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" /> +46.2%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                {stats.students > 0 ? `${stats.students}` : '5.14K'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Verified enrollment
              </span>
            </div>
          </div>

          {/* Card 3: Avg. order value / Faculty */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <GraduationCap className="h-3.5 w-3.5" /> Avg. order value
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 dark:text-rose-400">
                <TrendingDown className="h-3 w-3" /> -30.3%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                $121.00
              </span>
              <span className="text-[11px] text-muted-foreground">
                {stats.teachers || 148} faculty staff
              </span>
            </div>
          </div>

          {/* Card 4: Conversion rate / Attendance rate */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Percent className="h-3.5 w-3.5" /> Conversion rate
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 dark:text-rose-400">
                <TrendingDown className="h-3 w-3" /> -21.7%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                2.93%
              </span>
              <span className="text-[11px] text-muted-foreground">
                96.4% presence
              </span>
            </div>
          </div>
        </div>

        {/* Main Area / Wave Chart */}
        <div className="p-5 pt-8">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="efferdChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-border bg-card p-2.5 shadow-md text-xs">
                          <p className="text-muted-foreground">{payload[0].payload.date}</p>
                          <p className="text-sm font-bold text-foreground font-mono mt-0.5">
                            ${Number(payload[0].value).toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#efferdChartGradient)"
                  className="text-foreground/80 dark:text-zinc-200"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MIDDLE 3-COLUMN GRID - Efferd 7 Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Column 1: Lead Sources Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground tracking-tight">
              Lead Sources Breakdown
            </h3>
            <button
              onClick={() => onNavigateSection && onNavigateSection('workspaces')}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>More details</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Donut Chart & Legend */}
          <div className="flex items-center gap-4 pt-2">
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-bold font-mono">3,381</span>
                <span className="text-[9px] text-muted-foreground">Total</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="flex-1 space-y-2 text-xs">
              {leadSourcesData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold font-mono">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: New Leads / Day (Attendance & Activity Trend) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground tracking-tight">
              New Leads / Day
            </h3>
            <button
              onClick={() => onNavigateSection && onNavigateSection('attendance')}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>View leads</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">3,381</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                <TrendingUp className="h-2.5 w-2.5" /> +1.2%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">leads in last 30 days</p>
          </div>

          {/* Sparkline / Bar Chart */}
          <div className="h-20 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyLeadsData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border bg-card p-1.5 shadow-xs text-[10px]">
                          <span className="font-bold">{payload[0].value} leads</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="leads"
                  radius={[3, 3, 0, 0]}
                  fill="hsl(var(--muted-foreground))"
                  className="opacity-70 hover:opacity-100 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 3: Campaign ROI Snapshot */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground tracking-tight">
              Campaign ROI Snapshot
            </h3>
            <button
              onClick={() => toast.info('Full Campaign ROI report generated')}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Full Snapshot</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* 3 Metric Columns */}
          <div className="grid grid-cols-3 divide-x divide-border pt-1">
            <div className="pr-3">
              <p className="text-[11px] text-muted-foreground">Spend</p>
              <p className="text-lg font-bold font-mono tracking-tight text-foreground mt-0.5">$43K</p>
            </div>
            <div className="px-3">
              <p className="text-[11px] text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold font-mono tracking-tight text-foreground mt-0.5">$212K</p>
            </div>
            <div className="pl-3">
              <p className="text-[11px] text-muted-foreground">ROAS</p>
              <p className="text-lg font-bold font-mono tracking-tight text-foreground mt-0.5">4.94x</p>
            </div>
          </div>

          {/* Progress Mix Bar (20% / 80%) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Spend vs return mix</span>
              <span className="font-medium font-mono">20% / 80%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-sky-500 rounded-l-full" style={{ width: '20%' }} />
              <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: '80%' }} />
            </div>
          </div>

          {/* Split Totals */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Ad spend</span>
              </div>
              <span className="font-semibold font-mono text-sm mt-0.5 block">$43K</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Revenue retained</span>
              </div>
              <span className="font-semibold font-mono text-sm mt-0.5 block">$169K</span>
            </div>
          </div>
        </div>
      </div>

      {/* PLATFORM UTILITIES & LIVE STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quick Administrative Actions */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-foreground tracking-tight">Quick Actions</h3>
              <span className="text-[10px] text-muted-foreground">Admin Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddUser}
                className="justify-start text-xs h-9 rounded-xl border-border hover:bg-muted font-medium"
              >
                <UserPlus className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Add User
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onUploadCsv}
                className="justify-start text-xs h-9 rounded-xl border-border hover:bg-muted font-medium"
              >
                <Upload className="mr-2 h-3.5 w-3.5 text-sky-500" /> Upload CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateSection && onNavigateSection('teachers')}
                className="justify-start text-xs h-9 rounded-xl border-border hover:bg-muted font-medium"
              >
                <GraduationCap className="mr-2 h-3.5 w-3.5 text-indigo-500" /> Teachers
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateSection && onNavigateSection('workspaces')}
                className="justify-start text-xs h-9 rounded-xl border-border hover:bg-muted font-medium"
              >
                <Briefcase className="mr-2 h-3.5 w-3.5 text-amber-500" /> Workspaces
              </Button>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Role: Super Admin</span>
            <span className="text-emerald-500 font-medium">System Protected</span>
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs overflow-hidden flex items-center justify-center">
          <ModernCalendar
            selected={date}
            onSelect={setDate ? (d) => setDate(d) : undefined}
            compact={true}
            className="w-full border-0 shadow-none bg-transparent"
          />
        </div>

        {/* Live Weather & Server Node */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
              <CloudSun className="h-4 w-4 text-amber-500" /> Campus Weather
            </h3>
            {fetchWeather && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={fetchWeather}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
          {weather ? (
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold font-mono tracking-tight text-foreground">{Math.round(weather.temperature)}°C</span>
                <p className="text-xs text-sky-500 font-medium capitalize mt-0.5">{weather.condition || 'Clear Sky'}</p>
              </div>
              <div className="text-right text-[11px] space-y-1 text-muted-foreground font-mono">
                <p>Wind: {weather.windspeed} km/h</p>
                <p>Node: Cloud West</p>
              </div>
            </div>
          ) : (
            <div className="py-6 flex items-center justify-center text-xs text-muted-foreground">
              <CloudSun className="h-4 w-4 mr-2 text-amber-500" /> 28°C • Sunny Campus
            </div>
          )}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Latency: 18ms</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RECENT TRANSACTIONS / AUDIT ACTIVITY */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Recent Operations & Transactions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Live platform ledger and administrative operations.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateSection && onNavigateSection('users')}
            className="text-xs rounded-lg border-border"
          >
            View All Ledger Entries
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">User / Operator</th>
                <th className="px-5 py-3 font-medium">Operation</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Date & Time</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-[11px]">
                        {tx.user[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tx.user}</p>
                        <p className="text-[10px] text-muted-foreground">{tx.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-foreground font-medium">{tx.action}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{tx.department}</td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">{tx.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      tx.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
                    }`}>
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-medium text-foreground">{tx.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
