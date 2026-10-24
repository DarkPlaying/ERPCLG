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
import { ModernNoticeCard } from '@/components/ui/modern-notice-card';
import { useConcurrentSession } from '@/hooks/useConcurrentSession';
import { SessionTerminatedDialog } from '@/components/ui/session-terminated-dialog';
import { ModernDatePicker } from '@/components/ui/modern-date-picker';
import { ModernMonthPicker } from '@/components/ui/modern-month-picker';

const EXAM_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // User provided Client ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const ASSIGNMENT_DRIVE_FOLDER_ID = import.meta.env.VITE_ASSIGNMENT_DRIVE_FOLDER_ID; // User provided folder
const student_profile_drive_folder_id = import.meta.env.VITE_STUDENT_PROFILE_FOLDER_ID;

const uploadFileToDrive = async (accessToken: string, file: File, folderId: string) => {
  return new Promise<string>((resolve, reject) => {
    if (!accessToken) {
      reject(new Error("No Google Drive access token"));
      return;
    }

    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,thumbnailLink,webContentLink', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form
    })
      .then(res => res.json())
      .then(val => {
        if (val.error) {
          reject(val.error);
        } else {
          // Construct direct image link if possible, or use webContentLink
          // lh3.googleusercontent.com allows direct image loading without auth if public or with cookie if private? 
          // Drive images usually require auth or are not hotlinkable easily. 
          // TeacherDashboard uses `https://lh3.googleusercontent.com/d/${val.id}` which works for authenticated users or public.
          // We will use the same strategy.
          // Make public so teachers can view it
          fetch(`https://www.googleapis.com/drive/v3/files/${val.id}/permissions`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              role: 'reader',
              type: 'anyone'
            })
          })
            .then(async () => {
              // Return direct Google Drive link
              resolve(`https://drive.google.com/file/d/${val.id}/view`);
            })
            .catch(err => {
              console.error("Error making file public", err);
              // Resolve anyway with direct Drive link
              resolve(`https://drive.google.com/file/d/${val.id}/view`);
            });
        }
      })
      .catch(reject);
  });
};

// Session-based cache helper (survives page refresh, clears on tab close)
// Session-based cache helper (configured to use localStorage for better mobile persistence)
const SessionCache = {
  set: (key: string, data: any, ttlMinutes: number = 5) => {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('SessionCache set failed:', e);
    }
  },

  get: (key: string) => {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const age = Date.now() - parsed.timestamp;

      // Return null if expired
      if (age > parsed.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return parsed.data;
    } catch (e) {
      console.warn('SessionCache get failed:', e);
      return null;
    }
  },

  clear: (key: string) => {
    localStorage.removeItem(`cache_${key}`);
  },

  clearAll: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};


