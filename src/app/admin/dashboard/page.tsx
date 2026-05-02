"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  UserPlus,
  Loader2,
  Users,
  Trash2,
  ArrowLeft,
  CreditCard,
  Sparkles,
  LogOut,
  LogIn,
  Mail,
  Lock,
  Circle,
  Pencil,
  Archive,
  RotateCcw,
  History,
  LockIcon,
  Play,
  AlertTriangle,
  Coffee,
  LayoutDashboard,
  Download,
  Palmtree,
  Stethoscope,
  CalendarPlus,
  Calendar as CalendarIcon,
  ArrowRight,
  Clock,
  ClipboardList,
  ChevronDown,
  CalendarDays,
  FileText,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Plus,
  X,
  ShieldAlert,
  Share2,
  Copy,
  MessageCircle,
  QrCode,
  CalendarClock,
  UtensilsCrossed,
  Wifi,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfMonth,
  endOfYear,
  isAfter,
  isBefore,
  parseISO,
  differenceInMinutes,
  differenceInDays,
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  setMonth,
  setYear
} from 'date-fns';
import { de } from 'date-fns/locale';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser,
  useDoc,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  useAuth
} from '@/firebase';
import { collection, query, doc, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import type { Employee, AdminUser, TimeEntry, ScheduleEntry } from '@/lib/store';
import { addDays, subDays, startOfWeek as startOfWeekFn, isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const MONTHS_LIST = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: 20 }, (_, i) => String(CURRENT_YEAR - i));

