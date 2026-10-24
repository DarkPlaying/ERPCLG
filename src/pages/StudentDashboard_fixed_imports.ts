import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Upload,
    ExternalLink,
    Link as LinkIcon,
    AlertCircle,
    Calendar,
    MessageSquare,
    RefreshCw,
    Lock,
    UserCheck,
    Megaphone,
    Bell,
    CheckCircle,
    Clock,
    ChevronRight,
    ChevronLeft,
    Search as SearchIcon,
    ArrowRight,
    AlertTriangle,
    XCircle,
    Users,
    Edit
} from 'lucide-react';
import { ImageCropper } from '@/components/ui/image-crop';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { usePresence } from '@/hooks/usePresence';
import { Textarea } from '@/components/ui/textarea';
import { safeDate } from '@/lib/utils';
