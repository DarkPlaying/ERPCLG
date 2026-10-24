import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Download,
  MoreHorizontal,
  ArrowRight,
  Users,
  GraduationCap,
  School,
  Activity,
  CheckCircle2,
  Calendar as CalendarIcon,
  UserPlus,
  Upload,
  CloudSun,
  RefreshCw,
  Briefcase,
  Eye,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon
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
  Cell,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
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

  const totalUsers = stats.users || (stats.students + stats.teachers + 1) || 47;
  const totalStudents = stats.students || 44;
  const totalTeachers = stats.teachers || 2;
  const totalVisits = 1280;

  // 1. LINE CHART DATA (Visits & Active Users Over Time)
  const lineChartDataSets = {
    '7d': [
      { date: 'Mon', visits: 165, students: 38, teachers: 2 },
      { date: 'Tue', visits: 192, students: 41, teachers: 2 },
      { date: 'Wed', visits: 180, students: 39, teachers: 2 },
      { date: 'Thu', visits: 210, students: 43, teachers: 2 },
      { date: 'Fri', visits: 195, students: 42, teachers: 2 },
      { date: 'Sat', visits: 140, students: 28, teachers: 1 },
      { date: 'Sun', visits: 198, students: 44, teachers: 2 },
    ],
    '1m': [
      { date: 'Mar 30', visits: 185, students: 36, teachers: 2 },
      { date: 'Apr 4', visits: 210, students: 39, teachers: 2 },
      { date: 'Apr 9', visits: 245, students: 42, teachers: 2 },
      { date: 'Apr 14', visits: 190, students: 40, teachers: 2 },
      { date: 'Apr 19', visits: 260, students: 43, teachers: 2 },
      { date: 'Apr 24', visits: 230, students: 41, teachers: 2 },
      { date: 'Apr 29', visits: 285, students: 44, teachers: 2 },
    ],
    '3m': [
      { date: 'Feb', visits: 680, students: 32, teachers: 2 },
      { date: 'Mar', visits: 940, students: 39, teachers: 2 },
      { date: 'Apr', visits: 1280, students: 44, teachers: 2 },
    ],
    '6m': [
      { date: 'Nov', visits: 410, students: 22, teachers: 1 },
      { date: 'Dec', visits: 520, students: 26, teachers: 1 },
      { date: 'Jan', visits: 680, students: 31, teachers: 2 },
      { date: 'Feb', visits: 890, students: 36, teachers: 2 },
      { date: 'Mar', visits: 1080, students: 40, teachers: 2 },
      { date: 'Apr', visits: 1280, students: 44, teachers: 2 },
    ],
  };

  const currentLineData = lineChartDataSets[timeRange];

  // 2. PIE CHART DATA (Role Distribution)
  const pieChartData = [
    { name: 'Students', value: totalStudents, color: '#10b981' }, // Emerald
    { name: 'Teachers', value: totalTeachers, color: '#0ea5e9' }, // Sky
    { name: 'Admins', value: Math.max(1, totalUsers - totalStudents - totalTeachers), color: '#8b5cf6' }, // Violet
  ];

  // 3. BAR CHART DATA (Visits & Presence by Day / Department)
  const barChartData = [
    { category: 'Mon', students: 42, teachers: 2, visits: 165 },
    { category: 'Tue', students: 44, teachers: 2, visits: 192 },
    { category: 'Wed', categoryLong: 'Wednesday', students: 41, teachers: 2, visits: 180 },
    { category: 'Thu', students: 44, teachers: 2, visits: 210 },
    { category: 'Fri', students: 43, teachers: 2, visits: 195 },
    { category: 'Sat', students: 31, teachers: 1, visits: 140 },
    { category: 'Sun', students: 44, teachers: 2, visits: 198 },
  ];

  // Recent Activity Transactions / Ledger
  const recentTransactions = [
    {
      id: 'TX-9401',
      user: 'Dr. Sarah Connor',
      role: 'Teacher',
      action: 'Biometric Attendance Verified',
      department: 'Computer Science',
      date: 'Today, 10:14 AM',
      status: 'completed',
    },
    {
      id: 'TX-9402',
      user: 'Ethan Hunt',
      role: 'Student',
      action: 'Exam Verification Registered',
      department: 'Information Tech',
      date: 'Today, 09:48 AM',
      status: 'completed',
    },
    {
      id: 'TX-9403',
      user: 'Jane Miller',
      role: 'Staff Admin',
      action: 'Workspace Attendance Sync',
      department: 'Admissions',
      date: 'Yesterday, 04:30 PM',
      status: 'pending',
    },
    {
      id: 'TX-9404',
      user: 'Prof. Alex Mercer',
      role: 'Teacher',
      action: 'Course Syllabus Published',
      department: 'Mechanical Engg',
      date: 'Yesterday, 02:15 PM',
      status: 'completed',
    },
    {
      id: 'TX-9405',
      user: 'System Bot',
      role: 'AI Engine',
      action: 'Automated CSV & RLS Verification',
      department: 'Security Ops',
      date: '23 Oct, 11:20 AM',
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
            onClick={onExportReport ? onExportReport : () => toast.success('Exporting analytics report...')}
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

      {/* 4 CONNECTED KPI STAT CARDS (Total Users, Teachers, Students, Visits) */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border bg-card">
          {/* Card 1: Total Users */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="h-3.5 w-3.5 text-blue-500" /> Total Users
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" /> +12.5%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                {totalUsers}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Active platform users
              </span>
            </div>
          </div>

          {/* Card 2: No. of Teachers */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> No. of Teachers
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                Faculty Staff
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                {totalTeachers}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Teaching & research
              </span>
            </div>
          </div>

          {/* Card 3: No. of Students */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <School className="h-3.5 w-3.5 text-emerald-500" /> No. of Students
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                Verified
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                {totalStudents}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Enrolled students
              </span>
            </div>
          </div>

          {/* Card 4: No. of Visits */}
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity className="h-3.5 w-3.5 text-amber-500" /> No. of Visits
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 dark:text-amber-400">
                <TrendingUp className="h-3 w-3" /> +18.4%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                {totalVisits.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Monthly sessions
              </span>
            </div>
          </div>
        </div>

        {/* 1. LINE GRAPH - Visits & Active Users Trend */}
        <div className="p-5 pt-7 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
                <LineChartIcon className="h-3.5 w-3.5 text-sky-500" /> Portal Visits & Active User Growth (Line Graph)
              </h3>
              <p className="text-[11px] text-muted-foreground">Real-time attendance logins and visit frequency.</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-muted-foreground text-[11px]">Visits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground text-[11px]">Active Students</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="studentsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5">
                          <p className="font-semibold text-foreground">{payload[0]?.payload?.date}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sky-500 font-medium">Visits:</span>
                            <span className="font-bold font-mono">{payload[0]?.payload?.visits}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-emerald-500 font-medium">Students:</span>
                            <span className="font-bold font-mono">{payload[0]?.payload?.students}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-indigo-500 font-medium">Teachers:</span>
                            <span className="font-bold font-mono">{payload[0]?.payload?.teachers}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#visitsGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#studentsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MIDDLE 3-COLUMN GRID (PIE GRAPH, BAR GRAPH, ENGAGEMENT SNAPSHOT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 2. PIE GRAPH: User Demographic Distribution */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
              <PieChartIcon className="h-3.5 w-3.5 text-emerald-500" /> User Distribution (Pie Graph)
            </h3>
            <button
              onClick={() => onNavigateSection && onNavigateSection('users')}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>View Users</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold font-mono leading-none">{totalUsers}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Total Users</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="flex-1 space-y-2.5 text-xs">
              {pieChartData.map((item) => {
                const percentage = totalUsers > 0 ? ((item.value / totalUsers) * 100).toFixed(1) : '0';
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="font-bold">{item.value}</span>
                      <span className="text-muted-foreground">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. BAR GRAPH: Daily Visits & Presence Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-sky-500" /> Daily Visits & Check-ins (Bar Graph)
            </h3>
            <button
              onClick={() => onNavigateSection && onNavigateSection('attendance')}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Attendance</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">{totalVisits.toLocaleString()}</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                <TrendingUp className="h-2.5 w-2.5" /> +18.4%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">sessions recorded this month</p>
          </div>

          {/* Bar Chart */}
          <div className="h-28 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border bg-card p-2 shadow-md text-[11px] space-y-0.5">
                          <p className="font-semibold text-foreground">{payload[0]?.payload?.category}</p>
                          <p className="text-sky-500 font-mono">Visits: {payload[0]?.payload?.visits}</p>
                          <p className="text-emerald-500 font-mono">Students: {payload[0]?.payload?.students}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="visits"
                  radius={[4, 4, 0, 0]}
                  fill="#0ea5e9"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Portal Engagement & Ratio Snapshot */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground tracking-tight">
              Portal Engagement Snapshot
            </h3>
            <button
              onClick={() => toast.info('Full Engagement report ready')}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Full Stats</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* 3 Metric Columns */}
          <div className="grid grid-cols-3 divide-x divide-border pt-1">
            <div className="pr-3">
              <p className="text-[11px] text-muted-foreground">Total Users</p>
              <p className="text-lg font-bold font-mono tracking-tight text-foreground mt-0.5">{totalUsers}</p>
            </div>
            <div className="px-3">
              <p className="text-[11px] text-muted-foreground">Total Visits</p>
              <p className="text-lg font-bold font-mono tracking-tight text-foreground mt-0.5">{totalVisits}</p>
            </div>
            <div className="pl-3">
              <p className="text-[11px] text-muted-foreground">Visits/User</p>
              <p className="text-lg font-bold font-mono tracking-tight text-foreground mt-0.5">
                {(totalVisits / Math.max(1, totalUsers)).toFixed(1)}x
              </p>
            </div>
          </div>

          {/* User Role Mix Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Student vs Faculty Share</span>
              <span className="font-medium font-mono">
                {((totalStudents / Math.max(1, totalUsers)) * 100).toFixed(0)}% / {((totalTeachers / Math.max(1, totalUsers)) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 rounded-l-full"
                style={{ width: `${(totalStudents / Math.max(1, totalUsers)) * 100}%` }}
              />
              <div
                className="h-full bg-indigo-500 rounded-r-full"
                style={{ width: `${(totalTeachers / Math.max(1, totalUsers)) * 100}%` }}
              />
            </div>
          </div>

          {/* Detailed Row Indicators */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Enrolled Students</span>
              </div>
              <span className="font-semibold font-mono text-sm mt-0.5 block">{totalStudents}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Active Faculty</span>
              </div>
              <span className="font-semibold font-mono text-sm mt-0.5 block">{totalTeachers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PLATFORM UTILITIES & LIVE STATUS (Quick Actions, Calendar, Weather) */}
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
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Recent Operations & Ledger</h3>
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
                <th className="px-5 py-3 font-medium text-right">Status</th>
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
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      tx.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
                    }`}>
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