/** Nur dieser Nutzer sieht den +Pause/-Pause Modus */
const OBSTGAERTLA_EMAIL = 'rechnung.obstgaertla@gmail.com';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, userError } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const authPromise = isLogin
      ? signInWithEmailAndPassword(auth, email.trim(), password)
      : createUserWithEmailAndPassword(auth, email.trim(), password);

    authPromise
      .then(() => {
        // Auth state listener handles the rest
      })
      .catch((err: any) => {
        console.error("Auth error:", err);
        toast({
          title: "Authentifizierungsfehler",
          description: err.message || "Vorgang fehlgeschlagen. In Inkognito-Fenstern stellen Sie bitte sicher, dass Cookies erlaubt sind.",
          variant: "destructive"
        });
        setIsLoading(false);
      });
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-[#E8EAEF]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (userError) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#E8EAEF] p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Verbindungsfehler</h2>
          <p className="text-muted-foreground mb-4">Firebase konnte nicht initialisiert werden. Dies passiert oft in Inkognito-Fenstern, wenn Drittanbieter-Cookies blockiert sind.</p>
          <Button onClick={() => window.location.reload()}>Seite neu laden</Button>
        </Card>
      </div>
    );
  }

  if (user && !user.isAnonymous) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#E8EAEF] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <CardHeader className="bg-primary p-8 text-primary-foreground text-center">
          <CardTitle className="text-2xl font-bold">ZeitScan Admin</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            {isLogin ? 'Melden Sie sich an, um Ihr Team zu verwalten.' : 'Erstellen Sie ein Konto für Ihre Zeiterfassung.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="name@firma.de"
                  className="pl-10 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Anmelden' : 'Registrieren')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-8 pt-0 flex flex-col gap-4">
          <Button variant="ghost" className="w-full" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Noch kein Konto? Jetzt registrieren' : 'Bereits ein Konto? Hier anmelden'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function DashboardContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const auth = useAuth();

  // Employee CRUD State
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeePosition, setNewEmployeePosition] = useState('');
  const [newEmployeeHours, setNewEmployeeHours] = useState('');
  const [newEmployeePeriod, setNewEmployeePeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [newEmployeeVacation, setNewEmployeeVacation] = useState('');
  const [newEmployeeSickDays, setNewEmployeeSickDays] = useState('');
  const [newEmployeePauseAddMode, setNewEmployeePauseAddMode] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Manual Work Entry Dialog State
  const [isManualWorkEntryOpen, setIsManualWorkEntryOpen] = useState(false);
  const [manualWorkEmployee, setManualWorkEmployee] = useState<Employee | null>(null);
  const [manualWorkDate, setManualWorkDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualWorkStart, setManualWorkStart] = useState('08:00');
  const [manualWorkEnd, setManualWorkEnd] = useState('17:00');
  const [manualWorkBreak, setManualWorkBreak] = useState('30');

  // Edit Employee State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editPeriod, setEditPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [editVacation, setEditVacation] = useState('');
  const [editSickDays, setEditSickDays] = useState('');
  const [editPauseAddMode, setEditPauseAddMode] = useState(false);
  // Pause Add Mode Activation/Deactivation Dialogs
  const [pauseActivationDialogOpen, setPauseActivationDialogOpen] = useState(false);
  const [pauseActivationMode, setPauseActivationMode] = useState<'all' | 'date'>('all');
  const [pauseActivationDate, setPauseActivationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [pauseDeactivationDialogOpen, setPauseDeactivationDialogOpen] = useState(false);
  const [pauseDeactivationMode, setPauseDeactivationMode] = useState<'full' | 'range'>('full');
  const [pauseDeactivationFrom, setPauseDeactivationFrom] = useState('');
  const [pauseDeactivationTo, setPauseDeactivationTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Range-based Absence Booking State (inside Edit Dialog)
  const [absenceType, setAbsenceType] = useState<'VACATION' | 'SICK'>('VACATION');
  const [absenceStart, setAbsenceStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absenceEnd, setAbsenceEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Custom Export Selection State
  const [isCustomExportOpen, setIsCustomExportOpen] = useState(false);
  const [customExportMonth, setCustomExportMonth] = useState(String(new Date().getMonth()));
  const [customExportYear, setCustomExportYear] = useState(String(new Date().getFullYear()));

  // Custom Yearly Export Selection State
  const [isCustomYearExportOpen, setIsCustomYearExportOpen] = useState(false);
  const [customYearExportYear, setCustomYearExportYear] = useState(String(new Date().getFullYear()));

  // Calculated Days for UI feedback
  const absenceDaysCount = useMemo(() => {
    try {
      const start = parseISO(absenceStart);
      const end = parseISO(absenceEnd);
      if (isAfter(start, end)) return 0;
      return differenceInDays(end, start) + 1;
    } catch {
      return 0;
    }
  }, [absenceStart, absenceEnd]);

  // Logs Dialog State
  const [viewingLogsEmployee, setViewingLogsEmployee] = useState<Employee | null>(null);
  const [logsFilter, setLogsFilter] = useState<'month' | 'year' | 'all'>('month');
  const [logsMonth, setLogsMonth] = useState(new Date().getMonth()); // 0-indexed
  const [logsYear, setLogsYear] = useState(new Date().getFullYear());

  // Edit Time Entry State
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [editInTime, setEditInTime] = useState('');
  const [editOutTime, setEditOutTime] = useState('');

  // Individual Absence Dialog State (from Logs view)
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false);
  const [logAbsenceType, setLogAbsenceType] = useState<'VACATION' | 'SICK'>('VACATION');
  const [logAbsenceDate, setLogAbsenceDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Overtime Adjustment State
  const [adjustingEmployee, setAdjustingEmployee] = useState<Employee | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  // Dienstplan State
  const [scheduleWeekStart, setScheduleWeekStart] = useState<Date>(() => startOfWeekFn(new Date(), { weekStartsOn: 1 }));
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [shiftEmployee, setShiftEmployee] = useState('');
  const [shiftDate, setShiftDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('');
  const [shiftNote, setShiftNote] = useState('');
  const [shiftBreakStart, setShiftBreakStart] = useState('');
  const [shiftBreakEnd, setShiftBreakEnd] = useState('');

  // QR Code State
  const [qrCodeEmployee, setQrCodeEmployee] = useState<Employee | null>(null);

  // Location Lock State
  const [isLocationSaving, setIsLocationSaving] = useState(false);

  const isSuperAdmin = user?.email === 'perschkramon@gmail.com';
  const [impersonateAdmin, setImpersonateAdmin] = useState<{ uid: string, email: string } | null>(null);
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const activeAdminUid = impersonateAdmin?.uid || user?.uid;

  const adminDocQuery = useMemoFirebase(() => {
    if (!firestore || !activeAdminUid) return null;
    return doc(firestore, 'adminUsers', activeAdminUid);
  }, [firestore, activeAdminUid]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc<AdminUser>(adminDocQuery);

  // Neuer Benutzer: automatisch 30-Tage-Trial starten
  // Guard: only fire for the user's OWN account (UID must match auth user)
  useEffect(() => {
    if (activeAdminUid && user && !user.isAnonymous && !isAdminLoading && !adminData && firestore && !impersonateAdmin && activeAdminUid === user.uid) {
      setDocumentNonBlocking(doc(firestore, 'adminUsers', activeAdminUid), {
        email: user.email || '',
        isPremium: true,
        trialStartedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }
  }, [user, adminData, isAdminLoading, firestore, activeAdminUid, impersonateAdmin]);

  // Bestehende Benutzer ohne trialStartedAt: Trial jetzt starten
  // Guard: only for own account
  useEffect(() => {
    if (activeAdminUid && user && !user.isAnonymous && adminData && !adminData.trialStartedAt && firestore && !impersonateAdmin && activeAdminUid === user.uid) {
      updateDocumentNonBlocking(doc(firestore, 'adminUsers', activeAdminUid), {
        isPremium: true,
        trialStartedAt: new Date().toISOString(),
      });
    }
  }, [user, adminData, firestore, activeAdminUid, impersonateAdmin]);

  // Trial-Berechnung: trialDays (default 30) ab trialStartedAt
  const { isFeatureActive, trialDaysLeft, trialExpired } = useMemo(() => {
    if (!adminData) return { isFeatureActive: false, trialDaysLeft: 0, trialExpired: false };
    if (!adminData.trialStartedAt) return { isFeatureActive: adminData.isPremium, trialDaysLeft: 0, trialExpired: false };
    const start = new Date(adminData.trialStartedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const trialDuration = adminData.trialDays || 30;
    const daysLeft = Math.max(0, trialDuration - diffDays);
    const expired = daysLeft <= 0;
    // Wenn Trial abgelaufen und isPremium noch true: automatisch deaktivieren
    if (expired && adminData.isPremium && firestore && activeAdminUid && !impersonateAdmin) {
      updateDocumentNonBlocking(doc(firestore, 'adminUsers', activeAdminUid), { isPremium: false });
    }
    return { isFeatureActive: !expired, trialDaysLeft: daysLeft, trialExpired: expired };
  }, [adminData, firestore, activeAdminUid, impersonateAdmin]);

  const employeesQuery = useMemoFirebase(() => {
    if (!firestore || !activeAdminUid) return null;
    return query(collection(firestore, 'employees'), where('adminId', '==', activeAdminUid));
  }, [firestore, activeAdminUid]);

  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesQuery);

  const timeEntriesQuery = useMemoFirebase(() => {
    if (!firestore || !activeAdminUid) return null;
    return query(collection(firestore, 'timeEntries'), where('adminId', '==', activeAdminUid));
  }, [firestore, activeAdminUid]);

  const { data: timeEntries } = useCollection<TimeEntry>(timeEntriesQuery);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !activeAdminUid) return null;
    return query(collection(firestore, 'schedules'), where('adminId', '==', activeAdminUid));
  }, [firestore, activeAdminUid]);

  const { data: schedules } = useCollection<ScheduleEntry>(schedulesQuery);

  const allAdminsQuery = useMemoFirebase(() => {
    if (!firestore || !isSuperAdmin) return null;
    return query(collection(firestore, 'adminUsers'));
  }, [firestore, isSuperAdmin]);

  const { data: allAdmins } = useCollection<AdminUser>(allAdminsQuery);

  const anomaliesMap = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!timeEntries) return map;

    // Group work entries by employee + day
    const byEmpDay = new Map<string, TimeEntry[]>();
    timeEntries.forEach(entry => {
      if (entry.entryType && entry.entryType !== 'WORK') return;
      const dayKey = `${entry.employeeId}_${format(parseISO(entry.clockInTime), 'yyyy-MM-dd')}`;
      if (!byEmpDay.has(dayKey)) byEmpDay.set(dayKey, []);
      byEmpDay.get(dayKey)!.push(entry);
    });

    byEmpDay.forEach((dayEntries, dayKey) => {
      if (dayEntries.length <= 1) return;
      const empId = dayKey.split('_')[0];

      // Check for true duplicates: entries with clockInTime within 60s of each other
      for (let i = 0; i < dayEntries.length; i++) {
        for (let j = i + 1; j < dayEntries.length; j++) {
          const diff = Math.abs(
            parseISO(dayEntries[i].clockInTime).getTime() -
            parseISO(dayEntries[j].clockInTime).getTime()
          );
          if (diff < 60000) { // Within 60 seconds = likely duplicate
            map.set(empId, true);
            return;
          }
        }
      }
    });
    return map;
  }, [timeEntries]);

  // Active Absence Tracker for "From-To" display
  const activeAbsenceMap = useMemo(() => {
    const map = new Map<string, TimeEntry>();
    if (!employees || !timeEntries) return map;

    const now = new Date();
    employees.forEach(emp => {
      const activeEntry = timeEntries.find(e => {
        if (e.employeeId !== emp.id) return false;
        if (e.entryType !== 'SICK' && e.entryType !== 'VACATION') return false;

        const start = startOfDay(parseISO(e.clockInTime));
        const end = e.clockOutTime ? endOfDay(parseISO(e.clockOutTime)) : start;

        return (now >= start && now <= end);
      });
      if (activeEntry) map.set(emp.id, activeEntry);
    });
    return map;
  }, [employees, timeEntries]);

  const statusMap = useMemo(() => {
    const map = new Map<string, 'present' | 'pause' | 'absent' | 'sick' | 'vacation'>();
    if (!employees || !timeEntries) return map;

    employees.forEach(emp => {
      const activeAbsence = activeAbsenceMap.get(emp.id);
      if (activeAbsence) {
        map.set(emp.id, activeAbsence.entryType === 'SICK' ? 'sick' : 'vacation');
        return;
      }

      const empEntries = timeEntries
        .filter(e => e.employeeId === emp.id && (!e.entryType || e.entryType === 'WORK'))
        .sort((a, b) => b.clockInTime.localeCompare(a.clockInTime));

      const lastEntry = empEntries[0];

      if (!lastEntry) {
        map.set(emp.id, 'absent');
      } else if (!lastEntry.clockOutTime) {
        map.set(emp.id, 'present');
      } else if (lastEntry.exitType === 'PAUSE') {
        map.set(emp.id, 'pause');
      } else {
        map.set(emp.id, 'absent');
      }
    });
    return map;
  }, [employees, timeEntries, activeAbsenceMap]);

  /**
   * §4 ArbZG: returns the mandatory break in minutes for a given net worked time.
   * >6h = 30 min | >9h = 45 min | else 0
   * Placed in the first third of the shift (= first half guaranteed).
   */
  const getAutoBreakMins = (netMins: number): number => {
    if (netMins > 9 * 60) return 45;
    if (netMins > 6 * 60) return 30;
    return 0;
  };

  /**
   * Prüft ob pauseAddMode für ein bestimmtes Datum aktiv ist.
   * Berücksichtigt pauseAddModeActivatedAt und pauseAddModeDeactivatedAt.
   */
  const isPauseAddActiveForDate = (emp: Employee, dateKey: string): boolean => {
    // Modus aktuell aktiv
    if (emp.pauseAddMode) {
      if (!emp.pauseAddModeActivatedAt) return true; // kein Startdatum = immer aktiv
      return dateKey >= emp.pauseAddModeActivatedAt.slice(0, 10);
    }
    // Modus deaktiviert, aber mit historischem Zeitfenster
    if (emp.pauseAddModeActivatedAt && emp.pauseAddModeDeactivatedAt) {
      const actDate = emp.pauseAddModeActivatedAt.slice(0, 10);
      const deactDate = emp.pauseAddModeDeactivatedAt.slice(0, 10);
      return dateKey >= actDate && dateKey <= deactDate;
    }
    return false;
  };

  const workedHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!timeEntries || !isFeatureActive) return map;

    const now = new Date();
    const startOfPeriod = period === 'weekly' ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
    const autoBreak = adminData?.autoBreakDeduction === true;
    const isObstHours = adminData?.email === OBSTGAERTLA_EMAIL;

    // Group relevant work entries per employee per day
    const byEmpDay = new Map<string, Map<string, TimeEntry[]>>();

    timeEntries.forEach(entry => {
      if (entry.entryType && entry.entryType !== 'WORK') return;
      const clockIn = parseISO(entry.clockInTime);
      if (!isAfter(clockIn, startOfPeriod) && !isSameDay(clockIn, startOfPeriod)) return;
      const dateKey = format(clockIn, 'yyyy-MM-dd');

      if (!byEmpDay.has(entry.employeeId)) byEmpDay.set(entry.employeeId, new Map());
      const dayMap = byEmpDay.get(entry.employeeId)!;
      if (!dayMap.has(dateKey)) dayMap.set(dateKey, []);
      dayMap.get(dateKey)!.push(entry);
    });

    byEmpDay.forEach((dayMap, empId) => {
      let totalMins = 0;
      const emp = (employees || []).find(e => e.id === empId);
      dayMap.forEach((entries, dateKey) => {
        let netMins = 0;
        let firstInTime = Infinity;
        let lastOutTime = 0;
        // Obstgärtla: cap to scheduled shift start
        const empSchedule = isObstHours && schedules
          ? schedules.find(s => s.employeeId === empId && s.date === dateKey)
          : null;
        let scheduledStartMs: number | null = null;
        if (empSchedule?.shiftStart) {
          const [sh, sm] = empSchedule.shiftStart.split(':').map(Number);
          const sd = new Date(dateKey + 'T00:00:00');
          sd.setHours(sh, sm, 0, 0);
          scheduledStartMs = sd.getTime();
        }
        entries.forEach(e => {
          let inT = parseISO(e.clockInTime).getTime();
          // Cap to scheduled start
          if (scheduledStartMs && inT < scheduledStartMs) inT = scheduledStartMs;
          const outT = e.clockOutTime ? parseISO(e.clockOutTime).getTime() : now.getTime();
          netMins += (outT - inT) / 60000;
          firstInTime = Math.min(firstInTime, inT);
          lastOutTime = Math.max(lastOutTime, outT);
        });
        const grossMins = (lastOutTime - firstInTime) / 60000;
        const actualPauseMins = Math.max(0, grossMins - netMins);

        let effectiveMins: number;
        const isPauseAddDay = isObstHours && emp ? isPauseAddActiveForDate(emp, dateKey) : false;
        if (isPauseAddDay) {
          // pauseAddMode: Arbeitgeber bezahlt Pause → Netto bleibt unverändert
          // Keine Addition, keine Subtraktion der Pause
          effectiveMins = netMins;
        } else if (autoBreak) {
          const requiredPause = getAutoBreakMins(netMins);
          const deficit = Math.max(0, requiredPause - actualPauseMins);
          effectiveMins = Math.max(0, netMins - deficit);
        } else {
          effectiveMins = netMins;
        }
        totalMins += effectiveMins;
      });
      map.set(empId, totalMins / 60);
    });

    return map;
  }, [timeEntries, period, isFeatureActive, adminData, employees, schedules]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees]
      .filter(emp => {
        const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch && (showArchived ? true : !emp.isArchived);
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, searchTerm, showArchived]);

  // Helper: compute the reference date range for logs filters
  const logsDateRange = useMemo(() => {
    if (logsFilter === 'all') return { start: new Date(0), end: new Date(9999, 11, 31) };
    if (logsFilter === 'year') {
      const refDate = setYear(new Date(), logsYear);
      return { start: startOfYear(refDate), end: endOfYear(refDate) };
    }
    // 'month'
    const refDate = setYear(setMonth(new Date(), logsMonth), logsYear);
    return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
  }, [logsFilter, logsMonth, logsYear]);

  const logSummary = useMemo(() => {
    if (!viewingLogsEmployee || !timeEntries) return { work: 0, vacation: 0, sick: 0 };
    const filtered = timeEntries.filter(e => {
      if (e.employeeId !== viewingLogsEmployee.id) return false;
      const date = parseISO(e.clockInTime);
      if (logsFilter === 'all') return true;
      return (isAfter(date, logsDateRange.start) || isSameDay(date, logsDateRange.start)) &&
             (isBefore(date, logsDateRange.end) || isSameDay(date, logsDateRange.end));
    });

    const autoBreakLog = adminData?.autoBreakDeduction === true;
    const isObstLogs = adminData?.email === OBSTGAERTLA_EMAIL;

    // Group work entries by day to compute net, gross and actual pause
    const workByDay = new Map<string, { entries: typeof filtered }>();
    filtered.filter(e => !e.entryType || e.entryType === 'WORK').forEach(e => {
      const dateKey = format(parseISO(e.clockInTime), 'yyyy-MM-dd');
      if (!workByDay.has(dateKey)) workByDay.set(dateKey, { entries: [] });
      workByDay.get(dateKey)!.entries.push(e);
    });

    let totalWorkHours = 0;
    workByDay.forEach(({ entries }, dateKey) => {
      const now = new Date();
      let netMins = 0;
      let firstInTime = Infinity;
      let lastOutTime = 0;
      // Obstgärtla: cap to scheduled shift start
      const empSch = isObstLogs && schedules
        ? schedules.find(s => s.employeeId === viewingLogsEmployee.id && s.date === dateKey)
        : null;
      let schStartMs: number | null = null;
      if (empSch?.shiftStart) {
        const [sh, sm] = empSch.shiftStart.split(':').map(Number);
        const sd = new Date(dateKey + 'T00:00:00');
        sd.setHours(sh, sm, 0, 0);
        schStartMs = sd.getTime();
      }
      entries.forEach(e => {
        let inT = parseISO(e.clockInTime).getTime();
        if (schStartMs && inT < schStartMs) inT = schStartMs;
        const outT = e.clockOutTime ? parseISO(e.clockOutTime).getTime() : now.getTime();
        netMins += (outT - inT) / 60000;
        firstInTime = Math.min(firstInTime, inT);
        lastOutTime = Math.max(lastOutTime, outT);
      });
      const grossMins = (lastOutTime - firstInTime) / 60000;
      const actualPauseMins = Math.max(0, grossMins - netMins);

      let effectiveMins = netMins;
      const isPauseAddDay = isObstLogs && isPauseAddActiveForDate(viewingLogsEmployee, dateKey);
      if (isPauseAddDay) {
        // pauseAddMode: Netto bleibt unverändert — AG zahlt Pause
        effectiveMins = netMins;
      } else if (autoBreakLog) {
        const requiredPause = getAutoBreakMins(netMins);
        const deficit = Math.max(0, requiredPause - actualPauseMins);
        effectiveMins = Math.max(0, netMins - deficit);
      }
      totalWorkHours += effectiveMins / 60;
    });

    return filtered.reduce((acc, e) => {
      if (e.entryType === 'VACATION') {
        const start = parseISO(e.clockInTime);
        const end = e.clockOutTime ? parseISO(e.clockOutTime) : start;
        acc.vacation += differenceInDays(end, start) + 1;
      } else if (e.entryType === 'SICK') {
        const start = parseISO(e.clockInTime);
        const end = e.clockOutTime ? parseISO(e.clockOutTime) : start;
        acc.sick += differenceInDays(end, start) + 1;
      }
      return acc;
    }, { work: totalWorkHours, vacation: 0, sick: 0 });
  }, [viewingLogsEmployee, timeEntries, logsFilter, logsDateRange, adminData, schedules]);

  const fmtDur = (mins: number) => {
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    return `${h}:${String(m).padStart(2, '0')} h`;
  };

  const buildEmployeeBlock = (emp: Employee, entries: TimeEntry[], empSchedules?: ScheduleEntry[], autoBreakDeduction?: boolean) => {
    const sorted = [...entries].sort((a, b) => a.clockInTime.localeCompare(b.clockInTime));

    // Group by calendar date of clockInTime
    const byDate = new Map<string, TimeEntry[]>();
    sorted.forEach(e => {
      const key = format(parseISO(e.clockInTime), 'yyyy-MM-dd');
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(e);
    });

    const HEADER = 'Datum;Wochentag;Kommen;Gehen;Bruttozeit;Tatsächl. Pause;Geplante Pause;Nettoarbeitszeit;Kategorie;Hinweis\n';
    let rows = '';
    let totalNetMins = 0;
    let bookedVacDays = 0;
    let bookedSickDays = 0;

    // Build a map of schedules by date for this employee
    const scheduleByDate = new Map<string, ScheduleEntry>();
    (empSchedules || []).forEach(s => {
      scheduleByDate.set(s.date, s);
    });

    const isObstgaertla = adminData?.email === OBSTGAERTLA_EMAIL || (impersonateAdmin && allAdmins?.find(a => a.id === impersonateAdmin.uid)?.email === OBSTGAERTLA_EMAIL);

    [...byDate.keys()].sort().forEach(dateKey => {
      const dayEntries = byDate.get(dateKey)!;
      const date = parseISO(dateKey);
      const dayName = format(date, 'EEEE', { locale: de });
      const dateStr = format(date, 'dd.MM.yyyy');

      const workEntries = dayEntries
        .filter(e => !e.entryType || e.entryType === 'WORK')
        .sort((a, b) => a.clockInTime.localeCompare(b.clockInTime));

      const absenceEntries = dayEntries.filter(e => e.entryType === 'VACATION' || e.entryType === 'SICK');

      // Absences
      absenceEntries.forEach(e => {
        const clockOut = e.clockOutTime ? parseISO(e.clockOutTime) : null;
        const isMultiDay = clockOut && !isSameDay(parseISO(e.clockInTime), clockOut);
        const dateCellStr = isMultiDay
          ? `${format(parseISO(e.clockInTime), 'dd.MM.yyyy')} - ${format(clockOut!, 'dd.MM.yyyy')}`
          : dateStr;
        const numDays = clockOut ? differenceInDays(clockOut, parseISO(e.clockInTime)) + 1 : 1;
        const label = e.entryType === 'VACATION' ? 'Urlaub' : 'Krank';
        rows += `${dateCellStr};${dayName};-;-;-;-;-;${numDays} Tag(e);${label};\n`;
        if (e.entryType === 'VACATION') bookedVacDays += numDays;
        else bookedSickDays += numDays;
      });

      if (workEntries.length === 0) return;

      let firstIn = parseISO(workEntries[0].clockInTime);
      const lastEntry = workEntries[workEntries.length - 1];
      const lastOut = lastEntry.clockOutTime ? parseISO(lastEntry.clockOutTime) : null;

      // Obstgärtla: Arbeitszeit beginnt erst ab geplantem Schichtbeginn
      const daySchedule = scheduleByDate.get(dateKey);
      const isObstgaertlaShiftCap = isObstgaertla && daySchedule?.shiftStart;
      let scheduledStart: Date | null = null;
      if (isObstgaertlaShiftCap) {
        const [sh, sm] = daySchedule!.shiftStart.split(':').map(Number);
        scheduledStart = new Date(firstIn);
        scheduledStart.setHours(sh, sm, 0, 0);
      }

      // Net = sum of each individual work segment
      let netMins = 0;
      workEntries.forEach(e => {
        let inT = parseISO(e.clockInTime);
        const outT = e.clockOutTime ? parseISO(e.clockOutTime) : new Date();
        // Cap clock-in to scheduled start if MA clocked in early
        if (scheduledStart && inT < scheduledStart) {
          inT = scheduledStart;
        }
        netMins += Math.max(0, differenceInMinutes(outT, inT));
      });
      // Also cap firstIn for gross/display
      if (scheduledStart && firstIn < scheduledStart) {
        firstIn = scheduledStart;
      }

      const grossMins = lastOut
        ? differenceInMinutes(lastOut, firstIn)
        : differenceInMinutes(new Date(), firstIn);
      const actualPauseMins = Math.max(0, grossMins - netMins);

      // §4 ArbZG: top-up pause to legal minimum if too little was taken
      // +Pause Modus CSV-Anpassung NUR für Obstgärtla
      const isPauseAddDay = isObstgaertla && isPauseAddActiveForDate(emp, dateKey);
      let requiredPause: number;
      let pauseDeficit: number;
      let pauseMins: number;
      let effectiveNetMins: number;
      let displayedLastOut = lastOut;

      if (isPauseAddDay && lastOut) {
        // pauseAddMode: Pflichtpause wird dokumentiert (Endzeit erweitert,
        // Pause in erster Hälfte), aber Netto bleibt UNVERÄNDERT — AG zahlt Pause
        requiredPause = getAutoBreakMins(netMins);
        pauseDeficit = Math.max(0, requiredPause - actualPauseMins);
        pauseMins = actualPauseMins + pauseDeficit;
        // Endzeit um fehlende Pause erweitern (nur Dokumentation)
        displayedLastOut = new Date(lastOut.getTime() + pauseDeficit * 60000);
        // Netto bleibt gleich — Arbeitgeber bezahlt die Pause
        effectiveNetMins = netMins;
      } else if (autoBreakDeduction && lastOut) {
        requiredPause = getAutoBreakMins(netMins);
        pauseDeficit = Math.max(0, requiredPause - actualPauseMins);
        pauseMins = actualPauseMins + pauseDeficit;
        effectiveNetMins = Math.max(0, netMins - pauseDeficit);
      } else {
        requiredPause = 0;
        pauseDeficit = 0;
        pauseMins = actualPauseMins;
        effectiveNetMins = netMins;
      }

      // Displayed gross includes the extended end time for pauseAddMode
      const displayedGrossMins = displayedLastOut
        ? differenceInMinutes(displayedLastOut, firstIn)
        : grossMins;

      // Auto-break label: show where the deficit pause is placed (first half of shift)
      // For pauseAddMode: no visible markers at all
      const autoBreakLabel = (!isPauseAddDay && pauseDeficit > 0)
        ? (() => {
          const breakStartMin = Math.round(grossMins * 0.33);
          const bs = new Date(firstIn.getTime() + breakStartMin * 60000);
          const be = new Date(bs.getTime() + pauseDeficit * 60000);
          // Obstgärtla: keine "auto"/"§4 ArbZG" Marker — Pause sieht normal aus
          return isObstgaertla
            ? format(bs, 'HH:mm') + '–' + format(be, 'HH:mm')
            : format(bs, 'HH:mm') + '–' + format(be, 'HH:mm') + ' (+' + pauseDeficit + 'min §4 ArbZG)';
        })()
        : null;

      // For pauseAddMode: place break visually in first half, no auto-marker
      let pauseAddBreakLabel: string | null = null;
      if (isPauseAddDay && pauseDeficit > 0 && lastOut) {
        // Break in the first half of the shift
        const halfShiftMin = Math.round(netMins / 2);
        const bs = new Date(firstIn.getTime() + Math.round(halfShiftMin * 0.5) * 60000);
        const be = new Date(bs.getTime() + pauseDeficit * 60000);
        pauseAddBreakLabel = format(bs, 'HH:mm') + '–' + format(be, 'HH:mm');
      }

      const scheduledBreak = scheduleByDate.get(dateKey);
      const plannedPauseLabel = scheduledBreak
        ? (scheduledBreak.breakStart + (scheduledBreak.breakEnd ? '\u2013' + scheduledBreak.breakEnd : ''))
        : '-';
      const hint = !lastOut ? 'noch aktiv' : (lastEntry.exitType === 'PAUSE' ? 'endet in Pause' : '');

      const netLabel = fmtDur(effectiveNetMins);
      const pauseLabel = isPauseAddDay
        ? (pauseMins > 0 ? fmtDur(pauseMins) + (isObstgaertla ? '' : ' (AG bezahlt)') : '-')
        : (pauseMins > 0 ? fmtDur(pauseMins) + (pauseDeficit > 0 && !isObstgaertla ? ' (+' + pauseDeficit + 'min auto)' : '') : '-');
      const breakHintLabel = isPauseAddDay
        ? (pauseAddBreakLabel || plannedPauseLabel)
        : (autoBreakLabel || plannedPauseLabel);
      const rowHint = (!isPauseAddDay && pauseDeficit > 0 && autoBreakLabel)
        ? (hint ? hint + ' | ' : '') + (isObstgaertla ? '' : 'Pause auto: ') + autoBreakLabel
        : (isPauseAddDay && pauseDeficit > 0 ? (hint ? hint + ' | ' : '') + (isObstgaertla ? '' : 'Pause Modus (AG bezahlt)') : hint);
      rows += `${dateStr};${dayName};${format(firstIn, 'HH:mm')};${displayedLastOut ? format(displayedLastOut, 'HH:mm') : 'offen'};${fmtDur(displayedGrossMins)};${pauseLabel};${breakHintLabel};${netLabel};Arbeit;${rowHint}\n`;
      totalNetMins += effectiveNetMins;
    });

    const totalH = Math.floor(totalNetMins / 60);
    const totalM = totalNetMins % 60;

    const summary =
      `;;;;;;;\n` +
      `GESAMT ${emp.fullName};;;;;;${fmtDur(totalNetMins)};;\n` +
      `Resturlaub (aktuell): ${emp.vacationDays ?? 0} Tage | Urlaub gebucht: ${bookedVacDays} Tage | Krank gebucht: ${bookedSickDays} Tage\n`;

    return { header: HEADER, rows, summary, totalNetMins, bookedVacDays, bookedSickDays };
  };

  const triggerDownload = (csv: string, filename: string) => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = (emp: Employee) => {
    if (!timeEntries) return;
    try {
      const empEntries = timeEntries.filter(e => e.employeeId === emp.id);
      const empSchedules = (schedules || []).filter(s => s.employeeId === emp.id);
      const { header, rows, summary } = buildEmployeeBlock(emp, empEntries, empSchedules, adminData?.autoBreakDeduction === true);

      let csv = `Mitarbeiter: ${emp.fullName}\n`;
      csv += `Position: ${emp.position || 'Mitarbeiter'}\n`;
      csv += `Exportiert am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}\n`;
      csv += `\n`;
      csv += header;
      csv += rows;
      csv += summary;

      triggerDownload(csv, `ZeitScan_${emp.fullName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handleExportAllCSV = (filter: 'month' | 'year' | 'all' | 'custom' | 'custom-year', customDate?: Date) => {
    if (!timeEntries || !employees) return;

    try {
      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      if (filter === 'month') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else if (filter === 'year') {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      } else if (filter === 'custom' && customDate) {
        startDate = startOfMonth(customDate);
        endDate = endOfMonth(customDate);
      } else if (filter === 'custom-year' && customDate) {
        startDate = startOfYear(customDate);
        endDate = endOfYear(customDate);
      } else {
        startDate = new Date(0);
        endDate = new Date(now.getFullYear() + 10, 0, 1);
      }

      const filteredEntries = [...timeEntries].filter(e => {
        const d = parseISO(e.clockInTime);
        return (isAfter(d, startDate) || isSameDay(d, startDate)) && (isBefore(d, endDate) || isSameDay(d, endDate));
      });

      const periodLabel =
        filter === 'all' ? 'Gesamte Historie' :
          `${format(startDate, 'dd.MM.yyyy')} - ${format(endDate, 'dd.MM.yyyy')}`;

      let csv = `ZeitScan Gesamtexport\n`;
      csv += `Zeitraum: ${periodLabel}\n`;
      csv += `Exportiert am: ${format(now, 'dd.MM.yyyy HH:mm')}\n`;
      csv += `\n`;

      const activeEmployees = [...employees]
        .filter(e => !e.isArchived)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      const overviewRows: string[] = [];
      let grandTotalMins = 0;

      activeEmployees.forEach(emp => {
        const empEntries = filteredEntries.filter(e => e.employeeId === emp.id);
        if (empEntries.length === 0) return;

        const empSchedules2 = (schedules || []).filter(s => s.employeeId === emp.id);
        const { header, rows, summary, totalNetMins, bookedVacDays, bookedSickDays } = buildEmployeeBlock(emp, empEntries, empSchedules2, adminData?.autoBreakDeduction === true);

        csv += `=== ${emp.fullName} | ${emp.position || 'Mitarbeiter'} ===\n`;
        csv += header;
        csv += rows;
        csv += summary;
        csv += `\n`;

        grandTotalMins += totalNetMins;
        overviewRows.push(`${emp.fullName};${fmtDur(totalNetMins)};${bookedVacDays} Urlaubstage;${bookedSickDays} Krankheitstage;Resturlaub: ${emp.vacationDays ?? 0} Tage`);
      });

      csv += `\n`;
      csv += `=== GESAMTÜBERSICHT ALLE MITARBEITER ===\n`;
      csv += `Name;Nettoarbeitszeit;Urlaub gebucht;Krank gebucht;Resturlaub\n`;
      csv += overviewRows.join('\n');
      csv += `\n`;
      csv += `GESAMT ALLE;;${fmtDur(grandTotalMins)};;\n`;

      let filename = `ZeitScan_Gesamtexport_${format(now, 'yyyy-MM-dd')}.csv`;
      if (filter === 'custom' && customDate) filename = `ZeitScan_Export_${format(customDate, 'MMMM_yyyy', { locale: de })}.csv`;
      else if (filter === 'custom-year' && customDate) filename = `ZeitScan_Jahresbericht_${format(customDate, 'yyyy')}.csv`;

      triggerDownload(csv, filename);
    } catch (err) {
      console.error('Bulk export failed', err);
    }
  };

  const handleAddEmployee = () => {
    if (!newEmployeeName.trim() || !firestore || !user) return;
    addDocumentNonBlocking(collection(firestore, 'employees'), {
      adminId: activeAdminUid,
      fullName: newEmployeeName,
      position: newEmployeePosition || 'Mitarbeiter',
      agreedHours: Number(newEmployeeHours) || 40,
      agreedHoursPeriod: newEmployeePeriod,
      overtimeBalance: 0,
      vacationDays: Number(newEmployeeVacation) || 0,
      sickDays: Number(newEmployeeSickDays) || 0,
      isArchived: false,
      pauseAddMode: newEmployeePauseAddMode,
      externalEmployeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Mitarbeiter hinzugefügt", description: `${newEmployeeName} wurde angelegt.` });
    setNewEmployeeName(''); setNewEmployeePosition(''); setNewEmployeeHours('');
    setNewEmployeeVacation(''); setNewEmployeeSickDays(''); setNewEmployeePauseAddMode(false);
    setIsAddDialogOpen(false);
  };

  const handleAddManualWorkEntry = () => {
    if (!manualWorkEmployee || !firestore || !user || !manualWorkDate || !manualWorkStart || !manualWorkEnd) {
      toast({ title: "Fehler", description: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }
    const clockIn = new Date(`${manualWorkDate}T${manualWorkStart}:00`);
    const clockOut = new Date(`${manualWorkDate}T${manualWorkEnd}:00`);
    if (clockOut <= clockIn) {
      toast({ title: "Fehler", description: "Ende muss nach dem Start liegen.", variant: "destructive" });
      return;
    }
    // Duplicate check: warn if work entries already exist for this employee + date
    if (timeEntries) {
      const existingForDate = timeEntries.filter(e =>
        e.employeeId === manualWorkEmployee.id &&
        (!e.entryType || e.entryType === 'WORK') &&
        format(parseISO(e.clockInTime), 'yyyy-MM-dd') === manualWorkDate
      );
      if (existingForDate.length > 0) {
        const proceed = window.confirm(
          `Für ${manualWorkEmployee.fullName} existiert am ${format(clockIn, 'dd.MM.yyyy', { locale: de })} bereits ein Arbeitseintrag.\n\nTrotzdem nachtragen?`
        );
        if (!proceed) return;
      }
    }
    const breakMins = parseInt(manualWorkBreak) || 0;
    if (breakMins > 0) {
      const totalMins = (clockOut.getTime() - clockIn.getTime()) / 60000;
      const seg1End = new Date(clockIn.getTime() + Math.floor((totalMins - breakMins) / 2) * 60000);
      const seg2Start = new Date(seg1End.getTime() + breakMins * 60000);
      addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
        adminId: activeAdminUid, employeeId: manualWorkEmployee.id, employeeName: manualWorkEmployee.fullName,
        clockInTime: clockIn.toISOString(), clockOutTime: seg1End.toISOString(),
        entryType: 'WORK', exitType: 'PAUSE', sourceSystem: 'Admin-Dashboard (Nachtrag)',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
        adminId: activeAdminUid, employeeId: manualWorkEmployee.id, employeeName: manualWorkEmployee.fullName,
        clockInTime: seg2Start.toISOString(), clockOutTime: clockOut.toISOString(),
        entryType: 'WORK', exitType: 'END', sourceSystem: 'Admin-Dashboard (Nachtrag)',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    } else {
      addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
        adminId: activeAdminUid, employeeId: manualWorkEmployee.id, employeeName: manualWorkEmployee.fullName,
        clockInTime: clockIn.toISOString(), clockOutTime: clockOut.toISOString(),
        entryType: 'WORK', exitType: 'END', sourceSystem: 'Admin-Dashboard (Nachtrag)',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }
    const netMins = (clockOut.getTime() - clockIn.getTime()) / 60000 - breakMins;
    const h = Math.floor(netMins / 60); const m = Math.round(netMins % 60);
    toast({ title: "Arbeitszeit eingetragen", description: `${manualWorkEmployee.fullName} – ${format(clockIn, 'dd.MM.yyyy')} ${manualWorkStart}–${manualWorkEnd} (${h}h ${m}min netto)` });
    setIsManualWorkEntryOpen(false);
    setManualWorkDate(format(new Date(), 'yyyy-MM-dd'));
    setManualWorkStart('08:00'); setManualWorkEnd('17:00'); setManualWorkBreak('30');
    setManualWorkEmployee(null);
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee || !firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'employees', editingEmployee.id), {
      fullName: editName,
      position: editPosition,
      agreedHours: Number(editHours),
      agreedHoursPeriod: editPeriod,
      vacationDays: Number(editVacation),
      sickDays: Number(editSickDays),
    });
    toast({ title: "Aktualisiert", description: "Daten wurden gespeichert." });
    setEditingEmployee(null);
  };

  /**
   * +Pause Modus AKTIVIEREN: speichert pauseAddMode=true + pauseAddModeActivatedAt
   */
  const handlePauseActivation = () => {
    if (!editingEmployee || !firestore) return;
    const activatedAt = pauseActivationMode === 'all'
      ? (editingEmployee.createdAt || '2020-01-01')
      : pauseActivationDate;
    updateDocumentNonBlocking(doc(firestore, 'employees', editingEmployee.id), {
      pauseAddMode: true,
      pauseAddModeActivatedAt: activatedAt,
      pauseAddModeDeactivatedAt: null,
    });
    setEditPauseAddMode(true);
    setPauseActivationDialogOpen(false);
    toast({
      title: "✅ +Pause Modus aktiviert",
      description: pauseActivationMode === 'all'
        ? `Für ${editingEmployee.fullName} – gesamter Zeitraum.`
        : `Für ${editingEmployee.fullName} – ab ${format(parseISO(pauseActivationDate), 'dd.MM.yyyy')}.`,
    });
  };

  /**
   * +Pause Modus DEAKTIVIEREN (Fehlerkorrektur):
   * - "full": Komplett rückwirkend → alles löschen
   * - "range": Nur für von-bis → Modus aus, aber Effekt bleibt im Fenster
   */
  const handlePauseDeactivation = () => {
    if (!editingEmployee || !firestore) return;
    if (pauseDeactivationMode === 'full') {
      // Vollständig rückwirkend – als wäre es nie aktiviert worden
      updateDocumentNonBlocking(doc(firestore, 'employees', editingEmployee.id), {
        pauseAddMode: false,
        pauseAddModeActivatedAt: null,
        pauseAddModeDeactivatedAt: null,
      });
      setEditPauseAddMode(false);
      toast({
        title: "🔄 +Pause Modus vollständig deaktiviert",
        description: `Alle Pausenberechnungen für ${editingEmployee.fullName} wurden rückwirkend entfernt.`,
      });
    } else {
      // Teilweise rückwirkend – Effekt bleibt nur im angegebenen Zeitfenster
      updateDocumentNonBlocking(doc(firestore, 'employees', editingEmployee.id), {
        pauseAddMode: false,
        pauseAddModeActivatedAt: pauseDeactivationFrom || editingEmployee.pauseAddModeActivatedAt,
        pauseAddModeDeactivatedAt: pauseDeactivationTo,
      });
      setEditPauseAddMode(false);
      toast({
        title: "🔄 +Pause Modus teilweise deaktiviert",
        description: `Effekt bleibt für ${format(parseISO(pauseDeactivationFrom || editingEmployee.pauseAddModeActivatedAt || ''), 'dd.MM.yyyy')} bis ${format(parseISO(pauseDeactivationTo), 'dd.MM.yyyy')}.`,
      });
    }
    setPauseDeactivationDialogOpen(false);
  };

  const handleBookRangeAbsence = () => {
    if (!editingEmployee || !firestore || !user || !absenceStart || !absenceEnd) {
      toast({ title: "Fehler", description: "Bitte Zeitraum wählen.", variant: "destructive" });
      return;
    }

    const start = startOfDay(parseISO(absenceStart));
    const end = endOfDay(parseISO(absenceEnd));
    const numDays = differenceInDays(end, start) + 1;

    if (numDays <= 0) {
      toast({ title: "Fehler", description: "Enddatum muss nach dem Startdatum liegen.", variant: "destructive" });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
      adminId: activeAdminUid,
      employeeId: editingEmployee.id,
      employeeName: editingEmployee.fullName,
      clockInTime: start.toISOString(),
      clockOutTime: end.toISOString(),
      entryType: absenceType,
      sourceSystem: 'Admin-Dashboard (Bereichsbuchung)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const currentVacation = editingEmployee.vacationDays || 0;
    const currentSick = editingEmployee.sickDays || 0;

    updateDocumentNonBlocking(doc(firestore, 'employees', editingEmployee.id), {
      vacationDays: absenceType === 'VACATION' ? Math.max(0, currentVacation - numDays) : currentVacation,
      sickDays: absenceType === 'SICK' ? currentSick + numDays : currentSick,
    });

    toast({
      title: "Buchung erfolgreich",
      description: `${numDays} Tage (${absenceType === 'VACATION' ? 'Urlaub' : 'Krankheit'}) gebucht.`
    });

    setAbsenceStart(format(new Date(), 'yyyy-MM-dd'));
    setAbsenceEnd(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleUpdateTimeEntry = () => {
    if (!editingTimeEntry || !firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'timeEntries', editingTimeEntry.id), {
      clockInTime: new Date(editInTime).toISOString(),
      clockOutTime: editOutTime ? new Date(editOutTime).toISOString() : null,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Eintrag aktualisiert", description: "Buchungszeit wurde angepasst." });
    setEditingTimeEntry(null);
  };

  const handleAddSingleAbsence = () => {
    if (!viewingLogsEmployee || !firestore || !user) return;
    const date = startOfDay(parseISO(logAbsenceDate));

    addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
      adminId: activeAdminUid,
      employeeId: viewingLogsEmployee.id,
      employeeName: viewingLogsEmployee.fullName,
      clockInTime: date.toISOString(),
      clockOutTime: endOfDay(date).toISOString(),
      entryType: logAbsenceType,
      sourceSystem: 'Admin-Dashboard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const currentVacation = viewingLogsEmployee.vacationDays || 0;
    const currentSick = viewingLogsEmployee.sickDays || 0;
    updateDocumentNonBlocking(doc(firestore, 'employees', viewingLogsEmployee.id), {
      vacationDays: logAbsenceType === 'VACATION' ? Math.max(0, currentVacation - 1) : currentVacation,
      sickDays: logAbsenceType === 'SICK' ? currentSick + 1 : currentSick,
    });

    toast({
      title: logAbsenceType === 'VACATION' ? "Urlaub gebucht" : "Krankheit gebucht",
      description: `Eintrag für den ${format(date, 'dd.MM.yyyy')} erstellt und Konto aktualisiert.`
    });
    setIsAbsenceDialogOpen(false);
  };

  const handleAdjustOvertime = () => {
    if (!adjustingEmployee || !firestore) return;
    const current = adjustingEmployee.overtimeBalance || 0;
    const adjustment = Number(adjustmentAmount);
    updateDocumentNonBlocking(doc(firestore, 'employees', adjustingEmployee.id), {
      overtimeBalance: current + adjustment
    });
    toast({ title: "Saldo angepasst", description: `${adjustment > 0 ? '+' : ''}${adjustment}h gebucht.` });
    setAdjustingEmployee(null); setAdjustmentAmount('');
  };

  const handleAddShift = () => {
    if (!shiftEmployee || !shiftDate || !shiftStart || !firestore || !user) return;
    const emp = employees?.find(e => e.id === shiftEmployee);
    if (!emp) return;
    addDocumentNonBlocking(collection(firestore, 'schedules'), {
      adminId: activeAdminUid,
      employeeId: emp.id,
      employeeName: emp.fullName,
      date: shiftDate,
      shiftStart,
      shiftEnd: shiftEnd || '',
      breakStart: shiftBreakStart || '',
      breakEnd: shiftBreakEnd || '',
      note: shiftNote || '',
      createdAt: new Date().toISOString(),
    });
    const endLabel = shiftEnd ? ` - ${shiftEnd}` : ' (offenes Ende)';
    const breakLabel = shiftBreakStart ? ` | Pause: ${shiftBreakStart}${shiftBreakEnd ? `–${shiftBreakEnd}` : ''}` : '';
    toast({ title: 'Schicht eingetragen', description: `${emp.fullName} am ${format(new Date(shiftDate + 'T00:00'), 'dd.MM.yyyy', { locale: de })} von ${shiftStart}${endLabel}${breakLabel}` });
    setIsAddShiftOpen(false);
    setShiftNote('');
    setShiftEnd('');
    setShiftBreakStart('');
    setShiftBreakEnd('');
  };

  const handleDeleteShift = (shift: ScheduleEntry) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'schedules', shift.id));
    toast({ title: 'Schicht gelöscht' });
  };

  const handleDeleteAllData = () => {
    if (!firestore || !activeAdminUid || !employees || !timeEntries) return;

    timeEntries.forEach(entry => {
      deleteDocumentNonBlocking(doc(firestore, 'timeEntries', entry.id));
    });
    employees.forEach(emp => {
      deleteDocumentNonBlocking(doc(firestore, 'employees', emp.id));
    });
    if (schedules) {
      schedules.forEach(sched => {
        deleteDocumentNonBlocking(doc(firestore, 'schedules', sched.id));
      });
    }

    toast({
      title: "Daten gelöscht",
      description: "Alle Mitarbeiter und Zeitprotokolle wurden entfernt."
    });
  };

  const handleSubscribe = async () => {
    if (!user || !activeAdminUid) return;
    try {
      setIsCheckoutLoading(true);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeAdminUid, email: impersonateAdmin?.email || adminData?.email || user.email })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: 'Fehler', description: data.error || 'Checkout konnte nicht geladen werden', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Fehler', description: 'Konnte keine Verbindung zu Stripe herstellen.', variant: 'destructive' });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const toggleArchive = (emp: Employee) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'employees', emp.id), { isArchived: !emp.isArchived });
    toast({ title: emp.isArchived ? "Reaktiviert" : "Archiviert", description: `${emp.fullName} wurde ${emp.isArchived ? "aktiviert" : "archiviert"}.` });
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (!emp.isArchived) {
      toast({ title: "Fehler", description: "Bitte zuerst archivieren.", variant: "destructive" });
      return;
    }
    if (firestore) deleteDocumentNonBlocking(doc(firestore, 'employees', emp.id));
    toast({ title: "Gelöscht", description: "Daten entfernt." });
  };

  const handleLogout = () => {
    setIsLogoutLoading(true);
    signOut(auth).then(() => {
      window.location.href = '/';
    }).catch(() => setIsLogoutLoading(false));
  };

  const handleManualClockIn = async (emp: Employee) => {
    if (!firestore || !user) return;

    // Check for existing open entry to prevent duplicates
    if (timeEntries) {
      const existingOpen = timeEntries.find(e =>
        e.employeeId === emp.id &&
        (!e.entryType || e.entryType === 'WORK') &&
        !e.clockOutTime
      );
      if (existingOpen) {
        toast({ title: "Bereits eingestempelt", description: `${emp.fullName} hat bereits einen offenen Eintrag.`, variant: "destructive" });
        return;
      }
    }

    addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
      adminId: activeAdminUid,
      employeeId: emp.id,
      employeeName: emp.fullName,
      clockInTime: new Date().toISOString(),
      clockOutTime: null,
      entryType: 'WORK',
      exitType: null,
      sourceSystem: 'Admin-Dashboard (Manuell)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    toast({ title: "Eingestempelt", description: `${emp.fullName} wurde eingestempelt.` });
  };

  const handleManualPause = (emp: Employee) => {
    if (!firestore || !timeEntries) return;
    const openEntry = timeEntries
      .filter(e => e.employeeId === emp.id && (!e.entryType || e.entryType === 'WORK') && !e.clockOutTime)
      .sort((a, b) => b.clockInTime.localeCompare(a.clockInTime))[0];
    if (!openEntry) return;
    updateDocumentNonBlocking(doc(firestore, 'timeEntries', openEntry.id), {
      clockOutTime: new Date().toISOString(),
      exitType: 'PAUSE',
      updatedAt: new Date().toISOString(),
    });
    toast({ title: "Pause gesetzt", description: `${emp.fullName} ist jetzt in der Pause.` });
  };

  const handleManualClockOut = (emp: Employee) => {
    if (!firestore || !timeEntries) return;
    const status = statusMap.get(emp.id);
    const empWorkEntries = timeEntries
      .filter(e => e.employeeId === emp.id && (!e.entryType || e.entryType === 'WORK'))
      .sort((a, b) => b.clockInTime.localeCompare(a.clockInTime));

    if (status === 'present') {
      const openEntry = empWorkEntries.find(e => !e.clockOutTime);
      if (!openEntry) return;
      updateDocumentNonBlocking(doc(firestore, 'timeEntries', openEntry.id), {
        clockOutTime: new Date().toISOString(),
        exitType: 'END',
        updatedAt: new Date().toISOString(),
      });
    } else if (status === 'pause') {
      const lastEntry = empWorkEntries[0];
      if (!lastEntry) return;
      updateDocumentNonBlocking(doc(firestore, 'timeEntries', lastEntry.id), {
        exitType: 'END',
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: "Ausgestempelt", description: `${emp.fullName} wurde ausgestempelt.` });
  };

  // Stripe-Checkout entfernt — Trial wird intern verwaltet

  const handleExecuteCustomExport = () => {
    const customDate = setYear(setMonth(new Date(), Number(customExportMonth)), Number(customExportYear));
    handleExportAllCSV('custom', customDate);
    setIsCustomExportOpen(false);
  };

  const handleExecuteYearlyExport = () => {
    const customDate = setYear(new Date(), Number(customYearExportYear));
    handleExportAllCSV('custom-year', customDate);
    setIsCustomYearExportOpen(false);
  };

  const handleShareApp = (emp: Employee, method: 'copy' | 'whatsapp' | 'email') => {
    const url = window.location.origin + '/ma/' + emp.id;
    const text = `Hallo ${emp.fullName},\nhier ist dein persönlicher Link für die ZeitScan Mitarbeiter-App:\n\n${url}`;

    if (method === 'copy') {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link kopiert",
        description: "App-Link wurde in die Zwischenablage kopiert."
      });
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent('ZeitScan Mitarbeiter-App')}&body=${encodeURIComponent(text)}`, '_self');
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#E8EAEF] p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="space-y-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="inline-flex items-center text-primary font-medium hover:underline transition-all gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
                <ArrowLeft className="w-4 h-4" /> Zurück
              </Link>
              <div className="flex gap-2 items-center">
                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSupportDialogOpen(true)}
                    className={impersonateAdmin ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200" : "bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200"}
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    {impersonateAdmin ? `Fremdzugriff: ${impersonateAdmin.email}` : 'Support-Tool'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLogoutLoading} className="text-muted-foreground hover:text-destructive">
                  {isLogoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                  Abmelden
                </Button>
                {isFeatureActive ? (
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 border-none px-4 py-1.5 rounded-full shadow-md gap-2 text-white">
                    <Sparkles className="w-4 h-4" /> Trial: {trialDaysLeft} Tage übrig
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-4 py-1.5 rounded-full shadow-sm gap-2 border-destructive/30 bg-destructive/5 text-destructive">
                    <AlertTriangle className="w-4 h-4" /> Trial abgelaufen
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <LayoutDashboard className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">ZeitScan Management</h1>
                  <p className="text-muted-foreground">Mitarbeiterverwaltung & Kontrolle</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-xl bg-white border-2">
                      <Download className="w-4 h-4 mr-2" /> Export (CSV) <ChevronDown className="w-3 h-3 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl min-w-[240px]">
                    <DropdownMenuLabel>Zeitraum wählen</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleExportAllCSV('month')}>
                      Aktueller Monat
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExportAllCSV('year')}>
                      Aktuelles Jahr
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => setIsCustomExportOpen(true), 150);
                      }}
                      className="gap-2"
                    >
                      <CalendarDays className="w-4 h-4" /> Bestimmten Monat wählen...
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => setIsCustomYearExportOpen(true), 150);
                      }}
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" /> Jahresbericht wählen...
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleExportAllCSV('all')}>
                      Gesamte Historie
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl bg-white border-2">
                      <UserPlus className="w-4 h-4 mr-2" /> Mitarbeiter anlegen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                      <DialogTitle>Mitarbeiter anlegen</DialogTitle>
                      <DialogDescription>Geben Sie die Basisdaten des neuen Mitarbeiters ein.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label>Name</Label><Input placeholder="Vollständiger Name" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Position</Label><Input placeholder="z.B. Logistikleiter" value={newEmployeePosition} onChange={(e) => setNewEmployeePosition(e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Soll-Stunden</Label><Input type="number" placeholder="40" value={newEmployeeHours} onChange={(e) => setNewEmployeeHours(e.target.value)} /></div>
                        <div className="space-y-2">
                          <Label>Zeitraum</Label>
                          <Select value={newEmployeePeriod} onValueChange={(v: any) => setNewEmployeePeriod(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Wöchentlich</SelectItem>
                              <SelectItem value="monthly">Monatlich</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Urlaubstage (Jahr)</Label><Input type="number" placeholder="30" value={newEmployeeVacation} onChange={(e) => setNewEmployeeVacation(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Krankheitstage</Label><Input type="number" placeholder="0" value={newEmployeeSickDays} onChange={(e) => setNewEmployeeSickDays(e.target.value)} /></div>
                      </div>
                      {/* +Pause/-Pause Toggle — nur für Obstgärtla */}
                      {(adminData?.email === OBSTGAERTLA_EMAIL || (impersonateAdmin && allAdmins?.find(a => a.id === impersonateAdmin.uid)?.email === OBSTGAERTLA_EMAIL)) && (
                        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                            <div>
                              <p className="text-sm font-bold text-amber-800">+Pause Modus</p>
                              <p className="text-xs text-amber-700">AG bezahlt Pausenzeit – Netto bleibt unverändert</p>
                            </div>
                          </div>
                          <Switch
                            checked={newEmployeePauseAddMode}
                            onCheckedChange={setNewEmployeePauseAddMode}
                            id="new-pause-add-mode"
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter><Button onClick={handleAddEmployee} className="rounded-xl w-full">Mitarbeiter Speichern</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                <Link href="/scan"><Button className="rounded-xl shadow-lg">Terminal QR-Code</Button></Link>
              </div>
            </div>

            {isFeatureActive && trialDaysLeft <= 10 && (
              <Card className="border-amber-300 bg-amber-50 border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2 justify-center md:justify-start">
                      <AlertTriangle className="w-5 h-5" /> Nur noch {trialDaysLeft} Tage Trial übrig
                    </h3>
                    <p className="text-sm text-muted-foreground">Nach Ablauf der Testphase werden Premium-Funktionen deaktiviert. Abonnieren Sie jetzt, um den Übergang nahtlos zu gestalten.</p>
                  </div>
                  <Button
                    onClick={handleSubscribe}
                    disabled={isCheckoutLoading}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shrink-0 gap-2"
                  >
                    {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Jetzt abonnieren
                  </Button>
                </CardContent>
              </Card>
            )}
            {trialExpired && (
              <Card className="border-destructive/30 bg-destructive/5 border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-destructive flex items-center gap-2 justify-center md:justify-start">
                      <AlertTriangle className="w-5 h-5" /> Testphase abgelaufen
                    </h3>
                    <p className="text-sm text-muted-foreground">Ihre Testphase ist beendet. Premium-Funktionen sind deaktiviert. Starten Sie Ihr Abo, um fortzufahren.</p>
                  </div>
                  <Button
                    onClick={handleSubscribe}
                    disabled={isCheckoutLoading}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shrink-0 gap-2"
                  >
                    {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Jetzt Buchen
                  </Button>
                </CardContent>
              </Card>
            )}
          </header>

          {!isFeatureActive ? (
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white max-w-3xl mx-auto mt-12 mb-32">
              <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-12 text-center text-white space-y-6">
                <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center backdrop-blur-sm shadow-inner">
                  <Lock className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-bold">ZeitScan Testphase Beendet</h2>
                <p className="text-green-50 text-lg max-w-lg mx-auto leading-relaxed">
                  Ihre Testphase ist abgelaufen und die Projektfunktionen wurden temporär gesperrt.
                </p>
              </div>
              <CardContent className="p-10 text-center space-y-8">
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Sichern Sie sich jetzt unbegrenzten Zugriff auf alle Premium-Funktionen, das Mitarbeiter-Terminal und Ihre erfassten Daten, indem Sie auf den ZeitScan Pro-Plan upgraden.
                </p>

                <Button
                  size="lg"
                  onClick={handleSubscribe}
                  disabled={isCheckoutLoading}
                  className="rounded-full w-full max-w-sm h-16 text-lg font-bold shadow-xl hover:shadow-2xl transition-all border-4 border-green-100 bg-green-600 hover:bg-green-700 hover:scale-105 mx-auto flex"
                >
                  {isCheckoutLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CreditCard className="w-6 h-6 mr-2" />}
                  Pro Plan abonnieren
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="text-sm text-muted-foreground pt-4">
                  Sichere Bezahlung über Stripe.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="personal" className="space-y-8">
              <TabsList className="bg-white/50 p-1.5 rounded-2xl h-14 shadow-sm border-none">
                <TabsTrigger value="personal" className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Users className="w-4 h-4 mr-2" /> Personal
                </TabsTrigger>
                <TabsTrigger value="schedule" className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <CalendarCheck2 className="w-4 h-4 mr-2" /> Dienstplan
                </TabsTrigger>
                <TabsTrigger value="billing" className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <CreditCard className="w-4 h-4 mr-2" /> Abo & Abrechnung
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-0 space-y-8">
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white/90">
                  <CardHeader className="bg-white pb-6 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Personal suchen..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex items-center bg-muted/50 p-1 rounded-xl">
                          <Button variant={period === 'weekly' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg h-8" onClick={() => setPeriod('weekly')}>Wöchentlich</Button>
                          <Button variant={period === 'monthly' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg h-8" onClick={() => setPeriod('monthly')}>Monatlich</Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
                        <Label htmlFor="show-archived">Archivierte anzeigen</Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Ist ({period === 'weekly' ? 'Woche' : 'Monat'})</TableHead>
                          <TableHead>Soll</TableHead>
                          <TableHead>Zeitkonto</TableHead>
                          <TableHead>Resturlaub</TableHead>
                          <TableHead>Krank</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeesLoading ? (
                          <TableRow><TableCell colSpan={8} className="h-48 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                        ) : filteredEmployees.length > 0 ? (
                          filteredEmployees.map((emp) => {
                            const status = statusMap.get(emp.id) || 'absent';
                            const workedHours = workedHoursMap.get(emp.id) || 0;
                            const hasAnomaly = anomaliesMap.get(emp.id);
                            const activeAbsence = activeAbsenceMap.get(emp.id);

                            return (
                              <TableRow key={emp.id} className={`group hover:bg-primary/5 ${emp.isArchived ? 'opacity-60 bg-muted/20' : ''}`}>
                                <TableCell>
                                  {emp.isArchived ? (
                                    <Badge variant="outline">Archiviert</Badge>
                                  ) : status === 'present' ? (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1.5">
                                      <Circle className="w-2 h-2 fill-current animate-pulse" /> Anwesend
                                    </Badge>
                                  ) : status === 'pause' ? (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5">
                                      <Coffee className="w-3 h-3" /> Pause
                                    </Badge>
                                  ) : (status === 'sick' || status === 'vacation') ? (
                                    <div className="flex flex-col gap-1">
                                      <Badge className={status === 'sick' ? "bg-orange-100 text-orange-700 border-orange-200 gap-1.5" : "bg-blue-100 text-blue-700 border-blue-200 gap-1.5"}>
                                        {status === 'sick' ? <Stethoscope className="w-3 h-3" /> : <Palmtree className="w-3 h-3" />}
                                        {status === 'sick' ? 'Krank' : 'Urlaub'}
                                      </Badge>
                                      {activeAbsence && activeAbsence.clockOutTime && (
                                        <span className="text-[10px] text-muted-foreground font-medium leading-tight">
                                          {format(parseISO(activeAbsence.clockInTime), 'dd.MM.')} - {format(parseISO(activeAbsence.clockOutTime), 'dd.MM.yy')}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground">Abwesend</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setViewingLogsEmployee(emp)}
                                      className="font-bold hover:text-primary hover:underline transition-colors text-left"
                                    >
                                      {emp.fullName}
                                    </button>
                                    {hasAnomaly && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertTriangle
                                            className="w-4 h-4 text-amber-500 cursor-pointer animate-bounce"
                                            onClick={() => setViewingLogsEmployee(emp)}
                                          />
                                        </TooltipTrigger>
                                        <TooltipContent>Mehrfach-Logins erkannt! Klicken zum Klären.</TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{emp.position || 'Mitarbeiter'}</div>
                                </TableCell>
                                <TableCell>
                                  {isFeatureActive ? (
                                    <span className="font-mono font-medium">{workedHours.toFixed(2)}h</span>
                                  ) : (
                                    <LockIcon className="w-3.5 h-3.5 text-muted-foreground/30" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs font-medium">
                                    {emp.agreedHours || 0}h / {emp.agreedHoursPeriod === 'monthly' ? 'Monat' : 'Woche'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isFeatureActive ? (
                                    <Badge variant="outline" className={`font-mono ${(emp.overtimeBalance || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                      {(emp.overtimeBalance || 0).toFixed(2)}h
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground/30">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Palmtree className="w-3.5 h-3.5" />
                                    <span className={`text-xs font-medium ${(emp.vacationDays || 0) <= 5 ? 'text-destructive font-bold' : ''}`}>
                                      {emp.vacationDays || 0}d
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Stethoscope className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">{emp.sickDays || 0}d</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {!emp.isArchived && status !== 'sick' && status !== 'vacation' && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" title="Stempeluhr">
                                            <Clock className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Stempeluhr</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          {status === 'absent' && (
                                            <DropdownMenuItem onClick={() => handleManualClockIn(emp)}>
                                              <LogIn className="mr-2 h-4 w-4 text-green-600" />
                                              <span>Einstempeln</span>
                                            </DropdownMenuItem>
                                          )}
                                          {status === 'present' && (
                                            <>
                                              <DropdownMenuItem onClick={() => handleManualPause(emp)}>
                                                <Coffee className="mr-2 h-4 w-4 text-amber-600" />
                                                <span>Pause setzen</span>
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleManualClockOut(emp)}>
                                                <LogOut className="mr-2 h-4 w-4 text-destructive" />
                                                <span>Ausstempeln</span>
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                          {status === 'pause' && (
                                            <>
                                              <DropdownMenuItem onClick={() => handleManualClockIn(emp)}>
                                                <Play className="mr-2 h-4 w-4 text-green-600" />
                                                <span>Pause beenden</span>
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleManualClockOut(emp)}>
                                                <LogOut className="mr-2 h-4 w-4 text-destructive" />
                                                <span>Schicht beenden</span>
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600">
                                          <Share2 className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Link teilen</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setQrCodeEmployee(emp)}>
                                          <QrCode className="mr-2 h-4 w-4" />
                                          <span>QR-Code zum Scannen (App)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleShareApp(emp, 'whatsapp')}>
                                          <MessageCircle className="mr-2 h-4 w-4" />
                                          <span>Über WhatsApp senden</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleShareApp(emp, 'email')}>
                                          <Mail className="mr-2 h-4 w-4" />
                                          <span>Per E-Mail senden</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleShareApp(emp, 'copy')}>
                                          <Copy className="mr-2 h-4 w-4" />
                                          <span>Link in Zwischenablage kopieren</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => {
                                          setViewingLogsEmployee(emp);
                                        }}>
                                          <ClipboardList className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Zeitprotokoll & Historie</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost" size="icon"
                                          className="h-8 w-8 text-violet-600"
                                          title="Arbeitszeit nachtragen"
                                          onClick={() => {
                                            setManualWorkEmployee(emp);
                                            setManualWorkDate(format(new Date(), 'yyyy-MM-dd'));
                                            setManualWorkStart('08:00');
                                            setManualWorkEnd('17:00');
                                            setManualWorkBreak('30');
                                            setIsManualWorkEntryOpen(true);
                                          }}
                                        >
                                          <CalendarClock className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Arbeitszeit nachtragen</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => {
                                          setEditingEmployee(emp);
                                          setEditName(emp.fullName);
                                          setEditPosition(emp.position || '');
                                          setEditHours(String(emp.agreedHours || 40));
                                          setEditPeriod(emp.agreedHoursPeriod || 'weekly');
                                          setEditVacation(String(emp.vacationDays || 0));
                                          setEditSickDays(String(emp.sickDays || 0));
                                          setEditPauseAddMode(emp.pauseAddMode || false);
                                        }}>
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Mitarbeiter bearbeiten</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => setAdjustingEmployee(emp)} disabled={!isFeatureActive}>
                                          <History className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Saldo anpassen</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleArchive(emp)}>
                                          {emp.isArchived ? <RotateCcw className="w-4 h-4 text-green-600" /> : <Archive className="w-4 h-4 text-muted-foreground" />}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>{emp.isArchived ? 'Reaktivieren' : 'Archivieren'}</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteEmployee(emp)} disabled={!emp.isArchived}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Löschen (nur Archiv)</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow><TableCell colSpan={8} className="h-48 text-center text-muted-foreground">Keine Daten.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* ── Standort-Sperre (Location Lock) ── */}
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white/90">
                  <CardHeader className="bg-white pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <Wifi className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Standort-Sperre</CardTitle>
                        <CardDescription>Stempeln nur aus dem Firmen-WLAN erlauben</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-bold text-sm">Standort-Prüfung aktivieren</p>
                          <p className="text-xs text-muted-foreground">Mitarbeiter können nur vor Ort stempeln</p>
                        </div>
                      </div>
                      <Switch
                        id="location-lock"
                        checked={adminData?.locationLockEnabled === true}
                        onCheckedChange={(checked) => {
                          if (!firestore || !activeAdminUid) return;
                          updateDocumentNonBlocking(doc(firestore, 'adminUsers', activeAdminUid), {
                            locationLockEnabled: checked,
                          });
                          toast({
                            title: checked ? 'Standort-Sperre aktiviert' : 'Standort-Sperre deaktiviert',
                            description: checked
                              ? 'Mitarbeiter können nur noch aus dem Firmen-Netzwerk stempeln.'
                              : 'Stempeln ist jetzt von überall möglich.',
                          });
                        }}
                      />
                    </div>

                    {/* Save IP Button + Current Status */}
                    <div className="space-y-4">
                      <div className={`p-5 rounded-2xl border-2 transition-all ${adminData?.locationIp
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-dashed border-muted-foreground/20 bg-muted/10'
                        }`}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3 text-center sm:text-left">
                            <div className={`p-2.5 rounded-xl shrink-0 ${adminData?.locationIp ? 'bg-emerald-100' : 'bg-muted'
                              }`}>
                              <MapPin className={`w-5 h-5 ${adminData?.locationIp ? 'text-emerald-600' : 'text-muted-foreground'
                                }`} />
                            </div>
                            <div>
                              {adminData?.locationIp ? (
                                <>
                                  <p className="font-bold text-sm text-emerald-800">Firmen-IP gespeichert</p>
                                  <p className="text-xs text-emerald-600 font-mono">{adminData.locationIp}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-bold text-sm">Keine Firmen-IP hinterlegt</p>
                                  <p className="text-xs text-muted-foreground">Verbinden Sie sich mit dem Firmen-WLAN und klicken Sie auf den Button.</p>
                                </>
                              )}
                            </div>
                          </div>
                          {!impersonateAdmin ? (
                            <Button
                              variant={adminData?.locationIp ? 'outline' : 'default'}
                              className="rounded-xl gap-2 shrink-0 h-11 px-5"
                              disabled={isLocationSaving}
                              onClick={async () => {
                                if (!firestore || !activeAdminUid) return;
                                setIsLocationSaving(true);
                                try {
                                  const res = await fetch('/api/get-ip');
                                  const data = await res.json();
                                  if (!data.ip || data.ip === 'unknown') {
                                    toast({ title: 'Fehler', description: 'IP-Adresse konnte nicht ermittelt werden.', variant: 'destructive' });
                                    return;
                                  }
                                  await updateDocumentNonBlocking(doc(firestore, 'adminUsers', activeAdminUid), {
                                    locationIp: data.ip,
                                  });
                                  toast({
                                    title: 'Firmen-IP gespeichert',
                                    description: `Die IP ${data.ip} wurde als Standort hinterlegt.`,
                                  });
                                } catch (err) {
                                  toast({ title: 'Fehler', description: 'IP konnte nicht gespeichert werden.', variant: 'destructive' });
                                } finally {
                                  setIsLocationSaving(false);
                                }
                              }}
                            >
                              {isLocationSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                              {adminData?.locationIp ? 'IP aktualisieren' : 'Aktuelle IP speichern'}
                            </Button>
                          ) : (
                            adminData?.lastClientIp ? (
                              <Button
                                variant={adminData?.locationIp ? 'outline' : 'default'}
                                className="rounded-xl gap-2 shrink-0 h-11 px-5"
                                disabled={isLocationSaving}
                                onClick={async () => {
                                  if (!firestore || !activeAdminUid || !adminData?.lastClientIp) return;
                                  setIsLocationSaving(true);
                                  try {
                                    await updateDocumentNonBlocking(doc(firestore, 'adminUsers', activeAdminUid), {
                                      locationIp: adminData.lastClientIp,
                                    });
                                    toast({
                                      title: 'Firmen-IP gespeichert',
                                      description: `Die Kunden-IP ${adminData.lastClientIp} wurde als Standort übernommen.`,
                                    });
                                  } catch (err) {
                                    toast({ title: 'Fehler', description: 'IP konnte nicht gespeichert werden.', variant: 'destructive' });
                                  } finally {
                                    setIsLocationSaving(false);
                                  }
                                }}
                              >
                                {isLocationSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                                {adminData?.locationIp ? 'IP aktualisieren' : 'Kunden-IP übernehmen'}
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="px-4 py-2 bg-amber-100 text-amber-700 font-medium">
                                Warte auf Kunden-Besuch…
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      {/* Show last reported client IP when impersonating */}
                      {impersonateAdmin && (
                        <div className={`p-4 rounded-2xl border-2 transition-all ${
                          adminData?.lastClientIp
                            ? 'border-amber-200 bg-amber-50/50'
                            : 'border-dashed border-amber-300/30 bg-amber-50/20'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              adminData?.lastClientIp ? 'bg-amber-100' : 'bg-muted'
                            }`}>
                              <MapPin className={`w-5 h-5 ${
                                adminData?.lastClientIp ? 'text-amber-600' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              {adminData?.lastClientIp ? (
                                <>
                                  <p className="font-bold text-sm text-amber-800">Letzte Kunden-IP erkannt</p>
                                  <p className="text-xs text-amber-600 font-mono">{adminData.lastClientIp}</p>
                                  {adminData.lastClientIpAt && (
                                    <p className="text-[11px] text-amber-500 mt-0.5">
                                      Zuletzt gemeldet: {format(new Date(adminData.lastClientIpAt), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                                    </p>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="font-bold text-sm text-amber-800">Noch keine Kunden-IP bekannt</p>
                                  <p className="text-xs text-muted-foreground">Der Kunde oder ein Mitarbeiter muss einmal die App öffnen.</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info hint */}
                      <div className={`flex items-start gap-3 text-xs text-muted-foreground p-4 rounded-2xl ${
                        impersonateAdmin ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'
                      }`}>
                        <ShieldAlert className={`w-4 h-4 mt-0.5 shrink-0 ${
                          impersonateAdmin ? 'text-amber-500' : 'text-blue-500'
                        }`} />
                        <p>
                          {impersonateAdmin ? (
                            <>
                              <strong className="text-amber-700">Support-Modus:</strong> Bitten Sie den Kunden, die ZeitScan-App (Portal oder MA-Link) einmal im Firmen-WLAN zu öffnen. Die IP wird automatisch erkannt. Dann klicken Sie auf &quot;Kunden-IP übernehmen&quot; und aktivieren den Toggle oben.
                            </>
                          ) : (
                            <>
                              <strong className="text-blue-700">So funktioniert es:</strong> Stellen Sie sicher, dass Sie gerade mit dem WLAN Ihres Betriebes verbunden sind, und klicken Sie auf &quot;{adminData?.locationIp ? 'IP aktualisieren' : 'Aktuelle IP speichern'}&quot;. Danach können Mitarbeiter nur stempeln, wenn sie im selben Netzwerk sind.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============================================ DIENSTPLAN TAB ============================================ */}
              <TabsContent value="schedule" className="mt-0 space-y-6">
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white/90">
                  <CardHeader className="bg-white pb-6 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <CalendarCheck2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Wochendienstplan</h2>
                          <p className="text-sm text-muted-foreground">
                            {format(scheduleWeekStart, 'dd. MMMM', { locale: de })} – {format(addDays(scheduleWeekStart, 6), 'dd. MMMM yyyy', { locale: de })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setScheduleWeekStart(w => subDays(w, 7))}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setScheduleWeekStart(startOfWeekFn(new Date(), { weekStartsOn: 1 }))}>
                          Heute
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setScheduleWeekStart(w => addDays(w, 7))}>
                          <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                        <Button className="rounded-xl gap-2" onClick={() => setIsAddShiftOpen(true)}>
                          <Plus className="w-4 h-4" /> Schicht eintragen
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    {/* Weekly Grid */}
                    {(() => {
                      const days = Array.from({ length: 7 }, (_, i) => addDays(scheduleWeekStart, i));
                      const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
                      const activeEmployees = (employees || []).filter(e => !e.isArchived);

                      return (
                        <div className="min-w-[700px]">
                          {/* Header Row */}
                          <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b">
                            <div className="p-3 bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wide">Mitarbeiter</div>
                            {days.map((day, i) => (
                              <div key={i} className={`p-3 text-center border-l text-xs font-bold uppercase tracking-wide ${isToday(day) ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
                                }`}>
                                <div>{DAY_NAMES[i]}</div>
                                <div className="text-base font-black">{format(day, 'd')}</div>
                              </div>
                            ))}
                          </div>

                          {/* Employee Rows */}
                          {activeEmployees.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground text-sm">
                              Keine aktiven Mitarbeiter vorhanden.
                            </div>
                          ) : (
                            activeEmployees.map(emp => (
                              <div key={emp.id} className="grid grid-cols-[180px_repeat(7,1fr)] border-b hover:bg-primary/5 transition-colors group">
                                <div className="p-3 flex flex-col justify-center border-r">
                                  <span className="font-medium text-sm truncate">{emp.fullName}</span>
                                  <span className="text-[10px] text-muted-foreground">{emp.position || 'Mitarbeiter'}</span>
                                </div>
                                {days.map((day, di) => {
                                  const dateStr = format(day, 'yyyy-MM-dd');
                                  const dayShifts = (schedules || []).filter(s => s.employeeId === emp.id && s.date === dateStr);
                                  return (
                                    <div key={di} className={`p-1.5 border-l min-h-[64px] flex flex-col gap-1 ${isToday(day) ? 'bg-primary/5' : ''
                                      }`}>
                                      {dayShifts.map(shift => (
                                        <div key={shift.id} className="bg-primary text-primary-foreground rounded-lg px-2 py-1.5 text-[10px] font-medium flex items-start justify-between gap-1 group/shift">
                                          <div className="min-w-0">
                                            <div className="font-bold">{shift.shiftStart}{shift.shiftEnd ? `–${shift.shiftEnd}` : ' →'}</div>
                                            {shift.breakStart && (
                                              <div className="flex items-center gap-0.5 mt-0.5 opacity-80">
                                                <Coffee className="w-2.5 h-2.5 shrink-0" />
                                                <span>{shift.breakStart}{shift.breakEnd ? '–' + shift.breakEnd : ''}</span>
                                              </div>
                                            )}
                                            {shift.note && <div className="opacity-70 truncate max-w-[80px] mt-0.5 italic">{shift.note}</div>}
                                          </div>
                                          <button
                                            onClick={() => handleDeleteShift(shift)}
                                            className="opacity-0 group-hover/shift:opacity-100 transition-opacity text-primary-foreground/70 hover:text-primary-foreground mt-0.5 shrink-0"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                      {dayShifts.length === 0 && (
                                        <button
                                          onClick={() => {
                                            setShiftEmployee(emp.id);
                                            setShiftDate(dateStr);
                                            setIsAddShiftOpen(true);
                                          }}
                                          className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5"
                                        >
                                          <Plus className="w-3 h-3 text-muted-foreground/40" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Schedule info card */}
                <Card className="border-primary/20 bg-primary/5 border rounded-2xl">
                  <CardContent className="p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-bold text-primary">Dienstplan-Sperre aktiv</p>
                      <p className="text-muted-foreground">Mitarbeiter können sich am Terminal nur einstempeln, wenn sie für den heutigen Tag im Dienstplan eingetragen sind. Nicht eingeplante Mitarbeiter werden gesperrt.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-8">
                <Card className="border-none shadow-xl rounded-2xl bg-white/90 max-w-2xl mx-auto">
                  <CardHeader className="text-center p-8">
                    <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
                    <CardTitle>Abo &amp; Abrechnung</CardTitle>
                    <CardDescription>Verwalten Sie Ihre Pro-Funktionen und Ihr Abonnement.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-8">
                    {/* Current Plan Status */}
                    <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
                      <div className="space-y-1 text-center sm:text-left">
                        <h3 className="font-bold text-lg">ZeitScan Pro Plan</h3>
                        <p className="text-sm text-muted-foreground">Premium-Funktionen für Ihr Team</p>
                      </div>
                      {isFeatureActive ? (
                        <Badge className="bg-green-100 text-green-700 border-none px-4 py-2">Trial: {trialDaysLeft} Tage übrig</Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-none px-4 py-2">Trial abgelaufen</Badge>
                      )}
                    </div>

                    {/* Subscribe / Manage Section */}
                    <div className="space-y-4">
                      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 space-y-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                              <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-lg">ZeitScan Pro</h4>
                              <p className="text-sm text-muted-foreground">Unbegrenzter Zugriff auf alle Funktionen, unbegrenzte Mitarbeiter, CSV-Exporte, Dienstplanung und mehr.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              'Unbegrenzte Mitarbeiter',
                              'Terminal & QR-Codes',
                              'CSV-Exporte & Berichte',
                              'Dienstplanung',
                              'Urlaub- & Krankheitsverwaltung',
                              'Überstundenverwaltung',
                            ].map(feature => (
                              <div key={feature} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span className="text-muted-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <Separator />

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase font-semibold">Monatlich</p>
                              <p className="text-2xl font-black text-foreground">10 € <span className="text-sm font-normal text-muted-foreground">/ Monat</span></p>
                            </div>
                            <Button
                              size="lg"
                              onClick={handleSubscribe}
                              disabled={isCheckoutLoading}
                              className="rounded-xl h-12 px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all gap-2 shrink-0"
                            >
                              {isCheckoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                              {isFeatureActive ? 'Jetzt abonnieren' : 'Pro Plan aktivieren'}
                            </Button>
                          </div>

                          {isFeatureActive && (
                            <p className="text-xs text-center text-muted-foreground">
                              Abonnieren Sie jetzt — Ihre Testphase läuft nahtlos in das Abo über. Sichere Bezahlung über Stripe.
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Manage existing subscription */}
                      <Card className="border rounded-2xl">
                        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-sm text-muted-foreground text-center sm:text-left">
                            <p className="font-medium text-foreground">Bestehendes Abo verwalten</p>
                            <p>Rechnungen einsehen, Zahlungsmethode ändern oder Abo kündigen.</p>
                          </div>
                          <Button
                            variant="outline"
                            className="rounded-xl shrink-0 gap-2"
                            onClick={async () => {
                              try {
                                setIsCheckoutLoading(true);
                                const res = await fetch('/api/customer-portal', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: impersonateAdmin?.email || adminData?.email || user?.email })
                                });
                                const data = await res.json();
                                if (data.url) {
                                  window.location.href = data.url;
                                } else {
                                  toast({ title: 'Hinweis', description: data.error || 'Kundenportal nicht verfügbar.', variant: 'destructive' });
                                }
                              } catch {
                                toast({ title: 'Fehler', description: 'Verbindung zum Portal fehlgeschlagen.', variant: 'destructive' });
                              } finally {
                                setIsCheckoutLoading(false);
                              }
                            }}
                            disabled={isCheckoutLoading}
                          >
                            {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            Kundenportal öffnen
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-8 border-t space-y-4">
                      <div className="flex items-center gap-2 text-destructive font-bold">
                        <LockIcon className="w-5 h-5" />
                        <h4>Gefahrenzone</h4>
                      </div>
                      <Card className="border-destructive/20 bg-destructive/5 rounded-2xl">
                        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-sm text-muted-foreground text-center sm:text-left">
                            Alle Mitarbeiter und deren Zeitprotokolle löschen.
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="rounded-xl h-11 px-6">
                                Alle Daten unwiderruflich löschen
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sind Sie absolut sicher?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Diese Aktion kann nicht rückgängig gemacht werden. Alle Mitarbeiterprofile und deren gesamte Buchungshistorie werden dauerhaft gelöscht.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                                  Ja, alles löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Custom Export Month/Year Picker Dialog */}
      <Dialog open={isCustomExportOpen} onOpenChange={setIsCustomExportOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Monatsbericht wählen</DialogTitle>
            <DialogDescription>Wählen Sie den Monat und das Jahr aus.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monat</Label>
              <Select value={customExportMonth} onValueChange={setCustomExportMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS_LIST.map((m, i) => (
                    <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jahr</Label>
              <Select value={customExportYear} onValueChange={setCustomExportYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS_LIST.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleExecuteCustomExport} className="rounded-xl w-full">
              Export Starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Yearly Export Picker Dialog */}
      <Dialog open={isCustomYearExportOpen} onOpenChange={setIsCustomYearExportOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Jahresbericht wählen</DialogTitle>
            <DialogDescription>Wählen Sie das Jahr für den vollständigen Bericht aus.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Jahr</Label>
              <Select value={customYearExportYear} onValueChange={setCustomYearExportYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS_LIST.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleExecuteYearlyExport} className="rounded-xl w-full">
              Jahresbericht Exportieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Super Admin Support Access Dialog */}
      <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>🦸‍♂️ Fremdzugriff / Support-Modus</DialogTitle>
            <DialogDescription>
              Wählen Sie einen Kunden aus, um das System aus seiner Sicht zu laden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 py-4">
            {impersonateAdmin && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <p className="font-bold text-amber-800 text-sm mb-2">Aktuell im Fremdzugriff:</p>
                <div className="flex items-center justify-between">
                  <span className="text-amber-900">{impersonateAdmin.email}</span>
                  <Button size="sm" variant="outline" onClick={() => setImpersonateAdmin(null)} className="rounded-lg">
                    Zugriff beenden
                  </Button>
                </div>
              </div>
            )}
            {!allAdmins || allAdmins.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Lade Nutzer...</p>
            ) : (
              allAdmins.map((admin) => (
                <div key={admin.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border rounded-xl shadow-sm gap-2 hover:border-primary/50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{admin.email}</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      {admin.isPremium ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-1 py-0 text-[10px]">Premium</Badge> : <Badge variant="outline" className="text-[10px] px-1 py-0">Basic</Badge>}
                      <span className="truncate text-[10px]">Erstellt: {admin.createdAt ? format(parseISO(admin.createdAt), 'dd.MM.yyyy') : '-'}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 rounded-lg gap-1 min-w-[120px]"
                    disabled={impersonateAdmin?.uid === admin.id || user?.uid === admin.id}
                    onClick={() => {
                      setImpersonateAdmin({ uid: admin.id, email: admin.email });
                      setIsSupportDialogOpen(false);
                      toast({ title: "Fremdzugriff gestartet", description: `Sie sehen nun die Daten von ${admin.email}` });
                    }}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    {user?.uid === admin.id ? 'Mein Konto' : (impersonateAdmin?.uid === admin.id ? 'Aktiv' : 'Zugreifen')}
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSupportDialogOpen(false)} className="w-full rounded-xl">Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrCodeEmployee} onOpenChange={(o) => (!o) && setQrCodeEmployee(null)}>
        <DialogContent className="rounded-2xl max-w-sm flex flex-col items-center justify-center p-8 space-y-6">
          <DialogHeader className="text-center w-full">
            <DialogTitle>Mitarbeiter-App QR-Code</DialogTitle>
            <DialogDescription>{qrCodeEmployee?.fullName}</DialogDescription>
          </DialogHeader>
          {qrCodeEmployee && (
            <div className="p-4 bg-white rounded-xl shadow-sm border flex items-center justify-center">
              <QRCodeSVG value={window.location.origin + '/ma/' + qrCodeEmployee.id} size={200} />
            </div>
          )}
          <p className="text-sm text-center text-muted-foreground mt-4">Mitarbeiter kann diesen Code mit der Smartphone-Kamera scannen, um die Web-App direkt zu öffnen und zu installieren.</p>
          <Button onClick={() => setQrCodeEmployee(null)} className="w-full rounded-xl">Schließen</Button>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(o) => !o && setEditingEmployee(null)}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
            <DialogDescription>Passen Sie die Stammdaten und Soll-Stunden an.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Position</Label><Input value={editPosition} onChange={(e) => setEditPosition(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Soll-Stunden</Label><Input type="number" value={editHours} onChange={(e) => setEditHours(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Zeitraum</Label>
                  <Select value={editPeriod} onValueChange={(v: any) => setEditPeriod(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Resturlaub (Tage)</Label><Input type="number" value={editVacation} onChange={(e) => setEditVacation(e.target.value)} /></div>
                <div className="space-y-2"><Label>Gesamt-Krank</Label><Input type="number" value={editSickDays} onChange={(e) => setEditSickDays(e.target.value)} /></div>
              </div>
            </div>

            <Separator />

            {/* +Pause/-Pause Toggle — nur für Obstgärtla */}
            {(adminData?.email === OBSTGAERTLA_EMAIL || (impersonateAdmin && allAdmins?.find(a => a.id === impersonateAdmin.uid)?.email === OBSTGAERTLA_EMAIL)) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">+Pause Modus</p>
                      <p className="text-xs text-amber-700">AG bezahlt Pausenzeit – Netto bleibt unverändert</p>
                    </div>
                  </div>
                  {editPauseAddMode ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Aktiv</Badge>
                  ) : (
                    editingEmployee?.pauseAddModeActivatedAt && editingEmployee?.pauseAddModeDeactivatedAt ? (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-300">Historisch</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-gray-200">Inaktiv</Badge>
                    )
                  )}
                </div>

                {/* Status Info */}
                {editPauseAddMode && editingEmployee?.pauseAddModeActivatedAt && (
                  <p className="text-[10px] text-amber-700 px-1">
                    ✅ Aktiv seit {format(parseISO(editingEmployee.pauseAddModeActivatedAt), 'dd.MM.yyyy')}
                  </p>
                )}
                {!editPauseAddMode && editingEmployee?.pauseAddModeActivatedAt && editingEmployee?.pauseAddModeDeactivatedAt && (
                  <p className="text-[10px] text-gray-500 px-1">
                    📋 Historisch: {format(parseISO(editingEmployee.pauseAddModeActivatedAt), 'dd.MM.yyyy')} – {format(parseISO(editingEmployee.pauseAddModeDeactivatedAt), 'dd.MM.yyyy')}
                  </p>
                )}

                {/* Aktivieren / Deaktivieren Buttons */}
                <div className="flex gap-2">
                  {!editPauseAddMode && (
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => {
                        setPauseActivationMode('all');
                        setPauseActivationDate(format(new Date(), 'yyyy-MM-dd'));
                        setPauseActivationDialogOpen(true);
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" /> Aktivieren
                    </Button>
                  )}
                  {editPauseAddMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setPauseDeactivationMode('full');
                        setPauseDeactivationFrom(editingEmployee?.pauseAddModeActivatedAt?.slice(0, 10) || '');
                        setPauseDeactivationTo(format(new Date(), 'yyyy-MM-dd'));
                        setPauseDeactivationDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Deaktivieren
                    </Button>
                  )}
                </div>

                {/* AKTIVIERUNGS-Dialog */}
                <Dialog open={pauseActivationDialogOpen} onOpenChange={setPauseActivationDialogOpen}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                        +Pause Modus aktivieren
                      </DialogTitle>
                      <DialogDescription>
                        Ab wann soll der Modus für <strong>{editingEmployee?.fullName}</strong> gelten?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pause-activation"
                            checked={pauseActivationMode === 'all'}
                            onChange={() => setPauseActivationMode('all')}
                            className="accent-amber-600"
                          />
                          <span className="text-sm font-medium">Gesamter Zeitraum</span>
                        </label>
                        <p className="text-[10px] text-muted-foreground ml-5">Gilt für alle vorhandenen Einträge.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pause-activation"
                            checked={pauseActivationMode === 'date'}
                            onChange={() => setPauseActivationMode('date')}
                            className="accent-amber-600"
                          />
                          <span className="text-sm font-medium">Ab bestimmtem Datum</span>
                        </label>
                        {pauseActivationMode === 'date' && (
                          <Input
                            type="date"
                            className="h-9 text-xs ml-5 max-w-[200px]"
                            value={pauseActivationDate}
                            onChange={(e) => setPauseActivationDate(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" size="sm" onClick={() => setPauseActivationDialogOpen(false)}>Abbrechen</Button>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handlePauseActivation}>
                        <Sparkles className="w-3 h-3 mr-1" /> Aktivieren
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* DEAKTIVIERUNGS-Dialog (Fehlerkorrektur) */}
                <Dialog open={pauseDeactivationDialogOpen} onOpenChange={setPauseDeactivationDialogOpen}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-red-500" />
                        +Pause Modus deaktivieren
                      </DialogTitle>
                      <DialogDescription>
                        Fehlerkorrektur für <strong>{editingEmployee?.fullName}</strong>. Wie soll deaktiviert werden?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pause-deactivation"
                            checked={pauseDeactivationMode === 'full'}
                            onChange={() => setPauseDeactivationMode('full')}
                            className="accent-red-600"
                          />
                          <span className="text-sm font-medium">Vollständig rückwirkend</span>
                        </label>
                        <p className="text-[10px] text-muted-foreground ml-5">Komplett entfernen – als wäre der Modus nie aktiviert worden.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pause-deactivation"
                            checked={pauseDeactivationMode === 'range'}
                            onChange={() => setPauseDeactivationMode('range')}
                            className="accent-red-600"
                          />
                          <span className="text-sm font-medium">Nur für bestimmten Zeitraum behalten</span>
                        </label>
                        {pauseDeactivationMode === 'range' && (
                          <div className="grid grid-cols-2 gap-2 ml-5">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Von</Label>
                              <Input
                                type="date"
                                className="h-9 text-xs"
                                value={pauseDeactivationFrom}
                                onChange={(e) => setPauseDeactivationFrom(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Bis</Label>
                              <Input
                                type="date"
                                className="h-9 text-xs"
                                value={pauseDeactivationTo}
                                onChange={(e) => setPauseDeactivationTo(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" size="sm" onClick={() => setPauseDeactivationDialogOpen(false)}>Abbrechen</Button>
                      <Button size="sm" variant="destructive" onClick={handlePauseDeactivation}>
                        <RotateCcw className="w-3 h-3 mr-1" /> Deaktivieren
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <Separator />


            <div className="space-y-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                <CalendarPlus className="w-4 h-4" /> Zeitraum-Abwesenheit buchen
              </h4>
              <p className="text-[10px] text-muted-foreground uppercase">Erfassen Sie Urlaub oder Krankheit über den Kalender.</p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Von</Label>
                  <Input
                    type="date"
                    className="h-9 text-xs"
                    value={absenceStart}
                    onChange={(e) => setAbsenceStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Bis</Label>
                  <Input
                    type="date"
                    className="h-9 text-xs"
                    value={absenceEnd}
                    onChange={(e) => setAbsenceEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border text-xs">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px]">Typ:</Label>
                  <Select value={absenceType} onValueChange={(v: any) => setAbsenceType(v)}>
                    <SelectTrigger className="h-7 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACATION">Urlaub</SelectItem>
                      <SelectItem value="SICK">Krankheit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="font-bold text-primary">
                  {absenceDaysCount} Tage
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs gap-2"
                onClick={handleBookRangeAbsence}
                disabled={absenceDaysCount <= 0}
              >
                <Sparkles className="w-3 h-3" />
                In Bericht & Konto eintragen
              </Button>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button onClick={handleUpdateEmployee} className="rounded-xl w-full">Stammdaten Speichern</Button>
            <Button variant="ghost" onClick={() => setEditingEmployee(null)} className="w-full">Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Time Entry Dialog */}
      <Dialog open={!!editingTimeEntry} onOpenChange={(o) => !o && setEditingTimeEntry(null)}>
        <DialogContent className="rounded-2xl max-md">
          <DialogHeader>
            <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kommen</Label>
              <Input
                type="datetime-local"
                value={editInTime}
                onChange={(e) => setEditInTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Gehen</Label>
              <Input
                type="datetime-local"
                value={editOutTime}
                onChange={(e) => setEditOutTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateTimeEntry} className="rounded-xl w-full">Aktualisieren</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Absence Booking Dialog (from Logs) */}
      <Dialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
        <DialogContent className="rounded-2xl max-md">
          <DialogHeader>
            <DialogTitle>Abwesenheit buchen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input
                type="date"
                value={logAbsenceDate}
                onChange={(e) => setLogAbsenceDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={logAbsenceType} onValueChange={(v: any) => setLogAbsenceType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VACATION">Urlaub</SelectItem>
                  <SelectItem value="SICK">Krankheit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddSingleAbsence} className="rounded-xl w-full">Buchen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overtime Dialog */}
      <Dialog open={!!adjustingEmployee} onOpenChange={(o) => !o && setAdjustingEmployee(null)}>
        <DialogContent className="rounded-2xl max-md">
          <DialogHeader>
            <DialogTitle>Saldo anpassen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-xl flex justify-between items-center">
              <span className="text-sm">Aktuell:</span>
              <span className="font-bold font-mono">{(adjustingEmployee?.overtimeBalance || 0).toFixed(2)}h</span>
            </div>
            <div className="space-y-2">
              <Label>Stunden (+/-)</Label>
              <Input type="number" step="0.25" placeholder="z.B. 8 oder -4" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter><Button onClick={handleAdjustOvertime} className="rounded-xl w-full">Buchen</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Work Entry Dialog */}
      <Dialog open={isManualWorkEntryOpen} onOpenChange={(o) => { if (!o) { setIsManualWorkEntryOpen(false); setManualWorkEmployee(null); } }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-violet-600" />
              Arbeitszeit nachtragen
            </DialogTitle>
            <DialogDescription>
              {manualWorkEmployee?.fullName} — vergangene Arbeitszeit manuell eintragen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input
                type="date"
                value={manualWorkDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setManualWorkDate(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Beginn</Label>
                <Input type="time" value={manualWorkStart} onChange={(e) => setManualWorkStart(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label>Ende</Label>
                <Input type="time" value={manualWorkEnd} onChange={(e) => setManualWorkEnd(e.target.value)} className="rounded-xl h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pause (Minuten)</Label>
              <Input type="number" min="0" max="120" value={manualWorkBreak} onChange={(e) => setManualWorkBreak(e.target.value)} placeholder="30" className="rounded-xl h-11" />
            </div>
            {/* Live-Vorschau */}
            {(() => {
              try {
                const tin = new Date(`${manualWorkDate}T${manualWorkStart}:00`);
                const tout = new Date(`${manualWorkDate}T${manualWorkEnd}:00`);
                if (tout <= tin) return null;
                const brk = parseInt(manualWorkBreak) || 0;
                const net = Math.max(0, (tout.getTime() - tin.getTime()) / 60000 - brk);
                const h = Math.floor(net / 60); const m = Math.round(net % 60);
                return (
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-600" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Nettoarbeitszeit</p>
                        <p className="font-black text-slate-800">{h}h {String(m).padStart(2, '0')}min</p>
                      </div>
                    </div>
                    {brk > 0 && <div className="text-right"><p className="text-xs text-muted-foreground">Pause</p><p className="text-sm font-bold text-amber-600">{brk} min</p></div>}
                  </div>
                );
              } catch { return null; }
            })()}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setIsManualWorkEntryOpen(false); setManualWorkEmployee(null); }} className="rounded-xl">Abbrechen</Button>
            <Button onClick={handleAddManualWorkEntry} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Eintragen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={!!viewingLogsEmployee} onOpenChange={(o) => !o && setViewingLogsEmployee(null)}>
        <DialogContent className="rounded-2xl max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-4 pr-8">
            <div className="flex flex-row items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="flex items-center justify-between">
                  Zeitprotokoll & Historie: {viewingLogsEmployee?.fullName}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsAbsenceDialogOpen(true)}>
                      <CalendarPlus className="w-4 h-4 mr-2" /> Tag buchen
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => viewingLogsEmployee && handleExportCSV(viewingLogsEmployee)}>
                      <Download className="w-4 h-4 mr-2" /> CSV
                    </Button>
                  </div>
                </DialogTitle>
                <DialogDescription>Alle Arbeitszeiten und Historien.</DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                <Button variant={logsFilter === 'month' ? 'secondary' : 'ghost'} size="sm" className="h-8" onClick={() => setLogsFilter('month')}>Monat</Button>
                <Button variant={logsFilter === 'year' ? 'secondary' : 'ghost'} size="sm" className="h-8" onClick={() => setLogsFilter('year')}>Jahr</Button>
                <Button variant={logsFilter === 'all' ? 'secondary' : 'ghost'} size="sm" className="h-8" onClick={() => setLogsFilter('all')}>Alle</Button>
              </div>

              {/* Month/Year Navigation */}
              {logsFilter === 'month' && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                    if (logsMonth === 0) { setLogsMonth(11); setLogsYear(y => y - 1); }
                    else setLogsMonth(m => m - 1);
                  }}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Select value={String(logsMonth)} onValueChange={(v) => setLogsMonth(Number(v))}>
                      <SelectTrigger className="h-8 w-[120px] rounded-lg text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS_LIST.map((m, i) => (
                          <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={String(logsYear)} onValueChange={(v) => setLogsYear(Number(v))}>
                      <SelectTrigger className="h-8 w-[80px] rounded-lg text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS_LIST.map(y => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                    if (logsMonth === 11) { setLogsMonth(0); setLogsYear(y => y + 1); }
                    else setLogsMonth(m => m + 1);
                  }}>
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => {
                    setLogsMonth(new Date().getMonth());
                    setLogsYear(new Date().getFullYear());
                  }}>Heute</Button>
                </div>
              )}

              {logsFilter === 'year' && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setLogsYear(y => y - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Select value={String(logsYear)} onValueChange={(v) => setLogsYear(Number(v))}>
                    <SelectTrigger className="h-8 w-[80px] rounded-lg text-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS_LIST.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setLogsYear(y => y + 1)}>
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setLogsYear(new Date().getFullYear())}>Aktuell</Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 mt-4 px-1">
            <Card className="rounded-xl bg-primary/5 border-primary/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm"><Clock className="w-4 h-4 text-primary" /></div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Arbeit (Ist)</div>
                  <div className="text-lg font-bold">{logSummary.work.toFixed(2)}h</div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-blue-50 border-blue-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm"><Palmtree className="w-4 h-4 text-blue-600" /></div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Urlaub</div>
                  <div className="text-lg font-bold">{logSummary.vacation} Tage</div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-orange-50 border-orange-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm"><Stethoscope className="w-4 h-4 text-orange-600" /></div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Krank</div>
                  <div className="text-lg font-bold">{logSummary.sick} Tage</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum / Zeitraum</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Kommen</TableHead>
                  <TableHead>Gehen</TableHead>
                  <TableHead>Dauer</TableHead>
                  <TableHead>Geplante Pause</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries?.filter(e => {
                  if (e.employeeId !== viewingLogsEmployee?.id) return false;
                  const date = parseISO(e.clockInTime);
                  if (logsFilter === 'all') return true;
                  return (isAfter(date, logsDateRange.start) || isSameDay(date, logsDateRange.start)) &&
                         (isBefore(date, logsDateRange.end) || isSameDay(date, logsDateRange.end));
                })
                  .sort((a, b) => b.clockInTime.localeCompare(a.clockInTime))
                  .map(entry => {
                    const clockIn = parseISO(entry.clockInTime);
                    const clockOut = entry.clockOutTime ? parseISO(entry.clockOutTime) : null;
                    const entryType = entry.entryType || 'WORK';

                    let diff = 0;
                    if (entryType === 'WORK') {
                      diff = clockOut ? differenceInMinutes(clockOut, clockIn) / 60 : 0;
                    } else {
                      const days = clockOut ? differenceInDays(clockOut, clockIn) + 1 : 1;
                      diff = days * 8;
                    }

                    const isMultiDay = clockOut && !isSameDay(clockIn, clockOut);

                    // Look up planned break from schedule
                    const entryDateKey = format(clockIn, 'yyyy-MM-dd');
                    const plannedBreakEntry = entryType === 'WORK'
                      ? (schedules || []).find(s => s.employeeId === viewingLogsEmployee?.id && s.date === entryDateKey && s.breakStart)
                      : null;

                    return (
                      <TableRow key={entry.id} className={entryType === 'VACATION' ? 'bg-blue-50/30' : entryType === 'SICK' ? 'bg-orange-50/30' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isMultiDay ? (
                              <div className="flex items-center gap-1">
                                <span>{format(clockIn, 'dd.MM.')}</span>
                                <ArrowRight className="w-2 h-2" />
                                <span>{format(clockOut!, 'dd.MM.yyyy')}</span>
                              </div>
                            ) : (
                              format(clockIn, 'dd.MM.yyyy', { locale: de })
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entryType === 'WORK' ? (
                            <Badge variant="outline">Arbeit</Badge>
                          ) : entryType === 'VACATION' ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Urlaub</Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Krank</Badge>
                          )}
                        </TableCell>
                        <TableCell>{entryType === 'WORK' ? format(clockIn, 'HH:mm') : '-'}</TableCell>
                        <TableCell>
                          {entryType === 'WORK' ? (
                            clockOut ? format(clockOut, 'HH:mm') : <Badge variant="secondary">Offen</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="font-mono">{diff.toFixed(2)}h</TableCell>
                        <TableCell>
                          {plannedBreakEntry ? (
                            <div className="flex items-center gap-1 text-amber-700">
                              <Coffee className="w-3 h-3 shrink-0" />
                              <span className="text-xs font-medium">
                                {plannedBreakEntry.breakStart}{plannedBreakEntry.breakEnd ? '–' + plannedBreakEntry.breakEnd : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => {
                              setEditingTimeEntry(entry);
                              setEditInTime(format(parseISO(entry.clockInTime), "yyyy-MM-dd'T'HH:mm"));
                              setEditOutTime(entry.clockOutTime ? format(parseISO(entry.clockOutTime), "yyyy-MM-dd'T'HH:mm") : '');
                            }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                              if (confirm('Eintrag löschen?')) deleteDocumentNonBlocking(doc(firestore, 'timeEntries', entry.id));
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      {/* Add Shift Dialog */}
      <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-primary" />
              Schicht eintragen
            </DialogTitle>
            <DialogDescription>Planen Sie einen Mitarbeiter für eine Schicht ein.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label>Mitarbeiter</Label>
              <Select value={shiftEmployee} onValueChange={setShiftEmployee}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Mitarbeiter wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {(employees || []).filter(e => !e.isArchived).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input
                type="date"
                value={shiftDate}
                onChange={e => setShiftDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Schichtbeginn</Label>
              <div className="relative">
                <Play className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                <Input
                  type="time"
                  value={shiftStart}
                  onChange={e => setShiftStart(e.target.value)}
                  className="rounded-xl pl-9"
                />
              </div>
            </div>
            {shiftStart && shiftEnd && (() => {
              const [sh, sm] = shiftStart.split(':').map(Number);
              const [eh, em] = shiftEnd.split(':').map(Number);
              const mins = (eh * 60 + em) - (sh * 60 + sm);
              if (mins <= 0) return null;
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return (
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {h > 0 ? `${h} Std. ` : ''}{m > 0 ? `${m} Min.` : ''}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              );
            })()}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Schichtende <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                {shiftEnd && (
                  <button type="button" onClick={() => setShiftEnd('')} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Leeren</button>
                )}
              </div>
              <div className="relative">
                <LogOut className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                <Input
                  type="time"
                  value={shiftEnd}
                  onChange={e => setShiftEnd(e.target.value)}
                  className="rounded-xl pl-9"
                />
              </div>
            </div>

            {/* Break Time Section */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-600" />
                <Label className="text-amber-800 font-semibold text-sm">Pausenzeit <span className="font-normal text-amber-600/80">(optional)</span></Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Pause von</Label>
                  <div className="relative">
                    <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />
                    <Input
                      type="time"
                      value={shiftBreakStart}
                      onChange={e => setShiftBreakStart(e.target.value)}
                      className="rounded-xl pl-9 h-10 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Pause bis</Label>
                  <div className="relative">
                    <Play className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-600" />
                    <Input
                      type="time"
                      value={shiftBreakEnd}
                      onChange={e => setShiftBreakEnd(e.target.value)}
                      className="rounded-xl pl-9 h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
              {shiftBreakStart && shiftBreakEnd && (() => {
                const [bsh, bsm] = shiftBreakStart.split(':').map(Number);
                const [beh, bem] = shiftBreakEnd.split(':').map(Number);
                const mins = (beh * 60 + bem) - (bsh * 60 + bsm);
                if (mins <= 0) return null;
                return (
                  <p className="text-xs text-amber-700 font-medium text-center">
                    {mins} Minuten Pause eingeplant
                  </p>
                );
              })()}
              {(shiftBreakStart || shiftBreakEnd) && (
                <button
                  type="button"
                  onClick={() => { setShiftBreakStart(''); setShiftBreakEnd(''); }}
                  className="text-xs text-amber-600/70 hover:text-destructive transition-colors w-full text-center"
                >
                  Pause entfernen
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notiz (optional)</Label>
              <Input
                placeholder="z.B. Vertretung, Sonderschicht..."
                value={shiftNote}
                onChange={e => setShiftNote(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 shrink-0">
            <Button
              onClick={handleAddShift}
              disabled={!shiftEmployee || !shiftDate || !shiftStart}
              className="rounded-xl w-full"
            >
              <CalendarCheck2 className="w-4 h-4 mr-2" />
              Schicht speichern
            </Button>
            <Button variant="ghost" onClick={() => setIsAddShiftOpen(false)} className="w-full">Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#E8EAEF]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <AuthGate><DashboardContent /></AuthGate>
    </Suspense>
  );
}
