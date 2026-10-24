import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { toast } from 'sonner';
import { ModernMonthPicker } from '@/components/ui/modern-month-picker';

interface Teacher {
    id: string;
    name: string;
    email: string;
    department: string;
}

interface AdminOverallAttendanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    departments: string[];
}

export const AdminOverallAttendanceDialog = ({ open, onOpenChange, departments }: AdminOverallAttendanceDialogProps) => {
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [attendanceData, setAttendanceData] = useState<Map<string, Map<string, string>>>(new Map());
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [hoveredCol, setHoveredCol] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Fetch Teachers for Dept
    useEffect(() => {
        if (!open) return;
        const fetchTeachers = async () => {
            try {
                let queryBuilder = supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'teacher');

                if (selectedDept !== 'all') {
                    queryBuilder = queryBuilder.eq('department', selectedDept);
                }

                const { data, error } = await queryBuilder;
                if (error) throw error;

                const list: Teacher[] = [];
                data?.forEach(profile => {
                    list.push({
                        id: profile.id,
                        name: profile.full_name || 'Unknown',
                        email: profile.email || '-',
                        department: profile.department || 'General'
                    });
                });
                setTeachers(list);
            } catch (error) {
                console.error("Error fetching teachers:", error);
            }
        };
        fetchTeachers();
        setCurrentPage(1);
    }, [selectedDept, open]);

    // Fetch Monthly Attendance
    useEffect(() => {
        if (!open || !selectedMonth) return;
        const fetchMonthlyAttendance = async () => {
            setLoading(true);
            try {
                const [year, month] = selectedMonth.split('-');
                const startDate = `${selectedMonth}-01`;
                const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                const endDate = `${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;

                const { data, error } = await (supabase as any)
                    .from('teacher_attendance')
                    .select('*')
                    .gte('date_str', startDate)
                    .lte('date_str', endDate);

                if (error) throw error;

                const newData = new Map<string, Map<string, string>>();

                data?.forEach((item: any) => {
                    const ds = item.date_str || item.dateStr;
                    const tid = item.teacher_id || item.teacherId;
                    const status = item.status || '-';

                    if (!tid) return;

                    if (!newData.has(ds)) {
                        newData.set(ds, new Map());
                    }
                    newData.get(ds)!.set(tid, status);
                });

                setAttendanceData(newData);
            } catch (error) {
                console.error("Error fetching monthly attendance:", error);
                toast.error("Failed to load attendance records");
            } finally {
                setLoading(false);
            }
        };
        fetchMonthlyAttendance();
    }, [selectedMonth, open]);

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedTeachers = filteredTeachers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);

    // Reset to page 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const daysInMonth = () => {
        if (!selectedMonth) return 31;
        const [year, month] = selectedMonth.split('-');
        return new Date(parseInt(year), parseInt(month), 0).getDate();
    };

    const getStatusColor = (status: string | undefined) => {
        switch (status) {
            case 'P': return 'bg-foreground text-background font-bold shadow-xs';
            case 'A': return 'border border-border bg-muted/60 text-foreground font-bold';
            case 'HL': return 'border border-dashed border-border bg-foreground/15 text-foreground font-bold';
            default: return 'text-muted-foreground/30 font-normal';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] bg-card border-border text-foreground flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        Overall Teacher Attendance
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        View monthly attendance grid and records for teachers
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4 border-b border-border flex flex-wrap items-center gap-4">
                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                        <Label className="text-xs text-muted-foreground">Department</Label>
                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                            <SelectTrigger className="bg-background border-border text-foreground h-9">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <Label className="text-xs text-muted-foreground">Select Month</Label>
                        <ModernMonthPicker
                            value={selectedMonth}
                            onChange={(val) => setSelectedMonth(val)}
                            className="bg-background border-border text-foreground h-9"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                        <Label className="text-xs text-muted-foreground">Search Teacher</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Name or email..."
                                className="pl-9 bg-background border-border text-foreground h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                            <p className="text-muted-foreground text-xs">Loading attendance data...</p>
                        </div>
                    ) : filteredTeachers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
                            <p>No teachers found for the selected department.</p>
                        </div>
                    ) : (
                        <div className="border border-border rounded-xl overflow-hidden h-full flex flex-col">
                            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                                <table className="min-w-full table-auto border-collapse text-xs whitespace-nowrap" onMouseLeave={() => { setHoveredRow(null); setHoveredCol(null); }}>
                                    <thead className="sticky top-0 z-30">
                                        <tr className="bg-muted/40 border-b border-border">
                                            <th className="p-0 font-medium text-foreground text-left sticky left-0 top-0 bg-card z-40 border-r border-border">
                                                <div className="p-2 w-[160px] md:w-[200px] text-xs font-bold uppercase tracking-wider">Teacher</div>
                                            </th>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                                const isRealDay = day <= daysInMonth();
                                                return (
                                                    <th key={day} className={`p-0 font-medium text-muted-foreground text-center border-r border-border/50 last:border-0 ${hoveredCol === day ? 'bg-muted/50' : ''} ${!isRealDay ? 'bg-muted/20' : ''}`}>
                                                        <div className="py-2 w-7 md:w-8 flex items-center justify-center text-[10px] font-bold">{day}</div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedTeachers.map((teacher, idx) => {
                                            const totalDays = daysInMonth();
                                            const [year, month] = selectedMonth.split('-');

                                            return (
                                                <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className={`p-0 font-medium sticky left-0 bg-card z-20 border-r border-border shadow-xs ${hoveredRow === idx ? 'bg-muted/40' : ''}`}>
                                                        <div className="p-2 w-[160px] md:w-[200px] flex flex-col">
                                                            <span className="truncate text-xs font-semibold text-foreground" title={teacher.name}>{teacher.name}</span>
                                                            <span className="truncate text-[10px] text-muted-foreground" title={teacher.email}>{teacher.email}</span>
                                                        </div>
                                                    </td>
                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                                        const isRealDay = day <= totalDays;
                                                        const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
                                                        const status = attendanceData.get(dateStr)?.get(teacher.id);

                                                        return (
                                                            <td
                                                                key={day}
                                                                className={`p-0 text-center border-r border-border/40 last:border-0 transition-colors ${hoveredRow === idx || hoveredCol === day ? 'bg-muted/40' : ''} ${!isRealDay ? 'bg-muted/10' : ''}`}
                                                                onMouseEnter={() => { setHoveredRow(idx); setHoveredCol(day); }}
                                                            >
                                                                <div className="py-1 w-7 md:w-8 flex items-center justify-center">
                                                                    {isRealDay ? (
                                                                        <div
                                                                            className={`w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center text-[10px] font-black transition-all ${getStatusColor(status)}`}
                                                                            title={`${dateStr}: ${status || 'No Record'}`}
                                                                        >
                                                                            {status || '-'}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-5 h-5 md:w-6 md:h-6" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-muted/20 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-background border-border text-foreground hover:bg-muted"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <div className="flex items-center gap-1.5 px-4 text-xs font-medium text-muted-foreground">
                            Page <span className="text-foreground font-semibold">{currentPage}</span> of <span className="text-foreground font-semibold">{totalPages || 1}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-background border-border text-foreground hover:bg-muted"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        className="border-border text-foreground bg-background hover:bg-muted font-medium w-full md:w-auto"
                        onClick={() => onOpenChange(false)}
                    >
                        Close Window
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