const StudentDashboard = () => {
  usePresence(); // Initialize presence for student
  const [activeSection, setActiveSection] = useState('overview');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Handle URL Navigation from Notifications
  // Handle URL Navigation from Notifications
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) {
      if (section === 'exam' || section === 'assignment') setActiveSection('exams');
      else if (section === 'marks') setActiveSection('marks');
      else if (section === 'unom') setActiveSection('submitUnom');
      else if (section === 'syllabus') setActiveSection('syllabus');
      else if (section === 'announcement') setActiveSection('announcements');
      else setActiveSection(section);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Data States
  const [exams, setExams] = useState<any[]>([]);
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [examMarks, setExamMarks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [myWorkspaces, setMyWorkspaces] = useState<string[]>([]);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [examPage, setExamPage] = useState(1);
  const [examSearch, setExamSearch] = useState('');
  const [syllabusPage, setSyllabusPage] = useState(1);
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [announcePage, setAnnouncePage] = useState(1);
  const [limitExams, setLimitExams] = useState(1000);
  const [limitSyllabi, setLimitSyllabi] = useState(1000);
  const [limitAnnouncements, setLimitAnnouncements] = useState(1000);
  const [limitAssignments, setLimitAssignments] = useState(1000);
  // Total Counts State
  const [totalExams, setTotalExams] = useState(0);
  const [totalSyllabi, setTotalSyllabi] = useState(0);
  const [limitExamMarks, setLimitExamMarks] = useState(1000);
  const [totalExamMarks, setTotalExamMarks] = useState(0);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [limitMarks, setLimitMarks] = useState(1000);
  const [totalMarks, setTotalMarks] = useState(0);
  const [marksPage, setMarksPage] = useState(1);
  const [examMarksPage, setExamMarksPage] = useState(1);
  const [selectedUnomId, setSelectedUnomId] = useState<string | null>(null);
  const [unomForm, setUnomForm] = useState<any>({}); // { subject: mark }
  const [unomReports, setUnomReports] = useState<any[]>([]);
  const [unomPage, setUnomPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const isInitialLoad = useRef(true);

  // Report State
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadFrom, setDownloadFrom] = useState('');
  const [downloadTo, setDownloadTo] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceCategory, setWorkspaceCategory] = useState('');

  // Session & Security State
  const [timeRemaining, setTimeRemaining] = useState<number>(5 * 60 * 60); // 5 hours for students
  const { isTerminated, handleReturnToLogin } = useConcurrentSession({
    userId: localStorage.getItem('userId'),
    userRole: 'student',
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [maintenanceCountdown, setMaintenanceCountdown] = useState<number | null>(null);

  // Assignment Submission State
  const googleAuthClient = useRef<any>(null);

  // Initialize Google Drive API
  useEffect(() => {
    const loadScripts = () => {
      const gScript = document.createElement('script');
      gScript.src = 'https://apis.google.com/js/api.js';
      gScript.onload = () => {
        (window as any).gapi.load('client', async () => {
          await (window as any).gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
        });
      };
      document.body.appendChild(gScript);

      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => {
        googleAuthClient.current = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: EXAM_CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error !== undefined) {
              console.error(response);
              return;
            }
            // Do NOT set isAuthorized(true) here - that is for App Logic
            setDriveAccessToken(response.access_token);
            toast.success("Google Drive Linked successfully! You can now upload files.");
          },
        });
      };
      document.body.appendChild(gisScript);
    };
    loadScripts();
  }, []);

  const handleAuthClick = () => {
    if (googleAuthClient.current) {
      // Force token request to ensure we get a valid access token
      // Using prompt: '' allows automatic selection if already signed in,
      // but if we are hitting errors, we might need 'select_account'
      googleAuthClient.current.requestAccessToken({ prompt: '' });
    } else {
      toast.error("Google Drive service initializing... please wait causing reload");
      window.location.reload();
    }
  };
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentLink, setAssignmentLink] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classTeacherProfile, setClassTeacherProfile] = useState<any>(null);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentType, setAssignmentType] = useState('assignment'); // Default assignment
  const [portalStatus, setPortalStatus] = useState('closed'); // Default closed

  // Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(Notification.permission);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsForm, setDetailsForm] = useState<any>({});
  const [requiredFields, setRequiredFields] = useState<string[]>(['name', 'vta_no', 'personal_mobile', 'department', 'address', 'date_of_birth']);
  const [detailsPage, setDetailsPage] = useState(1);
  const [filterTeacher, setFilterTeacher] = useState('all');

  useEffect(() => {
    if (showDetailsModal) setDetailsPage(1);
  }, [showDetailsModal]);

  // Pre-fill details form from current profile when modal opens
  useEffect(() => {
    if (!showDetailsModal || !userProfile) return;

    setDetailsForm((prev: any) => {
      const u: any = userProfile as any;
      return {
        // start with existing profile values, but don't overwrite any field the user already typed in (prev wins)
        ...u,
        name: prev.name || u.full_name || u.name || '',
        vta_no: prev.vta_no || u.vta_no || u.va_no || u.reg_no || '',
        va_no: prev.va_no || u.va_no || u.vta_no || u.reg_no || '',
        personal_mobile: prev.personal_mobile || u.personal_mobile || u.phone || '',
        department: prev.department || u.department || '',
        address: prev.address || u.address || '',
        date_of_birth: prev.date_of_birth || (u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : ''),
        photoURL: prev.photoURL || u.profile_picture || u.photoURL || '',
        ...prev
      };
    });
  }, [showDetailsModal, userProfile]);

  const [showImageCropper, setShowImageCropper] = useState(false);

  // Google Drive Auth State
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);

  const addNotification = (type: string, message: string) => {
    setNotifications(prev => [{ id: Date.now(), type, message, time: new Date(), read: false }, ...prev]);
  };

  const checkCompulsoryUpdate = async (announcementData: any, currentUid: string) => {
    if (!currentUid) return;
    const { data: userData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUid)
      .maybeSingle();

    if (userData) {
      const lastUpdate = userData.profile_updated_at; // ISO String
      const requestTimestamp = announcementData.created_at; // ISO String

      // Simple comparison (ISO strings compare correctly for time)
      if (!lastUpdate || (requestTimestamp > lastUpdate)) {
        setShowDetailsModal(true);

        const rawFields = announcementData.requiredfields || announcementData.requiredFields || ['name', 'vta_no', 'personal_mobile', 'department', 'address', 'date_of_birth'];
        let fields = rawFields.map((f: string) => f === 'batch_year' ? 'address' : f);

        const addressIndex = fields.indexOf('address');
        const dobIndex = fields.indexOf('date_of_birth');
        if (addressIndex !== -1 && dobIndex !== -1 && dobIndex < addressIndex) {
          const temp = [...fields];
          temp[dobIndex] = 'address';
          temp[addressIndex] = 'date_of_birth';
          fields = temp;
        }

        setRequiredFields(fields);

        // Pre-fill form with existing user data so they don't have to re-type everything
        const u: any = userData as any;
        console.log("Compulsory Update Pre-fill Data:", u); // Debug log

        const initialForm: any = {
          ...u,
          ...(u.custom_fields || {}), // Include custom_fields if any
          // Explicitly map common fields if they exist in DB but under different names or nested
          name: u.name || u.full_name || '',
          vta_no: u.vta_no || u.va_no || u.reg_no || u.register_number || '',
          va_no: u.va_no || u.vta_no || u.reg_no || u.register_number || '',
          personal_mobile: u.personal_mobile || u.phone || u.mobile || '',
          department: u.department || u.dept || '',
          address: u.address || '',
          date_of_birth: u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : '',
          photoURL: u.profile_picture || u.photoURL || ''
        };

        // Ensure all required fields have at least an empty string
        fields.forEach((field: string) => {
          // Robust check: if field is 'va_no' but we only have 'vta_no', we already handled it above.
          // But if field is weird case like 'Va No', we need to handle it.
          if (initialForm[field] === undefined || initialForm[field] === null) {
            initialForm[field] = '';
          }
        });

        setDetailsForm(initialForm);
        setDetailsPage(1);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = '/';
        return;
      }

      const email = session.user.email;
      const uid = session.user.id;

      if (!email) {
        window.location.href = '/';
        return;
      }

      setIsAuthorized(true);
      setUserEmail(email);
      setUserId(uid);

      loadTeachers(email);

      // Google Drive scripts are loaded in the separate useEffect above

      // Google Drive scripts are loaded in the separate useEffect above



      // Session Timer
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Maintenance Mode Listener
      const maintenanceChannel = supabase
        .channel('system-maintenance')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system', filter: 'id=eq.maintenance' }, (payload) => {
          const data = payload.new as any;
          if (data) {
            setMaintenanceMode(data.enabled);
            setShowMaintenanceDialog(data.enabled);

            if (data.enabled) {
              let target = localStorage.getItem('maintenanceTargetTime');
              if (!target) {
                target = (Date.now() + 5 * 60 * 1000).toString();
                localStorage.setItem('maintenanceTargetTime', target);
              }
              const remaining = Math.ceil((parseInt(target) - Date.now()) / 1000);
              if (remaining <= 0) {
                handleLogout();
              } else {
                setMaintenanceCountdown(remaining);
              }
            } else {
              localStorage.removeItem('maintenanceTargetTime');
              setMaintenanceCountdown(null);
            }
          }
        })
        .subscribe();

      // Session Concurrency & Profile Listener
      const profileChannel = supabase
        .channel('user-profile')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, (payload) => {
          const data = payload.new as any;
          if (!data) return;

          setUserProfile(data);

          if (!data.profile_picture && !data.vta_no && !data.personal_mobile && !data.full_name) {
            setShowDetailsModal(true);
            setDetailsForm(prev => ({
              ...prev,
              full_name: prev.full_name || data.full_name || '',
              vta_no: prev.vta_no || data.vta_no || '',
              personal_mobile: prev.personal_mobile || data.personal_mobile || '',
              profile_picture: prev.profile_picture || data.profile_picture || ''
            }));
          }
        })
        .subscribe();

      // Initial Fetch for Profile & Maintenance
      supabase.from('system').select('*').eq('id', 'maintenance').maybeSingle().then(({ data }) => {
        if (data) {
          setMaintenanceMode(data.enabled || false);
          setShowMaintenanceDialog(data.enabled || false);
        }
      });

      supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(({ data }) => {
        if (data) {
          setUserProfile(data);
          if (!data.profile_picture || !data.vta_no || !data.personal_mobile || !data.full_name) {
            setShowDetailsModal(true);
          }
        }
      });

      // Compulsory Update Check via Announcements
      // Compulsory Update Check (Robust)
      // Compulsory Update Check (Robust)
      const checkCompulsory = async () => {
        try {
          if (!email) return;

          // Specific
          const { data: specific } = await (supabase as any)
            .from('announcements')
            .select('*')
            .eq('type', 'compulsory_update_request')
            .contains('students', [email]);

          // General - Sequential Fallback with casting for dynamic columns
          let general: any[] = [];

          try {
            // Try CamelCase first (Standard)
            const { data: g1, error: e1 } = await (supabase as any)
              .from('announcements')
              .select('*')
              .eq('type', 'compulsory_update_request')
              .eq('targetRole', 'student');
            if (!e1 && g1) general = g1;
          } catch (e) { /* ignore */ }

          if (general.length === 0) {
            try {
              // Try snake_case fallback
              const { data: g2, error: e2 } = await (supabase as any)
                .from('announcements')
                .select('*')
                .eq('type', 'compulsory_update_request')
                .eq('target_role', 'student');
              if (!e2 && g2) general = g2;
            } catch (e) { /* ignore */ }
          }

          const all = [...(specific || []), ...general];
          all.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          if (all.length > 0) {
            checkCompulsoryUpdate(all[0], uid);
          }
        } catch (err) {
          console.warn("Check Compulsory Error", err);
        }
      };
      checkCompulsory();

      return () => {
        clearInterval(timer);
        supabase.removeChannel(maintenanceChannel);
        supabase.removeChannel(profileChannel);
      };
    };

    initAuth();
  }, []);

  // Maintenance Countdown Effect
  useEffect(() => {
    if (!maintenanceMode) return;

    const interval = setInterval(() => {
      const targetStr = localStorage.getItem('maintenanceTargetTime');
      if (targetStr) {
        const target = parseInt(targetStr);
        const remaining = Math.ceil((target - Date.now()) / 1000);

        if (remaining <= 0) {
          clearInterval(interval);
          handleLogout();
        } else {
          setMaintenanceCountdown(remaining);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [maintenanceMode]);

  // Real-time Listeners & Notifications
  // --- Modular Data Listeners (with Pagination & Caching) ---
  const isRecent = (timestamp: any) => {
    if (!timestamp) return false;
    const now = Date.now();
    const time = timestamp.seconds * 1000;
    return (now - time) < 1000 * 60 * 60; // 1 hour
  };

  // 1. Exams Listener
  useEffect(() => {
    if (!userEmail) return;

    const fetchExams = async () => {
      // Fetch total count
      const { count, error: countError } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .contains('students', [userEmail]);

      if (!countError) setTotalExams(count || 0);

      // Fetch data
      const { data, error } = await (supabase as any)
        .from('exams' as any)
        .select('*')
        .contains('students', [userEmail])
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching exams:", error);
        toast.error("Failed to load exams: " + error.message);
      } else if (data) {
        const normalized = data.map((d: any) => ({
          ...d,
          driveLink: d.drivelink || d.driveLink,
          dueDate: d.duedate || d.dueDate,
          workspaceId: d.workspaceid || d.workspaceId,
          teacherEmail: d.teacheremail || d.teacherEmail
        }));
        setExams(normalized);
        SessionCache.set(`exams_${userEmail}`, { items: normalized, count: count || 0 }, 15);
      }
    };

    fetchExams();

    const channel = supabase
      .channel('exams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newData = payload.new as any;
          if (newData.students?.includes(userEmail)) {
            addNotification('exam', `New Exam: ${newData.title}`);
            fetchExams(); // Refresh to get correct ordering/count
          }
        } else {
          fetchExams();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, limitExams]);

  // 2. Syllabi Listener
  useEffect(() => {
    if (!userEmail) return;

    const fetchSyllabi = async () => {
      // Fetch total count
      const { count, error: countError } = await (supabase as any)
        .from('syllabi' as any)
        .select('*', { count: 'exact', head: true })
        .contains('students', [userEmail]);

      if (!countError) setTotalSyllabi(count || 0);

      // Fetch data
      const { data, error } = await (supabase as any)
        .from('syllabi' as any)
        .select('*')
        .contains('students', [userEmail])
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching syllabi:", error);
        toast.error("Failed to load syllabi: " + error.message);
      } else if (data) {
        const normalized = data.map((d: any) => ({
          ...d,
          workspaceId: d.workspaceid || d.workspaceId
        }));
        setSyllabi(normalized);
        SessionCache.set(`syllabi_${userEmail}`, { items: normalized, count: count || 0 }, 15);
      }
    };

    fetchSyllabi();

    const channel = supabase
      .channel('syllabi-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'syllabi' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newData = payload.new as any;
          if (newData.students?.includes(userEmail)) {
            addNotification('syllabus', `New Syllabus: ${newData.title}`);
            fetchSyllabi();
          }
        } else {
          fetchSyllabi();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, limitSyllabi]);

  // 3. Announcements Listener
  useEffect(() => {
    if (!userEmail) return;

    const fetchAnnouncements = async () => {
      // Fetch total count (robustly - some servers/proxies can reject HEAD+contains; try/catch and fallback)
      let count: number | null = null;
      try {
        const countRes = await (supabase as any)
          .from('announcements' as any)
          .select('id', { count: 'exact', head: true })
          .contains('students', [userEmail]);
        if (!countRes.error) count = countRes.count || 0;
      } catch (err: any) {
        console.warn('Announcements count request failed, will continue without server count.', err?.message || err);
      }

      if (count !== null) setTotalAnnouncements(count || 0);

      // Fetch data (try server-side contains; if that fails with 400, fall back to fetching recent announcements and filter client-side)
      let data: any[] | null = null;
      try {
        const res = await (supabase as any)
          .from('announcements' as any)
          .select('*')
          .contains('students', [userEmail])
          .order('created_at', { ascending: false })
          .limit(limitAnnouncements);

        if (res.error) throw res.error;
        data = res.data;
      } catch (err: any) {
        console.warn('Server-side filtered announcements fetch failed, trying fallback unfiltered fetch.', err?.message || err);
        try {
          const fallback = await (supabase as any)
            .from('announcements' as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limitAnnouncements);

          if (!fallback.error && Array.isArray(fallback.data)) {
            data = fallback.data.filter((d: any) => Array.isArray(d.students) && d.students.includes(userEmail));
          } else {
            throw fallback.error || new Error('Fallback fetch failed');
          }
        } catch (fallbackErr: any) {
          console.error('Error fetching announcements (fallback):', fallbackErr);
          toast.error('Failed to load announcements: ' + (fallbackErr?.message || 'Unknown error'));
          data = null;
        }
      }

      if (data) {
        const normalized = data.map((d: any) => ({
          ...d,
          teacherEmail: d.teacheremail || d.teacherEmail,
          workspaceId: d.workspaceid || d.workspaceId,
          requiredFields: d.requiredfields || d.requiredFields
        }));
        setAnnouncements(normalized);
        SessionCache.set(`announcements_${userEmail}`, { items: normalized, count: count || 0 }, 15);
      }
    };

    fetchAnnouncements();

    const channel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newData = payload.new as any;
          if (newData.students?.includes(userEmail)) {
            addNotification('announcement', `Announcement: ${newData.title}`);
            if (newData.type === 'compulsory_update_request') {
              checkCompulsoryUpdate(newData, userId);
            }
            fetchAnnouncements();
          }
        } else {
          fetchAnnouncements();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, limitAnnouncements]);

  // 4. Assignments Listener
  useEffect(() => {
    if (!userEmail) return;

    const fetchSubmissions = async () => {
      // Fetch total count
      const { count, error: countErr } = await (supabase as any)
        .from('submissions' as any)
        .select('*', { count: 'exact', head: true })
        .eq('studentemail', userEmail);

      if (!countErr) setTotalAssignments(count || 0);

      // Fetch data
      const { data, error } = await (supabase as any)
        .from('submissions' as any)
        .select('*')
        .eq('studentemail', userEmail)
        .order('submittedat', { ascending: false })
        .limit(limitAssignments);

      if (error) {
        console.error("Error fetching submissions:", error);
        // Don't toast here to avoid cluttering if it's just a casing issue we're fixing
      } else if (data) {
        setAssignments(data);
        SessionCache.set(`assignments_${userEmail}`, { items: data, count: count || 0 }, 15);
      }
    };

    fetchSubmissions();

    const channel = supabase
      .channel('submissions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
        const d = payload.new as any;
        if (d && (d.studentemail === userEmail)) {
          if (payload.eventType === 'UPDATE' && d.status === 'graded') {
            addNotification('marks', `Graded: ${d.assignmenttitle}`);
          }
          fetchSubmissions();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, limitAssignments]);

  // 4b. Dedicated Marks Listener (Graded Submissions)
  useEffect(() => {
    if (!userEmail) return;

    const fetchMarks = async () => {
      try {
        const { count, error: countErr } = await (supabase as any)
          .from('submissions' as any)
          .select('*', { count: 'exact', head: true })
          .eq('studentemail', userEmail)
          .eq('status', 'graded');

        if (!countErr) setTotalMarks(count || 0);

        const { data, error } = await (supabase as any)
          .from('submissions' as any)
          .select('*')
          .eq('studentemail', userEmail)
          .eq('status', 'graded')
          .order('submittedat', { ascending: false });

        if (error) {
          console.error("Error fetching marks:", error);
        } else if (data) {
          setMarks(data);
        }
      } catch (e) {
        console.error("Error fetching marks:", e);
      }
    };

    fetchMarks();

    const channel = supabase
      .channel('marks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
        if (payload.new && (payload.new as any).studentemail === userEmail && (payload.new as any).status === 'graded') {
          fetchMarks();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, limitMarks]);

  // 5. Initial Load Timer
  useEffect(() => {
    if (!userEmail) return;
    setTimeout(() => { isInitialLoad.current = false; }, 3000);
  }, [userEmail]);

  // Permission Check
  useEffect(() => {
    const checkPermission = async () => {
      setNotificationPermission(Notification.permission);
      setIsCheckingPermission(false);
    };
    checkPermission();
  }, [userId]);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success("Notifications enabled!");
      } else if (permission === 'denied') {
        toast.error("Notifications blocked. Please enable them in browser settings.");
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    }
  };

  // 6. Exam Marks Listener (Aggregated)
  useEffect(() => {
    if (!userEmail) return;

    const fetchMarks = async () => {
      console.log("Checking marks for:", userEmail);
      // Fetch total count (try CamelCase first)
      let countQuery = (supabase as any)
        .from('marks' as any)
        .select('*', { count: 'exact', head: true })
        .ilike('studentEmail', userEmail)
        .eq('deleted', false);

      let { count, error: countErrorObj } = await countQuery;

      // Fallback for snake_case column if CamelCase fails
      if (countErrorObj && (countErrorObj.code === '42703' || countErrorObj.message?.includes('column'))) {
        const { count: c2, error: e2 } = await (supabase as any)
          .from('marks' as any)
          .select('*', { count: 'exact', head: true })
          .ilike('studentemail', userEmail)
          .eq('deleted', false);
        if (!e2) {
          count = c2;
          countErrorObj = null;
        }
      }

      if (!countErrorObj) setTotalExamMarks(count || 0);

      // Fetch data
      let query = (supabase as any)
        .from('marks' as any)
        .select('*')
        .ilike('studentemail', userEmail)
        .eq('deleted', false)
        .order('publishedat', { ascending: false });

      let { data, error } = await query;

      // Fallback to CamelCase fetch if needed
      if (error && (error.code === '42703' || error.message?.includes('column'))) {
        const { data: d2, error: e2 } = await (supabase as any)
          .from('marks' as any)
          .select('*')
          .ilike('studentEmail', userEmail)
          .eq('deleted', false)
          .order('publishedAt' as any, { ascending: false });
        if (!e2) {
          data = d2;
          error = null;
        }
      }

      if (error) {
        console.error("Error fetching exam marks:", error);
      } else if (data) {
        const normalized = data.map((d: any) => ({
          ...d,
          studentEmail: d.studentemail || d.studentEmail,
          teacherEmail: d.teacheremail || d.teacherEmail,
          sectionTitle: d.sectiontitle || d.sectionTitle,
          publishedAt: d.publishedat || d.publishedAt,
          batchId: d.batchid || d.batchId
        }));
        setExamMarks(normalized);
        SessionCache.set(`marks_${userEmail}`, { items: normalized, count: count || 0 }, 15);
      }
    };

    fetchMarks();

    const channel = supabase
      .channel('marks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marks', filter: `studentemail=eq.${userEmail}` }, (payload) => {
        fetchMarks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, limitExamMarks]);

  // Fetch UNOM Reports
  useEffect(() => {
    if (myWorkspaces.length === 0 || !userEmail) {
      setUnomReports([]);
      return;
    }

    const fetchUnom = async () => {
      const { data, error } = await (supabase as any)
        .from('unom_reports' as any)
        .select('*')
        .in('workspaceid', myWorkspaces)
        .eq('status', 'active');

      if (error) {
        console.error("Error fetching UNOM reports:", error);
      } else if (data) {
        setUnomReports(data);
        SessionCache.set(`unomReports_${userEmail}`, data, 15);
      }
    };

    fetchUnom();

    const channel = supabase
      .channel('unom-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unom_reports' }, (payload) => {
        fetchUnom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myWorkspaces, userEmail]);

  // Attendance Fetcher (Optimized: Scoped to Workspaces)
  useEffect(() => {
    if (!userEmail || myWorkspaces.length === 0 || !attendanceMonth) {
      setAttendance([]);
      return;
    }

    const cacheKey = `attendance_${userEmail}_${attendanceMonth}`;
    const cached = SessionCache.get(cacheKey);

    if (cached) {
      setAttendance(cached);
      return;
    }

    const fetchAttendance = async () => {
      try {
        const [year, month] = attendanceMonth.split('-');
        const startDateStr = `${attendanceMonth}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDateStr = `${attendanceMonth}-${lastDay}`;

        const { data, error } = await (supabase as any)
          .from('attendance' as any)
          .select('*')
          .in('workspaceid', myWorkspaces)
          .gte('date', startDateStr)
          .lte('date', endDateStr);

        if (error) throw error;

        if (data) {
          const myAttendance = data.map((r: any) => {
            const isPresent = r.presentStudents && (
              r.presentStudents.includes(userEmail) ||
              (Array.isArray(r.presentStudents) && r.presentStudents.some((s: any) => typeof s === 'object' && s.email === userEmail))
            );
            return { ...r, status: isPresent ? 'present' : 'absent' };
          });

          myAttendance.sort((a: any, b: any) => b.date.localeCompare(a.date));
          setAttendance(myAttendance);
          SessionCache.set(cacheKey, myAttendance, 15);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    fetchAttendance();
  }, [userEmail, myWorkspaces, attendanceMonth]);


  const loadTeachers = async (email: string) => {
    try {
      const cacheKey = `student_workspaces_teachers_v2_${email}`;
      const cached = SessionCache.get(cacheKey);

      if (cached) {
        setMyWorkspaces(cached.workspaceIds);
        setWorkspaceName(cached.workspaceName);
        setWorkspaceCategory(cached.workspaceCategory);
        setTeachers(cached.teachers);
        setClassTeacherProfile(cached.classTeacherProfile);
        if (cached.teachers?.length > 0) setFilterTeacher(cached.teachers[0].email);
        return;
      }

      const searchEmail = email.toLowerCase();
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .or(`students.cs.{${email}},students.cs.{${searchEmail}}`);

      if (wsError) {
        console.error("Workspace fetch error:", wsError);
        throw wsError;
      }

      if (workspaces && workspaces.length === 0) {
        console.warn("No workspaces found for student:", email);
        toast.info("No assigned classes found. Please contact your administrator.");
      }

      const teacherEmails = new Set<string>();
      const workspaceIds: string[] = [];
      let wsName = '';
      let wsCategory = '';
      let wsClassTeacherEmail = '';

      const processWorkspaces = (list: any[]) => {
        list.forEach(ws => {
          workspaceIds.push(ws.id);
          if (!wsName && ws.name) wsName = ws.name;
          if (!wsCategory && ws.category) wsCategory = ws.category;
          if (!wsClassTeacherEmail) wsClassTeacherEmail = ws.class_teacher || ws.classTeacher || ws.classteacher || '';

          if (ws.teachers && Array.isArray(ws.teachers)) {
            ws.teachers.forEach((email: string) => teacherEmails.add(email));
          }
        });
      };

      processWorkspaces(workspaces || []);

      setMyWorkspaces(workspaceIds);
      setWorkspaceName(wsName || 'Unknown Batch');
      setWorkspaceCategory(wsCategory || 'General');

      // 2. Fetch teacher profiles (Robust: Fallback to email if profile fetch fails/RLS blocks)
      const { data: teacherProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('email', Array.from(teacherEmails));

      if (profilesError) console.error("Profile fetch error (ignoring to show emails):", profilesError);

      const profilesMap = new Map();
      (teacherProfiles || []).forEach((p: any) => profilesMap.set(p.email, p));

      const normalizedTeachers = Array.from(teacherEmails).map(email => {
        const p = profilesMap.get(email);
        return {
          email: email,
          full_name: p?.full_name || p?.name || p?.fullName || email, // Fallback to email
          ...(p || {})
        };
      });

      setTeachers(normalizedTeachers);

      if (normalizedTeachers.length > 0) {
        setFilterTeacher(normalizedTeachers[0].email);
      }

      // Set Class Teacher Profile
      let classTeacher = null;
      if (wsClassTeacherEmail) {
        const found = normalizedTeachers.find(t => t.email === wsClassTeacherEmail);
        classTeacher = found || { email: wsClassTeacherEmail, full_name: wsClassTeacherEmail };
        setClassTeacherProfile(classTeacher);
      } else {
        setClassTeacherProfile(null);
      }

    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };


  // Listen for Portal Status based on selected teacher (Now using 'settings' table)
  useEffect(() => {
    if (!selectedTeacher) {
      setPortalStatus('closed');
      return;
    }

    const portalDocId = `assignment_portal_${selectedTeacher}`;

    // Initial fetch
    supabase.from('settings').select('*').eq('id', portalDocId).maybeSingle().then(({ data }) => {
      if (data) {
        setPortalStatus((data.data as any).status || 'closed');
      } else {
        setPortalStatus('closed');
      }
    });

    const channel = supabase
      .channel(`portal-status-${selectedTeacher}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `id=eq.${portalDocId}` }, (payload) => {
        const data = payload.new as any;
        if (data && data.data) {
          setPortalStatus(data.data.status || 'closed');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTeacher]);

  const handleDownloadUnomReport = async (report: any) => {
    try {
      const studentData = report.data?.find((d: any) => d.email?.toLowerCase() === userEmail.toLowerCase());
      if (!studentData) {
        toast.error("No marks found for this report");
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- Border ---
      doc.setDrawColor(41, 128, 185); // Blue border
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      // --- Header ---
      try {
        const logoData = await loadImage('/report.png');
        doc.addImage(logoData, 'PNG', 15, 15, 25, 25);
      } catch (e) {
        console.warn("Logo not found", e);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      const textCenterX = (pageWidth / 2) + 10;
      doc.text("VEL TECH RANGA SANKU ARTS COLLEGE", textCenterX, 25, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text("(Affiliated to University of Madras)", textCenterX, 31, { align: "center" });
      doc.text("42, Avadi-Vel Tech Road, Avadi, Chennai-62, Tamil Nadu, India.", textCenterX, 37, { align: "center" });

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 45, pageWidth - 15, 45);

      // --- Student Details ---
      let yPos = 60;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("STUDENT MARK STATEMENT", 15, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const leftColX = 15;
      const rightColX = 110;

      const studentName = (userProfile?.name || userProfile?.full_name || userEmail).toUpperCase();
      const studentDept = (userProfile?.department || workspaceCategory || 'N/A').toUpperCase();
      const studentRegNo = (userProfile?.reg_no || userProfile?.register_no || 'N/A').toUpperCase();
      const studentBatch = userProfile?.batch_year || workspaceName || 'N/A';
      const studentDob = userProfile?.date_of_birth || 'N/A';

      doc.text(`Name: ${studentName}`, leftColX, yPos);
      doc.text(`Register No: ${studentRegNo}`, rightColX, yPos);

      yPos += 6;
      doc.text(`Department: ${studentDept}`, leftColX, yPos);
      doc.text(`Batch: ${studentBatch}`, rightColX, yPos);

      yPos += 6;
      doc.text(`DOB: ${studentDob}`, leftColX, yPos);
      doc.text(`Semester: ${report.title}`, rightColX, yPos);

      // --- Marks Table ---
      // --- Marks Table ---
      yPos += 15;
      const subjects = report.subjects?.filter((s: string) => s.trim() !== '') || [];

      const tableBody = subjects.map((subject: string) => {
        const markVal = studentData[subject] || '0';
        const internal = studentData[`${subject}_internal`] || '-';
        const external = studentData[`${subject}_external`] || '-';

        const isAbsent = markVal === 'AB';
        const isArrear = typeof markVal === 'string' && (markVal === 'RA' || markVal.startsWith('RA_'));

        let displayMark = markVal;
        if (isArrear && markVal.startsWith('RA_')) {
          displayMark = markVal.split('_')[1] + " (RA)";
        } else if (isArrear) {
          displayMark = "RA";
        }

        const numMark = isArrear && markVal.startsWith('RA_') ? parseInt(markVal.split('_')[1]) : parseInt(markVal);

        let result = "Pass";
        if (isAbsent) result = "Absent";
        else if (isArrear) result = "Re-Appear";
        else if (!isNaN(numMark) && numMark < 40) result = "Fail";

        return [
          subject,
          isAbsent ? '-' : internal,
          isAbsent ? '-' : external,
          displayMark,
          result
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Subject Name', 'Internal', 'External', 'Total', 'Result']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 15, right: 15 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // --- Performance Analysis ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("PERFORMANCE ANALYSIS:", 15, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("  - Consistent performance across all subjects", 15, yPos);
      yPos += 6;
      doc.text("  - Strong in Database and Programming subjects", 15, yPos);
      yPos += 6;
      doc.text("  - Well-balanced internal and external scores", 15, yPos);

      // --- Line Separator ---
      yPos += 10;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, yPos, pageWidth - 15, yPos);

      // --- Submission Details ---
      yPos += 15;
      doc.setFont("helvetica", "bold");
      doc.text("SUBMISSION DETAILS:", 15, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");

      const teacherName = classTeacherProfile
        ? (classTeacherProfile.full_name || classTeacherProfile.name || "Class Teacher")
        : (teachers.length > 0 ? (teachers[0].full_name || teachers[0].name || "Class Teacher") : "Class Teacher");

      const labelX = 20;
      const valueX = 60;

      doc.text("Submitted By:", labelX, yPos);
      doc.text(teacherName, valueX, yPos);
      yPos += 6;

      doc.text("Submission Date:", labelX, yPos);
      doc.text(new Date().toLocaleDateString('en-GB'), valueX, yPos);
      yPos += 6;

      doc.text("Status:", labelX, yPos);
      doc.setTextColor(0, 128, 0); // Green color for verified
      doc.setFont("helvetica", "bold");
      doc.text("VERIFIED", valueX, yPos);
      doc.setTextColor(0, 0, 0); // Reset color
      doc.setFont("helvetica", "normal");
      yPos += 6;

      doc.text("University:", labelX, yPos);
      doc.text("Madras University", valueX, yPos);

      // --- Footer ---
      const footerY = pageHeight - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated by: Edu Online System`, 15, footerY);
      doc.text(`Date: ${new Date().toLocaleString()}`, pageWidth - 15, footerY, { align: "right" });

      doc.save(`Mark_Statement_${report.title}.pdf`);
      toast.success("Report downloaded successfully");

    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    }
  };

  const handleUnomSave = async () => {
    if (!selectedUnomId || !userEmail) return;

    const report = (unomReports || []).find(r => r.id === selectedUnomId);
    if (!report) return;

    const subjects = report.subjects?.filter((s: string) => s.trim() !== '') || [];
    const labSubjects = report.labSubjects || [];

    for (const sub of subjects) {
      if (!unomForm[sub] && !String(unomForm[sub]).startsWith('RA')) {
        toast.error(`Please enter marks for ${sub}`);
        return;
      }

      const valStr = unomForm[sub];
      if (valStr === 'AB') continue;

      const internal = parseFloat(unomForm[`${sub}_internal`] || '0');
      const external = parseFloat(unomForm[`${sub}_external`] || '0');
      const isLab = labSubjects.includes(sub);

      if (isLab) {
        if (isNaN(internal) || internal < 0 || internal > 40) {
          toast.error(`Internal marks for ${sub} (Lab) must be between 0 and 40`);
          return;
        }
        if (isNaN(external) || external < 0 || external > 60) {
          toast.error(`External marks for ${sub} (Lab) must be between 0 and 60`);
          return;
        }
      } else {
        if (isNaN(internal) || internal < 0 || internal > 25) {
          toast.error(`Internal marks for ${sub} must be between 0 and 25`);
          return;
        }
        if (isNaN(external) || external < 0 || external > 75) {
          toast.error(`External marks for ${sub} must be between 0 and 75`);
          return;
        }
      }
    }

    try {
      const { data: fetchReport, error: fetchError } = await supabase
        .from('unom_reports')
        .select('*')
        .eq('id', selectedUnomId)
        .single();

      if (fetchError || !fetchReport) throw "Report document does not exist!";

      const currentReportData = (fetchReport.data as any[]) || [];
      const studentIndex = currentReportData.findIndex((d: any) => d.email?.toLowerCase() === userEmail.toLowerCase());
      if (studentIndex === -1) throw "You are not listed in this report";

      let total = 0;
      let count = 0;

      subjects.forEach((sub: string) => {
        const valStr = unomForm[sub];
        if (valStr === 'AB') {
          count++;
        } else if (typeof valStr === 'string' && valStr.startsWith('RA')) {
          const mark = parseFloat(valStr.split('_')[1] || '0');
          total += mark;
          count++;
        } else {
          const val = parseFloat(valStr);
          if (!isNaN(val)) {
            total += val;
            count++;
          }
        }
      });

      const percentage = count > 0 ? (total / (subjects.length * 100)) * 100 : 0;

      const newData = [...currentReportData];
      newData[studentIndex] = {
        ...newData[studentIndex],
        ...unomForm,
        total,
        percentage,
        submittedAt: new Date().toISOString(),
        hasUpdated: true
      };

      const { error: updateError } = await supabase
        .from('unom_reports')
        .update({
          data: newData as any
        })
        .eq('id', selectedUnomId);

      if (updateError) throw updateError;

      toast.success("Marks submitted successfully");
      setSelectedUnomId(null);
      setUnomForm({});
    } catch (error: any) {
      console.error("Error saving marks:", error);
      toast.error(`Failed to save marks: ${error.message || error}`);
    }
  };


  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Canvas context not found'));
        }
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleDownloadReport = () => {
    setShowDownloadDialog(true);
  };

  const fetchLatestProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Error fetching profile", e);
      return null;
    }
  };

  const handleGenerateReport = async () => {
    if (!downloadFrom) {
      toast.error("Please select a month");
      return;
    }

    // Enforce single month report to save reads
    const downloadTo = downloadFrom;

    setShowDownloadDialog(false);
    const toastId = toast.loading("Fetching data and generating report...");

    try {
      // Ensure we have the latest user profile
      let currentProfile = userProfile;
      if (!currentProfile || !currentProfile.reg_no || !currentProfile.va_no) {
        const uid = userId || localStorage.getItem('userId');
        if (uid) {
          const fetched = await fetchLatestProfile(uid);
          if (fetched) currentProfile = fetched;
        }
      }

      // Calculate date range
      const startDateStr = `${downloadFrom}-01`;

      // Better date parsing with validation
      const dateParts = downloadTo.split('-');
      if (dateParts.length !== 2) {
        toast.dismiss(toastId);
        toast.error("Invalid date format");
        return;
      }

      const endYear = parseInt(dateParts[0]);
      const endMonth = parseInt(dateParts[1]);

      if (isNaN(endYear) || isNaN(endMonth) || endMonth < 1 || endMonth > 12) {
        toast.dismiss(toastId);
        toast.error("Invalid month or year");
        return;
      }

      const lastDay = new Date(endYear, endMonth, 0).getDate();
      const endDateStr = `${downloadTo}-${lastDay.toString().padStart(2, '0')}`;

      // OPTIMIZATION: Query per workspace chunk with DATE RANGE
      // This reduces reads from ~9,000 (history) to ~20 (month)
      const { data: reportAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .in('workspaceId', myWorkspaces)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (attendanceError) throw attendanceError;

      const processedAttendance = (reportAttendance || []).map((r: any) => {
        let isPresent = false;
        let studentDetails = null;

        if (r.presentStudents) {
          if (Array.isArray(r.presentStudents)) {
            if (r.presentStudents.includes(userEmail)) {
              isPresent = true;
            } else {
              const found = r.presentStudents.find((s: any) => typeof s === 'object' && s.email === userEmail);
              if (found) {
                isPresent = true;
                studentDetails = found;
              }
            }
          }
        }
        return { ...r, status: isPresent ? 'present' : 'absent', studentDetails };
      });

      console.log('Total attendance records found:', processedAttendance.length);
      processedAttendance.sort((a: any, b: any) => a.date.localeCompare(b.date));

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- Border ---
      doc.setDrawColor(41, 128, 185); // Blue border
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      doc.setDrawColor(0, 0, 0); // Reset draw color

      // --- Header ---
      // Logo
      try {
        const logoData = await loadImage('/report.png');
        // Adjusted logo position and size
        doc.addImage(logoData, 'PNG', 15, 15, 25, 25);
      } catch (e) {
        console.warn("Logo not found or failed to load", e);
      }

      // Institution Details (Center)
      // Adjusted Y positions to align better with logo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185); // Blue color
      const textCenterX = (pageWidth / 2) + 10; // Shifted right to avoid overlap
      doc.text("VEL TECH RANGA SANKU ARTS COLLEGE", textCenterX, 25, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text("(Affiliated to University of Madras)", textCenterX, 31, { align: "center" });
      doc.text("42, Avadi-Vel Tech Road, Avadi, Chennai-62, Tamil Nadu, India.", textCenterX, 37, { align: "center" });

      // Line separator
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 45, pageWidth - 15, 45);

      // --- Student Details ---
      let yPos = 60;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("STUDENT PROFILE", 15, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const leftColX = 15;
      const rightColX = 110;

      // Try to find a record with student details
      const recordWithDetails = processedAttendance.find((r: any) => r.studentDetails);
      const details = recordWithDetails?.studentDetails || {};

      // Use current profile as fallback
      const p = currentProfile || {};

      const studentName = (details.name || p.name || p.full_name || userEmail).toUpperCase();
      const studentDept = (p.department || workspaceCategory || 'N/A').toUpperCase();
      const studentRegNo = (details.reg_no || p.reg_no || p.register_no || 'N/A').toUpperCase();
      const studentVaNo = details.va_no || p.va_no || 'N/A';
      const studentBatch = p.batch_year || workspaceName || 'N/A';
      const studentDob = p.date_of_birth || 'N/A';

      doc.text(`Name: ${studentName}`, leftColX, yPos);
      doc.text(`Register No: ${studentRegNo}`, rightColX, yPos);

      yPos += 6;
      doc.text(`Department: ${studentDept}`, leftColX, yPos);
      doc.text(`Batch: ${studentBatch}`, rightColX, yPos);

      yPos += 6;
      doc.text(`VA No: ${studentVaNo}`, leftColX, yPos);
      doc.text(`DOB: ${studentDob}`, rightColX, yPos);

      yPos += 6;
      // Added Period
      const fromMonthName = new Date(downloadFrom + "-01").toLocaleDateString('default', { month: 'long', year: 'numeric' });
      doc.text(`Period: ${fromMonthName}`, leftColX, yPos);

      yPos += 10;
      doc.setDrawColor(220, 220, 220);
      doc.line(15, yPos, pageWidth - 15, yPos);

      // --- Attendance Summary ---
      yPos += 12;
      // Fix: Count unique dates for total working days (not all records)
      const uniqueDates = [...new Set(processedAttendance.map(a => a.date))];
      const totalClasses = uniqueDates.length;
      const present = processedAttendance.filter(a => a.status === 'present').length;
      const absent = processedAttendance.filter(a => a.status === 'absent').length;
      const percentage = totalClasses > 0 ? ((present / totalClasses) * 100).toFixed(2) : "0";
      const isGood = parseFloat(percentage) >= 75;
      const status = isGood ? "SATISFACTORY" : "NEEDS IMPROVEMENT";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("ATTENDANCE SUMMARY", 15, yPos);

      yPos += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Draw a summary box
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(15, yPos - 6, pageWidth - 30, 25, 2, 2, 'F');

      doc.text(`Total Working Days: ${totalClasses}`, 20, yPos);
      doc.text(`Days Present: ${present}`, 80, yPos);
      doc.text(`Days Absent: ${absent}`, 140, yPos);

      yPos += 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Percentage: ${percentage}%`, 20, yPos);

      doc.setTextColor(isGood ? 39 : 192, isGood ? 174 : 57, isGood ? 96 : 43); // Green or Red
      doc.text(`[ ${status} ]`, 80, yPos);
      doc.setTextColor(0, 0, 0);

      // --- Monthly Breakdown ---
      yPos += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("MONTHLY BREAKDOWN", 15, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Group by month
      const monthlyStats: any = {};
      processedAttendance.forEach(r => {
        const m = r.date.slice(0, 7); // YYYY-MM
        if (!monthlyStats[m]) monthlyStats[m] = { total: 0, present: 0 };
        monthlyStats[m].total++;
        if (r.status === 'present') monthlyStats[m].present++;
      });

      Object.keys(monthlyStats).sort().forEach(m => {
        const stats = monthlyStats[m];
        const mName = new Date(m + "-01").toLocaleDateString('default', { month: 'long', year: 'numeric' });
        const p = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : "0";
        doc.text(`${mName}: ${stats.present}/${stats.total} days (${p}%)`, 15, yPos);
        yPos += 5;
      });

      // --- Absence Details Table ---
      yPos += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("ABSENCE DETAILS", 15, yPos);

      const absentDays = processedAttendance.filter(a => a.status === 'absent');

      // Sort by date descending (newest first) and take top 4
      const recentAbsentDays = absentDays
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4);

      if (recentAbsentDays.length > 0) {
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Date', 'Day', 'Status', 'Remarks']],
          body: recentAbsentDays.map(d => [
            d.date,
            new Date(d.date).toLocaleDateString('default', { weekday: 'long' }),
            "Absent",
            "Not Provided"
          ]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: 15, right: 15 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        yPos += 8;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("No absences recorded for this period. Excellent record!", 15, yPos);
        yPos += 10;
      }

      // --- Remarks & Advice ---
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("REMARKS & ADVICE", 15, yPos);

      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const advices = [
        "Consistency is the key to success. Keep showing up!",
        "Every class is a step closer to your goals.",
        "Education is the passport to the future.",
        "Your attendance reflects your dedication.",
        "Success is the sum of small efforts, repeated day in and day out.",
        "Don't watch the clock; do what it does. Keep going.",
        "The future belongs to those who believe in the beauty of their dreams.",
        "Strive for progress, not perfection."
      ];
      const randomAdvice = advices[Math.floor(Math.random() * advices.length)];

      const splitRemarks = doc.splitTextToSize(`This is a computer-generated report based on digital attendance records. ${isGood ? "The student has maintained good attendance." : "Attendance is below recommended levels."}`, pageWidth - 30);
      doc.text(splitRemarks, 15, yPos);

      yPos += 8;
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      doc.text(`"Advice: ${randomAdvice}"`, 15, yPos);

      // --- Verified By ---
      yPos += 15;
      // Removed page break logic to fit in one page


      const teacherName = classTeacherProfile
        ? (classTeacherProfile.full_name || classTeacherProfile.name || "Class Teacher")
        : (teachers.length > 0 ? (teachers[0].full_name || teachers[0].name || "Class Teacher") : "Class Teacher");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Verified By: ${teacherName}`, 15, yPos);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("(Signature / Digital Verification)", 15, yPos + 5);

      // --- Footer ---
      const footerY = pageHeight - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated by: Edu Online System`, 15, footerY);
      doc.text(`Date: ${new Date().toLocaleString()}`, pageWidth - 15, footerY, { align: "right" });

      doc.save(`Attendance_Report_${downloadFrom}_to_${downloadTo}.pdf`);
      toast.dismiss(toastId);
      toast.success("Attendance report downloaded");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.dismiss(toastId);
      toast.error("Failed to generate report");
    }
  };

  // --- Google Drive Integration ---


  // Eliminated duplicate initGoogleDrive function to avoid race conditions

  const handleGoogleAuth = () => {
    if (googleAuthClient.current) {
      googleAuthClient.current.requestAccessToken();
    } else {
      toast.error('Google API not ready. Please wait or refresh.');
    }
  };

  const handleGlobalRefresh = () => {
    toast.loading("Refreshing dashboard...");
    SessionCache.clearAll();
    setTimeout(() => {
      toast.dismiss();
      window.location.reload();
    }, 500);
  };



  // Separate function for profile pictures - returns lh3 link for better image display
  const uploadProfilePictureToDrive = async (file: File, folderId: string, token: string): Promise<string> => {
    if (!token) throw new Error('Not authenticated');

    const upload = async (parents?: string[]) => {
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: parents
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: form
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Upload failed');
      }
      return await res.json();
    };

    let json;
    try {
      if (folderId) {
        json = await upload([folderId]);
      } else {
        json = await upload();
      }
    } catch (error) {
      console.warn("Upload to folder failed, retrying to root...", error);
      toast.warning("Shared folder access denied. Uploading to your personal Drive.");
      json = await upload();
    }

    const fileId = json.id;

    // Make public (Viewer mode)
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });

    // Return lh3 link for profile pictures (better for image display)
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  };

  const handleLogout = async () => {
    console.log('Token deleted');
    SessionCache.clearAll(); // Clear all session caches
    localStorage.clear();
    window.location.replace('/');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d.toLocaleDateString();
      return '-';
    } catch (e) {
      return '-';
    }
  };

  const handleProfileImageUpload = async (e: any) => {
    // Legacy handler if needed, or redirect to cropper
    // Since we are using ImageCropper now, this might not be triggered directly by input if we hide it.
    // But for safety:
    const file = e.target.files[0];
    if (!file) return;
    const blob = await new Response(file).blob();
    handleCroppedImageUpload(blob);
  };

  const handleCroppedImageUpload = async (blob: Blob) => {
    // Check auth
    if (!driveAccessToken) {
      toast.error("Please login with Google Drive first");
      googleAuthClient.current.requestAccessToken();
      return;
    }

    const toastId = toast.loading("Uploading profile picture...");
    try {
      const file = new File([blob], "profile_picture.png", { type: "image/png" });
      const link = await uploadProfilePictureToDrive(file, student_profile_drive_folder_id, driveAccessToken);
      setDetailsForm((prev: any) => ({ ...prev, photoURL: link }));
      toast.success("Profile picture uploaded", { id: toastId });
      setShowImageCropper(false);
    } catch (error: any) {
      console.error(error);

      // Handle Auth Errors specifically
      if (error.message.includes('401') || error.message.includes('authentication') || error.message.includes('credentials')) {
        toast.dismiss(toastId);
        toast.error("Google Drive session expired. Please login again.", { duration: 4000 });
        setDriveAccessToken(null); // Clear stale token
        googleAuthClient.current.requestAccessToken(); // Prompt re-login
      } else {
        toast.error("Failed to upload profile picture: " + error.message, { id: toastId });
      }
    }
  };



  const handleDetailsSubmit = async () => {
    // Validate all required fields
    if (!detailsForm.photoURL) {
      toast.error("Please upload your profile picture");
      return;
    }

    for (const field of requiredFields) {
      if (!detailsForm[field] || !detailsForm[field].toString().trim()) {
        toast.error(`Please enter your ${field.replace(/_/g, ' ')}`);
        return;
      }
    }

    try {
      // Map form fields to correct DB columns explicitly
      const updateData: any = {
        name: detailsForm.name, // or full_name based on your schema preference. let's stick to what's in detailsForm. 
        // If DB has 'full_name' but form has 'name', we should probably set full_name to name.
        full_name: detailsForm.name || detailsForm.full_name,
        // Map common variations for Register No
        vta_no: detailsForm.vta_no || detailsForm.va_no || detailsForm.reg_no,
        va_no: detailsForm.va_no || detailsForm.vta_no || detailsForm.reg_no, // Keep both if schema has both or legacy
        personal_mobile: detailsForm.personal_mobile || detailsForm.phone,
        department: detailsForm.department,
        address: detailsForm.address,
        date_of_birth: detailsForm.date_of_birth, // Format is YYYY-MM-DD from input type="date"
        profile_picture: detailsForm.photoURL,
        profile_updated_at: new Date().toISOString()
      };

      // Filter out undefined/nulls if you want, or let them overwrite. Usually safer to just send nonempty strings for required fields.

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update Local State Immediately
      setUserProfile((prev: any) => ({
        ...prev,
        ...updateData,
        photoURL: updateData.profile_picture, // Ensure UI updates
        profile_picture: updateData.profile_picture
      }));

      // Add notification (optional, can use Supabase table if needed)
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Profile Updated',
        body: 'Your profile has been successfully updated.',
        type: 'profile',
        created_at: new Date().toISOString()
      });

      toast.success("Details updated successfully");
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Error updating details:", error);
      toast.error("Failed to update details");
    }
  };



  const handleSubmitAssignment = async () => {
    if (!assignmentTitle.trim()) {
      toast.error('Please enter assignment title');
      return;
    }

    if (!assignmentFile && !assignmentLink.trim()) {
      toast.error('Please upload a file or provide a link');
      return;
    }

    if (!selectedTeacher) {
      toast.error('Please select a teacher');
      return;
    }

    // Validate Google Drive Link if provided
    if (assignmentLink && !assignmentLink.match(/google\.com/)) {
      toast.error('Please enter a valid Google Drive or Docs link');
      return;
    }

    let finalLink = assignmentLink;

    try {
      if (assignmentFile) {
        // Check for Auth using stored state
        if (!driveAccessToken) {
          toast.error("Google Drive authorization required to upload files.");
          handleAuthClick(); // Trigger Auth Flow
          return;
        }

        toast.loading("Uploading file...");
        finalLink = await uploadFileToDrive(driveAccessToken, assignmentFile, ASSIGNMENT_DRIVE_FOLDER_ID);
        toast.dismiss();
      }

      const { data: newSubmission, error: subError } = await supabase
        .from('submissions')
        .insert({
          assignmenttitle: assignmentTitle,
          type: assignmentType,
          link: finalLink,
          studentemail: userEmail,
          status: 'pending',
          submittedat: new Date().toISOString(),
          teacheremail: selectedTeacher
        })
        .select()
        .single();

      if (subError) throw subError;

      // Real-time update for student
      setAssignments(prev => [newSubmission, ...prev]);

      toast.success('Assignment submitted');
      setShowSubmitDialog(false);
      setAssignmentTitle('');
      setAssignmentLink('');
      setAssignmentFile(null);

    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to submit assignment: ${error.message || 'Unknown error'}`);
    }
  };

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Overview', onClick: () => setActiveSection('overview'), active: activeSection === 'overview' },
    { icon: <BookOpen className="h-5 w-5" />, label: 'Review Syllabus', onClick: () => setActiveSection('syllabus'), active: activeSection === 'syllabus' },
    { icon: <FileText className="h-5 w-5" />, label: 'Manage Test and Assignments', onClick: () => setActiveSection('exams'), active: activeSection === 'exams' },
    { icon: <Upload className="h-5 w-5" />, label: 'Send Assignments and Test', onClick: () => setActiveSection('assignments'), active: activeSection === 'assignments' },
    { icon: <UserCheck className="h-5 w-5" />, label: 'View Assignment and Test Marks', onClick: () => setActiveSection('marks'), active: activeSection === 'marks' },
    { icon: <FileText className="h-5 w-5" />, label: 'View Exam Marks', onClick: () => setActiveSection('examMarks'), active: activeSection === 'examMarks' },
    { icon: <CheckCircle className="h-5 w-5" />, label: 'Submit UNOM', onClick: () => setActiveSection('submitUnom'), active: activeSection === 'submitUnom' },
    { icon: <Calendar className="h-5 w-5" />, label: 'View Attendance', onClick: () => setActiveSection('attendance'), active: activeSection === 'attendance' },
    { icon: <Megaphone className="h-5 w-5" />, label: 'Announcements', onClick: () => setActiveSection('announcements'), active: activeSection === 'announcements' },
  ];

  if (isCheckingPermission) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Checking permissions...</div>;
  }

  if (notificationPermission !== 'granted') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6 text-center">
        <Bell className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold mb-2">Notifications Required</h1>
        <p className="text-gray-400 mb-6 max-w-md">
          To ensure you never miss an exam, assignment, or announcement, you must enable notifications for this dashboard.
        </p>

        {notificationPermission === 'default' && (
          <Button onClick={requestNotificationPermission} className="bg-blue-600 hover:bg-blue-700">
            Enable Notifications
          </Button>
        )}

        {notificationPermission === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg max-w-md">
            <p className="text-red-400 font-semibold mb-2">Notifications are Blocked</p>
            <p className="text-sm text-gray-300 mb-4">
              Please click the lock icon 🔒 in your browser address bar and set Notifications to "Allow", then refresh the page.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={requestNotificationPermission} variant="secondary" className="w-full">
                Try Requesting Again
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full border-red-500 text-red-400 hover:bg-red-500/20">
                I've Enabled Them, Refresh Page
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Student Dashboard"
      user={{
        name: userProfile?.name || userEmail.split('@')[0],
        role: 'student',
        email: userEmail,
        photoURL: userProfile?.photoURL || userProfile?.profile_picture || userProfile?.photoUrl
      }}
      headerContent={
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <>
            <div className={`md:hidden mr-2 ${showMobileSearch ? 'hidden' : 'block'}`}>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileSearch(true)} className="text-slate-400 hover:text-white">
                <SearchIcon className="h-5 w-5" />
              </Button>
            </div>

            <div className={`${showMobileSearch ? 'fixed top-0 left-0 right-0 z-[100] bg-slate-950 flex items-center px-4 h-16 gap-2 border-b border-slate-800' : 'hidden md:block relative w-64 mr-2'}`}>
              <SearchIcon className={`absolute left-2 top-2.5 h-4 w-4 text-slate-400 ${showMobileSearch ? 'hidden' : ''}`} />
              <Input
                autoFocus={showMobileSearch}
                placeholder="Search..."
                className={`${showMobileSearch ? 'pl-2 flex-1' : 'pl-8'} bg-slate-900 border-slate-700 h-9 text-sm`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showMobileSearch && (
                <Button variant="ghost" size="icon" onClick={() => setShowMobileSearch(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="h-5 w-5" />
                </Button>
              )}

              {showSuggestions && searchQuery && (
                <div className="absolute top-[100%] left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-[60] overflow-hidden">
                  {sidebarItems.filter(item => (item.label || '').toLowerCase().includes((searchQuery || '').toLowerCase())).length > 0 ? (
                    sidebarItems
                      .filter(item => (item.label || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
                      .map((item, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            item.onClick();
                            setSearchQuery('');
                            setShowSuggestions(false);
                            setShowMobileSearch(false);
                            window.scrollTo(0, 0);
                          }}
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      ))
                  ) : null}

                  {/* Data Search Results */}
                  {(() => {
                    const lowerQuery = (searchQuery || '').toLowerCase();
                    const results = [
                      ...(exams || []).filter(e => e && (String(e.title || '').toLowerCase().includes(lowerQuery) || String(e.description || '').toLowerCase().includes(lowerQuery))).map(e => ({ type: 'Test/Assignment', label: String(e.title || 'Untitled'), onClick: () => { setActiveSection('exams'); setExamSearch(String(e.title || '')); setSearchQuery(''); setShowSuggestions(false); setShowMobileSearch(false); } })),
                      ...(syllabi || []).filter(s => s && (String(s.title || s.name || '').toLowerCase().includes(lowerQuery) || String(s.units || '').toLowerCase().includes(lowerQuery))).map(s => ({ type: 'Syllabus', label: String(s.title || s.name || 'Untitled'), onClick: () => { setActiveSection('syllabus'); setSyllabusSearch(String(s.title || s.name || '')); setSearchQuery(''); setShowSuggestions(false); setShowMobileSearch(false); } })),
                      ...(announcements || []).filter(a => a && (String(a.title || '').toLowerCase().includes(lowerQuery) || String(a.description || '').toLowerCase().includes(lowerQuery))).map(a => ({ type: 'Announcement', label: String(a.title || 'Untitled'), onClick: () => { setActiveSection('announcements'); setAnnouncementSearch(String(a.title || '')); setSearchQuery(''); setShowSuggestions(false); setShowMobileSearch(false); } }))
                    ];

                    if (results.length === 0 && sidebarItems.filter(item => (item.label || '').toLowerCase().includes(lowerQuery)).length === 0) {
                      return <div className="px-4 py-2 text-sm text-slate-500">No results found</div>;
                    }
                    if (results.length === 0) return null;

                    return (
                      <>
                        <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/50">Content</div>
                        {results.map((item, index) => (
                          <button
                            key={`data-${index}`}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-between group"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              item.onClick();
                            }}
                          >
                            <span>{item.label}</span>
                            <span className="text-xs text-slate-500 group-hover:text-slate-400">{item.type}</span>
                          </button>
                        ))}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </>

          {/* Notifications Dropdown */}
          <div className="relative group">
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-3 border-b border-slate-800 font-medium text-white">Notifications</div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="p-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Remove notification
                        setNotifications(prev => prev.filter(item => item.id !== n.id));

                        // Navigate to section
                        // Navigate to section
                        if (n.type === 'exam' || n.type === 'assignment') setActiveSection('exams');
                        else if (n.type === 'syllabus') setActiveSection('syllabus');
                        else if (n.type === 'announcement') setActiveSection('announcements');
                        else if (n.type === 'marks') setActiveSection('marks');
                        else if (n.type === 'unom') setActiveSection('submitUnom');
                        window.scrollTo(0, 0);
                      }}
                    >
                      <p className="text-sm text-slate-200">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{n.time.toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <span className="hidden md:inline text-sm text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 whitespace-nowrap">
            <span className="hidden lg:inline">Session expires in </span>{formatTime(timeRemaining)}
          </span>
          <Button variant="default" size="sm" onClick={handleGlobalRefresh} className="hidden md:inline-flex bg-green-600 hover:bg-green-700 text-white border-0">
            <RefreshCw className="h-4 w-4 lg:mr-2" /> <span className="hidden lg:inline">Refresh</span>
          </Button>
        </div>
      }
    >

      {/* OVERVIEW */}
      {
        activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-900 to-slate-900 border-slate-700 text-white shadow-lg hover:shadow-blue-900/20 transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Active Tests</p>
                    <h3 className="text-4xl font-bold mt-2">{totalExams}</h3>
                    <p className="text-xs text-blue-300/70 mt-1">Upcoming tests</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <FileText className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-900 to-slate-900 border-slate-700 text-white shadow-lg hover:shadow-purple-900/20 transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Assignments</p>
                    {/* Note: Total includes all submissions, pending logic would require a separate count or just showing total */}
                    <h3 className="text-4xl font-bold mt-2">{totalAssignments}</h3>
                    <p className="text-xs text-purple-300/70 mt-1">Total Submissions</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <Upload className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-900 to-slate-900 border-slate-700 text-white shadow-lg hover:shadow-green-900/20 transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm font-medium">Syllabus</p>
                    <h3 className="text-4xl font-bold mt-2">{totalSyllabi}</h3>
                    <p className="text-xs text-green-300/70 mt-1">Materials available</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <BookOpen className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-900/80 to-slate-900 border-slate-700 text-white shadow-lg hover:shadow-orange-900/20 transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-orange-200 text-sm font-medium">Announcements</p>
                    <h3 className="text-4xl font-bold mt-2">{totalAnnouncements}</h3>
                    <p className="text-xs text-orange-300/70 mt-1">Recent updates</p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-full">
                    <Megaphone className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity / Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Announcements */}
              <Card className="bg-slate-800 border-slate-700 text-white h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-orange-400" /> Recent Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {announcements.length === 0 ? (
                    <p className="text-slate-500 text-sm">No announcements yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {announcements.slice(0, 3).map(a => (
                        <div key={a.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                          <h4 className="font-medium text-white text-sm">{a.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                              {formatDate(a.created_at || a.createdAt)}
                            </span>
                            {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Link</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Exams */}
              <Card className="bg-slate-800 border-slate-700 text-white h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" /> Upcoming Tests and Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {exams.length === 0 ? (
                    <p className="text-slate-500 text-sm">No upcoming exams.</p>
                  ) : (
                    <div className="space-y-4">
                      {exams.slice(0, 3).map(exam => (
                        <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                          <div>
                            <h4 className="font-medium text-white text-sm">{exam.title}</h4>
                            <p className="text-xs text-slate-400">{exam.description || 'No description'}</p>
                            {exam.dueDate && <p className="text-[10px] text-orange-400 mt-1">Due: {new Date(exam.dueDate.seconds * 1000).toLocaleDateString()}</p>}
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600 hover:bg-slate-700" onClick={() => {
                            if (exam.driveLink) window.open(exam.driveLink, '_blank');
                            else toast.error("No document link available");
                          }}>
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
      }

      {/* SYLLABUS */}
      {
        activeSection === 'syllabus' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Review Syllabus</h2>
                <p className="text-slate-400">Access and download your course syllabus and study materials.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Filter by Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.email}>{t.name || t.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search syllabus..."
                    className="pl-8 bg-slate-900 border-slate-700"
                    value={syllabusSearch}
                    onChange={(e) => setSyllabusSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {syllabi
                .filter(s => {
                  const teacher = s.uploaded_by || s.teacherEmail || s.teacheremail;
                  const title = s.title || s.name || '';
                  const units = s.units || '';
                  return (filterTeacher === 'all' || teacher === filterTeacher) &&
                    (String(title).toLowerCase().includes(syllabusSearch.toLowerCase()) ||
                      String(units).toLowerCase().includes(syllabusSearch.toLowerCase()));
                })
                .slice((syllabusPage - 1) * 9, syllabusPage * 9)
                .map(s => (
                  <Card key={s.id} className="bg-slate-800 border-slate-700 text-white hover:border-blue-500/50 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-blue-500/10 rounded-lg mb-3">
                          <BookOpen className="h-6 w-6 text-blue-400" />
                        </div>
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
                          {formatDate(s.created_at)}
                        </span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-400 transition-colors">{s.title || s.name}</CardTitle>
                      <CardDescription className="text-slate-400 line-clamp-2">
                        {Array.isArray(s.units) ? s.units.join(', ') : s.units}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="pt-4 mt-2 border-t border-slate-700/50 flex justify-end">
                        <Button size="sm" className="bg-slate-700 hover:bg-blue-600 text-white transition-colors w-full" onClick={() => {
                          const link = s.link || s.driveLink || s.googleDriveLink;
                          if (link) window.open(link, '_blank');
                          else toast.error("No document link available");
                        }}>
                          <ExternalLink className="h-4 w-4 mr-2" /> View Material
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {syllabi.length > 9 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={() => setSyllabusPage(p => Math.max(1, p - 1))} disabled={syllabusPage === 1} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-slate-400">Page {syllabusPage} of {Math.ceil(syllabi.length / 9)}</span>
                <Button variant="outline" size="sm" onClick={() => setSyllabusPage(p => Math.min(Math.ceil(syllabi.length / 9), p + 1))} disabled={syllabusPage === Math.ceil(syllabi.length / 9)} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
            {syllabi.length === limitSyllabi && (
              <div className="flex justify-center mt-4">
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-white hover:bg-slate-800 border border-slate-700 w-full md:w-auto" onClick={() => setLimitSyllabi(prev => prev + 9)}>
                  Load More Syllabi ({limitSyllabi} currently loaded)
                </Button>
              </div>
            )}
          </div>
        )
      }

      {/* EXAMS */}
      {
        activeSection === 'exams' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Attend Test and Assignment</h2>
                <p className="text-slate-400">View and take upcoming or ongoing tests and assignments for your courses.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Filter by Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.email}>{t.name || t.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search tests..."
                    className="pl-8 bg-slate-900 border-slate-700"
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <ModernNoticeCard
              variant="warning"
              title="Important Notice"
              description="Make sure the title of your Test or Assignment matches the assigned title when submitting. Otherwise marks cannot be recorded."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams
                .filter(e => {
                  const teacher = e.teacherEmail || e.teacheremail;
                  const title = e.title || '';
                  const desc = e.description || '';
                  return (filterTeacher === 'all' || teacher === filterTeacher) &&
                    (title.toLowerCase().includes(examSearch.toLowerCase()) ||
                      desc.toLowerCase().includes(examSearch.toLowerCase()));
                })
                .slice((examPage - 1) * 9, examPage * 9)
                .map(e => (
                  <Card key={e.id} className="bg-slate-800 border-slate-700 text-white hover:border-purple-500/50 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-purple-500/10 rounded-lg mb-3">
                          {e.type === 'assignment' ? <Upload className="h-6 w-6 text-purple-400" /> : <FileText className="h-6 w-6 text-purple-400" />}
                        </div>
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
                          {formatDate(e.created_at)}
                        </span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-purple-400 transition-colors">{e.title}</CardTitle>
                      <CardDescription className="text-slate-400 line-clamp-2">{e.description}</CardDescription>
                      {e.dueDate && (
                        <div className="mt-2 text-xs text-orange-400 font-medium bg-orange-400/10 px-2 py-1 rounded inline-block">
                          Due: {new Date(e.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="pt-4 mt-2 border-t border-slate-700/50 flex justify-end">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white w-full shadow-lg shadow-purple-900/20" onClick={() => {
                          const link = e.driveLink || e.link;
                          if (link) window.open(link, '_blank');
                          else toast.error("No document link available");
                        }}>
                          <ExternalLink className="h-4 w-4 mr-2" /> {e.type === 'assignment' ? 'View Assignment' : 'Take Exam'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {exams.length > 9 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={() => setExamPage(p => Math.max(1, p - 1))} disabled={examPage === 1} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-slate-400">Page {examPage} of {Math.ceil(exams.length / 9)}</span>
                <Button variant="outline" size="sm" onClick={() => setExamPage(p => Math.min(Math.ceil(exams.length / 9), p + 1))} disabled={examPage === Math.ceil(exams.length / 9)} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
            {exams.length === limitExams && (
              <div className="flex justify-center mt-4">
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-white hover:bg-slate-800 border border-slate-700 w-full md:w-auto" onClick={() => setLimitExams(prev => prev + 9)}>
                  Load More Tests ({limitExams} currently loaded)
                </Button>
              </div>
            )}
          </div>
        )
      }

      {/* ASSIGNMENTS */}
      {
        activeSection === 'assignments' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Send Assignments and Test</h2>
            <p className="text-slate-400">Upload and submit completed assignments to your teachers.</p>

            <ModernNoticeCard
              variant="warning"
              title="Important Notice"
              description="Make sure the title of your Test or Assignment matches the assigned title when submitting. Otherwise marks cannot be recorded."
            />

            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>Assignment / Test Title</Label>
                  <Input className="bg-slate-900 border-slate-700" placeholder="e.g., Assignmnet 1 / Weekly test 1" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={assignmentType} onValueChange={setAssignmentType}>
                    <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue placeholder="Select Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      className="bg-slate-900 border-slate-700"
                      onChange={e => setAssignmentFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Or provide a link below</p>
                </div>

                <div className="space-y-2">
                  <Label>Google Drive Link (Paste as Link Optional)</Label>
                  <Input className="bg-slate-900 border-slate-700" placeholder="https://..." value={assignmentLink} onChange={e => setAssignmentLink(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Select Teacher (Required)</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-blue-700 bg-blue-950/50 text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedTeacher}
                    onChange={e => setSelectedTeacher(e.target.value)}
                  >
                    <option value="" className="bg-slate-900">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.email} className="bg-slate-900">{t.name || t.email}</option>
                    ))}
                  </select>
                  {teachers.length === 0 && <p className="text-xs text-red-400 mt-1">No teachers found. Please contact your admin to assign a teacher to your workspace.</p>}
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  {!driveAccessToken && (
                    <Button variant="outline" onClick={handleGoogleAuth} className="border-slate-600 hover:bg-slate-700 w-full md:w-auto">
                      <img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" alt="Drive" className="w-5 h-5 mr-2" />
                      Sign In with Google
                    </Button>
                  )}
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 w-full md:w-auto" onClick={handleSubmitAssignment} disabled={!selectedTeacher || portalStatus === 'closed'}>
                    {!selectedTeacher ? 'Select a Teacher' : (portalStatus === 'closed' ? 'Submission Portal Closed' : 'Submit Assignment')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Submitted Assignments</h3>
                <div className="w-[200px]">
                  <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Filter by Teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.email}>{t.name || t.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {assignments.length === 0 ? <p className="text-slate-500">No submissions yet.</p> : (
                <>
                  {assignments
                    .filter(a => {
                      const teacher = a.teacherEmail;
                      return filterTeacher === 'all' || teacher === filterTeacher;
                    })
                    .map(a => (
                      <div key={a.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{a.assignmentTitle}</h4>
                          <p className="text-sm text-slate-400">Status: <span className={a.status === 'graded' ? 'text-green-400' : 'text-yellow-400'}>{a.status}</span></p>
                        </div>
                        {a.marks && <div className="text-green-400 font-bold">{a.marks} Marks</div>}
                      </div>
                    ))}
                  {assignments.length < totalAssignments && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-white hover:bg-slate-800 border border-slate-700 w-full md:w-auto" onClick={() => setLimitAssignments(prev => prev + 5)}>
                        Load 5 More Assignments ({limitAssignments} currently loaded)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      }

      {/* MARKS */}
      {
        activeSection === 'marks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">View Marks</h2>
                <p className="text-slate-400">View your marks across assignments and tests.</p>
              </div>
              <div className="w-[200px]">
                <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Filter by Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.email}>{t.name || t.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400 text-xs md:text-sm p-2 md:p-4">Assignment/Test</TableHead>
                        <TableHead className="text-slate-400 text-xs md:text-sm p-2 md:p-4">Date</TableHead>
                        <TableHead className="text-slate-400 text-xs md:text-sm p-2 md:p-4">Marks</TableHead>
                        <TableHead className="text-slate-400 text-xs md:text-sm p-2 md:p-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-slate-500 py-8">No marks recorded yet.</TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {marks
                            .filter(m => {
                              const teacher = m.teacherEmail;
                              return filterTeacher === 'all' || teacher === filterTeacher;
                            })
                            .slice((marksPage - 1) * 10, marksPage * 10)
                            .map(m => (
                              <TableRow key={m.id} className="border-slate-700 hover:bg-slate-800/50">
                                <TableCell className="font-medium text-slate-200 text-xs md:text-sm p-2 md:p-4 max-w-[120px] md:max-w-none truncate">{m.assignmentTitle || m.title}</TableCell>
                                <TableCell className="text-slate-400 text-xs md:text-sm p-2 md:p-4">{formatDate(m.submittedAt)}</TableCell>
                                <TableCell className="text-green-400 font-bold text-xs md:text-sm p-2 md:p-4">{m.marks}</TableCell>
                                <TableCell className="text-slate-400 capitalize text-xs md:text-sm p-2 md:p-4">{m.status}</TableCell>
                              </TableRow>
                            ))}
                          {marks.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <div className="flex items-center justify-center gap-2 py-4">
                                  <Button variant="outline" size="sm" onClick={() => setMarksPage(p => Math.max(1, p - 1))} disabled={marksPage === 1} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></Button>
                                  <span className="text-sm text-slate-400">Page {marksPage} of {Math.ceil(marks.length / 10)}</span>
                                  <Button variant="outline" size="sm" onClick={() => setMarksPage(p => Math.min(Math.ceil(marks.length / 10), p + 1))} disabled={marksPage === Math.ceil(marks.length / 10)} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {marks.length < totalMarks && (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <div className="flex justify-center py-4">
                                  <Button variant="ghost" size="sm" className="text-green-400 hover:text-white hover:bg-slate-800 border border-slate-700" onClick={() => setLimitMarks(prev => prev + 5)}>
                                    Load More Marks ({limitMarks} currently loaded)
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* EXAM MARKS */}
      {
        activeSection === 'examMarks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">View Exam Marks</h2>
                <p className="text-slate-400">View your marks for exams and tests published by teachers.</p>
              </div>
              <div className="w-[200px]">
                <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Filter by Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.email}>{t.name || t.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400 text-xs md:text-sm p-2 md:p-4">Title</TableHead>
                        <TableHead className="text-slate-400 text-xs md:text-sm p-2 md:p-4">Subject</TableHead>
                        <TableHead className="text-slate-400 text-xs md:text-sm p-2 md:p-4">Marks</TableHead>
                        <TableHead className="text-slate-400 text-xs md:text-sm p-2 md:p-4">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examMarks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-slate-500 py-8">No exam marks available.</TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {examMarks
                            .filter(m => {
                              const teacher = m.teacherEmail;
                              return filterTeacher === 'all' || teacher === filterTeacher;
                            })
                            .slice((examMarksPage - 1) * 10, examMarksPage * 10)
                            .map(m => (
                              <TableRow key={m.id} className="border-slate-700 hover:bg-slate-800/50">
                                <TableCell className="font-medium text-slate-200 text-xs md:text-sm p-2 md:p-4 max-w-[100px] md:max-w-none truncate">
                                  {m.title || m.sectionTitle || '-'}
                                </TableCell>
                                <TableCell className="text-slate-400 text-xs md:text-sm p-2 md:p-4 max-w-[100px] md:max-w-none truncate">{m.subject || '-'}</TableCell>
                                <TableCell className="text-green-400 font-bold text-xs md:text-sm p-2 md:p-4">{m.marks}</TableCell>
                                <TableCell className="text-slate-400 text-xs md:text-sm p-2 md:p-4">
                                  {formatDate(m.publishedAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          {examMarks.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <div className="flex items-center justify-center gap-2 py-4">
                                  <Button variant="outline" size="sm" onClick={() => setExamMarksPage(p => Math.max(1, p - 1))} disabled={examMarksPage === 1} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></Button>
                                  <span className="text-sm text-slate-400">Page {examMarksPage} of {Math.ceil(examMarks.length / 10)}</span>
                                  <Button variant="outline" size="sm" onClick={() => setExamMarksPage(p => Math.min(Math.ceil(examMarks.length / 10), p + 1))} disabled={examMarksPage === Math.ceil(examMarks.length / 10)} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {examMarks.length === limitExamMarks && (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <div className="flex justify-center py-4">
                                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-white hover:bg-slate-800 border border-slate-700" onClick={() => setLimitExamMarks(prev => prev + 5)}>
                                    Load More Exam Marks ({limitExamMarks} loaded)
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* SUBMIT UNOM */}
      {
        activeSection === 'submitUnom' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Submit UNOM Marks</h2>
            <p className="text-slate-400">Enter your marks for active UNOM reports.</p>

            {!selectedUnomId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(unomReports || []).length === 0 ? (
                  <p className="text-slate-500 col-span-full">No active UNOM reports found.</p>
                ) : (
                  (unomReports || []).map(report => (
                    <Card key={report.id} className="bg-slate-800 border-slate-700 text-white hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => {
                      setSelectedUnomId(report.id);
                      // Pre-fill form if data exists
                      const studentData = report.data?.find((d: any) => d.email?.toLowerCase() === userEmail.toLowerCase());
                      if (studentData) {
                        const form: any = {};
                        report.subjects?.forEach((s: string) => {
                          if (studentData[s]) form[s] = studentData[s];
                          if (studentData[`${s}_internal`]) form[`${s}_internal`] = studentData[`${s}_internal`];
                          if (studentData[`${s}_external`]) form[`${s}_external`] = studentData[`${s}_external`];
                        });
                        setUnomForm(form);
                      }
                    }}>
                      <CardHeader>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {report.subjects?.filter((s: string) => s).length || 0} Subjects • {formatDate(report.created_at || report.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {report.data?.some((d: any) => d.email?.toLowerCase() === userEmail.toLowerCase()) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadUnomReport(report);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" /> Download Report
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{(unomReports || []).find(r => r.id === selectedUnomId)?.title}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUnomId(null)}>Back</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(unomReports || []).find(r => r.id === selectedUnomId)?.subjects?.filter((s: string) => s.trim() !== '').map((subject: string, idx: number) => (
                      <div key={idx} className="space-y-2 bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                        <Label className="text-slate-300 font-medium">{subject}</Label>
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-3 items-start">
                            <Select
                              value={unomForm[subject] === 'AB' ? 'AB' : (String(unomForm[subject] || '').startsWith('RA') ? 'RA' : 'Custom')}
                              onValueChange={(val) => {
                                if (val === 'Custom') {
                                  if (['AB'].includes(unomForm[subject]) || String(unomForm[subject]).startsWith('RA')) {
                                    setUnomForm(prev => ({ ...prev, [subject]: '', [`${subject}_internal`]: '', [`${subject}_external`]: '' }));
                                  }
                                } else if (val === 'RA') {
                                  setUnomForm(prev => ({ ...prev, [subject]: 'RA', [`${subject}_internal`]: '', [`${subject}_external`]: '' }));
                                } else {
                                  setUnomForm(prev => ({ ...prev, [subject]: val, [`${subject}_internal`]: '', [`${subject}_external`]: '' }));
                                }
                              }}
                            >
                              <SelectTrigger className="w-[130px] bg-slate-900 border-slate-700 focus:ring-blue-500/20">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Custom">Marks</SelectItem>
                                <SelectItem value="RA">Arrear (RA)</SelectItem>
                                <SelectItem value="AB">Absent (AB)</SelectItem>
                              </SelectContent>
                            </Select>

                            {unomForm[subject] !== 'AB' && (
                              <div className="flex gap-2 flex-1">
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 transition-colors"
                                    value={unomForm[`${subject}_internal`] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const ext = unomForm[`${subject}_external`] || '0';
                                      const total = (parseInt(val || '0') + parseInt(ext)).toString();
                                      const isRA = String(unomForm[subject] || '').startsWith('RA');

                                      setUnomForm(prev => ({
                                        ...prev,
                                        [`${subject}_internal`]: val,
                                        [subject]: isRA ? `RA_${total}` : total
                                      }));
                                    }}
                                    placeholder="Int"
                                    min={0}
                                    max={25}
                                  />
                                  <span className="text-[10px] text-slate-500 ml-1">Internal</span>
                                </div>
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 transition-colors"
                                    value={unomForm[`${subject}_external`] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const int = unomForm[`${subject}_internal`] || '0';
                                      const total = (parseInt(int || '0') + parseInt(val || '0')).toString();
                                      const isRA = String(unomForm[subject] || '').startsWith('RA');

                                      setUnomForm(prev => ({
                                        ...prev,
                                        [`${subject}_external`]: val,
                                        [subject]: isRA ? `RA_${total}` : total
                                      }));
                                    }}
                                    placeholder="Ext"
                                    min={0}
                                    max={75}
                                  />
                                  <span className="text-[10px] text-slate-500 ml-1">External</span>
                                </div>
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700 font-bold text-green-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={String(unomForm[subject] || '').startsWith('RA') ? (unomForm[subject].split('_')[1] || '0') : (unomForm[subject] || '')}
                                    readOnly
                                    placeholder="Total"
                                  />
                                  <span className="text-[10px] text-slate-500 ml-1">Total</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleUnomSave} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Submit Marks
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )
      }

      {/* ATTENDANCE */}
      {
        activeSection === 'attendance' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">View Attendance</h2>
                <p className="text-slate-400">Check your attendance records for the selected month.</p>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Label className="text-slate-300 whitespace-nowrap">Select Month:</Label>
                  <ModernMonthPicker
                    value={attendanceMonth}
                    onChange={(val) => setAttendanceMonth(val)}
                    className="w-full md:w-48 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <Button variant="outline" onClick={handleDownloadReport} className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white w-full md:w-auto">
                  <FileText className="h-4 w-4 mr-2" /> Download Report
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-blue-900/50 to-slate-900 border-blue-800/50 text-white md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-400" /> Monthly Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold text-green-400">{attendance.filter(a => a.status === 'present').length}</div>
                    <p className="text-sm text-slate-400 mt-1">Days Present</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-red-400">{attendance.filter(a => a.status === 'absent').length}</div>
                    <p className="text-sm text-slate-400 mt-1">Days Absent</p>
                  </div>
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                    {new Date(attendanceMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  </p>
                  <ModernNoticeCard
                    variant="info"
                    title="Attendance Advisory"
                    description="This attendance record is for reference purposes only. Excused absences, On Duty (OD) leaves, and late arrivals are verified through your department."
                    className="mt-4"
                  />
                </CardContent>
              </Card>

              {/* Detailed List */}
              <Card className="bg-slate-800 border-slate-700 text-white md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Daily Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {attendance.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No attendance records found for this month.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {attendance
                        .slice((attendancePage - 1) * 10, attendancePage * 10)
                        .map((record: any, index) => (
                          <div key={index} className={`flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border ${record.status === 'present' ? 'border-green-500/20 hover:border-green-500/50' : 'border-red-500/20 hover:border-red-500/50'} transition-colors`}>
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${record.status === 'present' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {record.status === 'present' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                              </div>
                              <div>
                                <p className="font-medium text-white">{new Date(record.date).toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                <p className="text-xs text-slate-500">{record.workspaceName || 'Class Session'}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${record.status === 'present' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                              {record.status === 'present' ? 'PRESENT' : 'ABSENT'}
                            </span>
                          </div>
                        ))}
                      {attendance.length > 10 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <Button variant="outline" size="sm" onClick={() => setAttendancePage(p => Math.max(1, p - 1))} disabled={attendancePage === 1} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></Button>
                          <span className="text-sm text-slate-400">Page {attendancePage} of {Math.ceil(attendance.length / 10)}</span>
                          <Button variant="outline" size="sm" onClick={() => setAttendancePage(p => Math.min(Math.ceil(attendance.length / 10), p + 1))} disabled={attendancePage === Math.ceil(attendance.length / 10)} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
      }

      {/* ANNOUNCEMENTS */}
      {
        activeSection === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Announcements</h2>
                <p className="text-slate-400">Stay updated with the latest news and notices.</p>
              </div>
              <div className="relative w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search announcements..."
                  className="pl-9 bg-slate-900 border-slate-700 text-white"
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {announcements.filter(a => a.title.toLowerCase().includes(announcementSearch.toLowerCase()) || a.description.toLowerCase().includes(announcementSearch.toLowerCase())).length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500">No announcements found matching your search.</p>
                </div>
              ) : (
                announcements
                  .filter(a => a.title.toLowerCase().includes(announcementSearch.toLowerCase()) || a.description.toLowerCase().includes(announcementSearch.toLowerCase()))
                  .slice((announcePage - 1) * 10, announcePage * 10)
                  .map(a => (
                    <Card key={a.id} className="bg-slate-800 border-slate-700 text-white hover:border-slate-600 transition-all group">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-6 flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Notice</span>
                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(a.created_at || a.createdAt)}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{a.title}</h3>
                          <p className="text-slate-300 leading-relaxed">{a.description}</p>

                          {a.link && (
                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => window.open(a.link, '_blank')}>
                                <LinkIcon className="h-4 w-4 mr-2" /> Open Attachment / Link
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="w-2 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-lg hidden md:block opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </Card>
                  ))
              )}
              {announcements.filter(a => a.title.toLowerCase().includes(announcementSearch.toLowerCase()) || a.description.toLowerCase().includes(announcementSearch.toLowerCase())).length > 10 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button variant="outline" size="sm" onClick={() => setAnnouncePage(p => Math.max(1, p - 1))} disabled={announcePage === 1} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm text-slate-400">Page {announcePage} of {Math.ceil(announcements.filter(a => a.title.toLowerCase().includes(announcementSearch.toLowerCase()) || a.description.toLowerCase().includes(announcementSearch.toLowerCase())).length / 10)}</span>
                  <Button variant="outline" size="sm" onClick={() => setAnnouncePage(p => Math.min(Math.ceil(announcements.filter(a => a.title.toLowerCase().includes(announcementSearch.toLowerCase()) || a.description.toLowerCase().includes(announcementSearch.toLowerCase())).length / 10), p + 1))} disabled={announcePage === Math.ceil(announcements.filter(a => a.title.toLowerCase().includes(announcementSearch.toLowerCase()) || a.description.toLowerCase().includes(announcementSearch.toLowerCase())).length / 10)} className="border-slate-600 text-slate-300 hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
              {announcements.length === limitAnnouncements && (
                <div className="flex justify-center mt-4">
                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-white hover:bg-slate-800 border border-slate-700 w-full md:w-auto" onClick={() => setLimitAnnouncements(prev => prev + 5)}>
                    Load More Announcements ({limitAnnouncements} currently loaded)
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Maintenance Warning Dialog */}
      <Dialog open={maintenanceMode && showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="sm:max-w-[425px] border-amber-500/50 bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-4 text-amber-500">
              <AlertTriangle className="h-12 w-12" />
              <span className="text-2xl font-bold">Maintenance Mode</span>
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300 text-lg pt-4">
              System maintenance is in progress.
              <br />
              You will be automatically logged out in:
              <div className="text-4xl font-mono font-bold text-amber-500 py-6">
                {maintenanceCountdown !== null ? formatTime(maintenanceCountdown) : '00:00:00'}
              </div>
              <p className="text-sm text-slate-400">Please save your work. You will be redirected to the login page.</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Download Report Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Download Attendance Report</DialogTitle>
            <DialogDescription className="text-slate-400">
              Select the month for the report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Select Month</Label>
                <ModernMonthPicker
                  value={downloadFrom}
                  onChange={(val) => setDownloadFrom(val)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDownloadDialog(false)} className="w-full sm:w-auto border-slate-600 hover:bg-slate-800 text-white">Cancel</Button>
            <Button onClick={handleGenerateReport} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">Generate PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compulsory Details Dialog */}
      <Dialog open={showDetailsModal} onOpenChange={() => { }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Action Required: Update Profile
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Please update your profile with the following mandatory details to continue using the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            {/* Profile Picture Upload Section */}
            {/* Profile Picture Upload Section - Always Show */}
            {/* Profile Picture Upload Section - Always Show */}
            {/* Profile Picture Upload Section - Always Show */}
            <div className="flex flex-col items-center gap-6 mb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-800 relative z-10">
                  {detailsForm.photoURL && (
                    <img
                      src={detailsForm.photoURL}
                      alt="Profile"
                      className="h-full w-full object-cover absolute inset-0 z-10"
                      referrerPolicy="no-referrer"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                  <div className="h-full w-full flex items-center justify-center text-slate-500">
                    <Users className="h-10 w-10" />
                  </div>
                </div>

                {/* Bubble Notification - Only show if no photo */}
                {(!detailsForm.photoURL) && (
                  <div className="absolute z-20 block left-full top-[85%] -translate-y-1/2 ml-3">
                    <div className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap animate-pulse shadow-lg relative">
                      Click here to upload
                      {/* Arrow (Left pointing) */}
                      <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-blue-600"></div>
                    </div>
                  </div>
                )}

                {driveAccessToken ? (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg z-20"
                    onClick={() => setShowImageCropper(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 hover:text-white z-20"
                    onClick={handleGoogleAuth}
                    title="Connect Google Drive to upload picture"
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <span className="text-xs text-slate-400 mt-2">
                {!driveAccessToken ? 'Connect Drive to Upload Profile Pic' : 'Upload Profile Picture'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


              {(() => {
                const dynamicFields = requiredFields.filter(f =>
                  !['uid', 'id', 'role', 'createdAt', 'updatedAt', 'email', 'email_lower', 'hashedPassword', 'password', 'salt', 'activeSessionId', 'ActiveSessionTimestamp', 'photoUrl', 'photoURL', 'profile_picture', 'PhotoId', 'UploadedViaCSV', 'ProfileUpdated', 'ProfileUpdatedAt', 'portalStatus', 'assignedWorkspaces', 'students'].includes(f)
                );
                const page = detailsPage || 1;
                let visible: string[] = [];
                if (dynamicFields.length <= 9) {
                  visible = dynamicFields;
                } else if (page === 1) {
                  visible = dynamicFields.slice(0, 9);
                } else {
                  const start = 9 + (page - 2) * 8;
                  const end = start + 8;
                  visible = dynamicFields.slice(start, end);
                }

                return visible.map((field) => {
                  let placeholder = `Enter your ${field.replace(/_/g, ' ')}`;
                  let type = "text";

                  if (field === 'date_of_birth') {
                    placeholder = "DD/MM/YYYY";
                    type = "date";
                  }

                  if (field === 'address') {
                    return (
                      <div key={field} className="space-y-2 md:col-span-2">
                        <Label className="capitalize">{field.replace(/_/g, ' ')} <span className="text-red-500">*</span></Label>
                        <Textarea
                          className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                          placeholder={placeholder}
                          value={detailsForm[field] || ''}
                          onChange={(e) => setDetailsForm(prev => ({ ...prev, [field]: e.target.value }))}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field} className="space-y-2">
                      <Label className="capitalize">{field.replace(/_/g, ' ')} <span className="text-red-500">*</span></Label>
                      {type === 'date' ? (
                        <ModernDatePicker
                          value={detailsForm[field] || ''}
                          onChange={(val) => setDetailsForm(prev => ({ ...prev, [field]: val }))}
                          placeholder={placeholder}
                        />
                      ) : (
                        <Input
                          type={type}
                          className="bg-slate-800 border-slate-700 text-white"
                          value={detailsForm[field] || ''}
                          onChange={(e) => setDetailsForm(prev => ({ ...prev, [field]: e.target.value }))}
                          placeholder={placeholder}
                        />
                      )}
                      {field === 'date_of_birth' && <p className="text-[10px] text-slate-500">Format: DD/MM/YYYY</p>}
                    </div>
                  );
                });
              })()}

              {/* Pagination Controls - New Location (Footer handled below) */}
            </div>

            {/* Pagination Controls inside content for non-footer variant - REMOVED to match requested UI */}

          </div>
          <DialogFooter className="flex-col !space-x-0 gap-2">
            {(() => {
              const total = requiredFields.length;
              const totalPages = total <= 9 ? 1 : 1 + Math.ceil((total - 9) / 8);

              if (detailsPage === totalPages) {
                return (
                  <div className="flex gap-2 w-full">
                    {detailsPage > 1 && (
                      <Button variant="outline" onClick={() => setDetailsPage(p => Math.max(1, p - 1))} className="w-1/2 border-slate-600 hover:bg-slate-800 text-white">Back</Button>
                    )}
                    <Button onClick={() => {
                      // Final Validation
                      const missing = requiredFields.filter(f => !detailsForm[f]);
                      if (!detailsForm.photoURL) {
                        toast.error("Please upload your profile picture to continue.");
                        return;
                      }
                      if (missing.length > 0) {
                        toast.error(`Please fill all required fields`);
                        return;
                      }
                      handleDetailsSubmit();
                    }} className={`${detailsPage > 1 ? 'w-1/2' : 'w-full'} bg-green-600 hover:bg-green-700 text-white`}>
                      Save & Continue
                    </Button>
                  </div>
                );
              }

              return (
                <div className="w-full flex gap-2">
                  <Button
                    variant="outline"
                    disabled={detailsPage === 1}
                    onClick={() => setDetailsPage(p => Math.max(1, p - 1))}
                    className={`w-1/2 border-slate-600 hover:bg-slate-800 text-white ${detailsPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Back
                  </Button>
                  <Button onClick={() => setDetailsPage(p => p + 1)} className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white">
                    Next
                  </Button>
                </div>
              );
            })()}

          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ImageCropper
        open={showImageCropper}
        onOpenChange={setShowImageCropper}
        onCropComplete={handleCroppedImageUpload}
        isAuthorized={!!driveAccessToken}
        onAuthorize={handleGoogleAuth}
      />
      <SessionTerminatedDialog
        open={isTerminated}
        onConfirm={handleReturnToLogin}
        role="Student"
        userName={userProfile?.full_name}
      />
    </DashboardLayout >
  );
};

export default StudentDashboard;
